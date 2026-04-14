"""
Haupt-Orchestrierung (Python): Strategy Engineer → QIGA → Paper-Eval → Oracle Shield → Strategy Memory.

Vollständiger autonomer Loop:
    neue Strategie (Population) → Paper (30 Tage simuliert, konfigurierbar) → Fitness + Safety
    → bei Erfolg Persistenz im Vector Store + Flag ``live_candidate``.

Ausführung vom Repository-Root::

    python -m agents.orchestrator
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from agents._python_path import ensure_repo_root
from agents.strategy_engineer import StrategyEngineerAgent

ensure_repo_root()

from quantum_inspired.qiga import SafetyVerdict  # noqa: E402
from quantum_inspired.settings import get_settings  # noqa: E402
from strategy_memory.vector_store import StrategyRecord, StrategyVectorStore  # noqa: E402

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class AutonomousCycleResult:
    """Ergebnis eines Super-Bot-Zyklus."""

    success: bool
    stored_id: str | None
    live_candidate: bool
    safety: dict[str, Any]
    evolution_summary: dict[str, Any]
    explainability: dict[str, Any]
    errors: list[str] = field(default_factory=list)


class SuperBotOrchestrator:
    """
    Orchestriert StrategyEngineer, finale Safety-Prüfung und Strategy Memory.

    Die Evolution beinhaltet bereits Paper-Trading pro Chromosom; dieser Orchestrator
    führt eine **finale** Oracle-Shield-Prüfung auf dem besten Individuum aus und speichert
    nur freigegebene Kandidaten.
    """

    def __init__(self, *, store: StrategyVectorStore | None = None) -> None:
        self.settings = get_settings()
        self.engineer = StrategyEngineerAgent(settings=self.settings)
        self.store = store or StrategyVectorStore()
        self._explainability_log: list[dict[str, Any]] = []

    def run_autonomous_cycle(
        self,
        *,
        generations: int | None = None,
        population_size: int | None = None,
    ) -> AutonomousCycleResult:
        """
        Ein vollständiger Zyklus: evolve → best pick → safety → vector store.

        Returns:
            AutonomousCycleResult mit Status und Metadaten.
        """
        errors: list[str] = []
        try:
            evo = self.engineer.evolve_strategies(
                generations=generations,
                population_size=population_size,
            )
        except Exception as exc:
            logger.exception("Evolution phase failed")
            return AutonomousCycleResult(
                success=False,
                stored_id=None,
                live_candidate=False,
                safety={"approved": False, "reasons": [str(exc)]},
                evolution_summary={},
                explainability={},
                errors=[str(exc)],
            )

        report = self.engineer.build_report(evo)
        best = evo.best
        paper = best.metadata.get("paper", {})
        metrics = {
            "sharpe_proxy": float(paper.get("sharpe_proxy", 0.0)),
            "max_drawdown_pct": float(paper.get("max_drawdown_pct", 99.0)),
        }
        expl = dict(evo.best_fitness.explainability)
        expl["strategy_engineer_log"] = report.log_lines
        expl["quantum_features"] = {
            "entanglement_score": best.metadata.get("entanglement_score"),
            "rotation_gate_used": True,
            "backend": self.settings.quantum_backend,
        }
        self._explainability_log.append({"chromosome_id": best.id, "explainability": expl})

        verdict: SafetyVerdict
        try:
            verdict = self.engineer.engine.safety.check(metrics, expl)
        except Exception as exc:
            logger.exception("Safety check failed")
            errors.append(str(exc))
            verdict = SafetyVerdict(approved=False, reasons=["safety_check_exception"], risk_score=1.0)

        live_candidate = bool(verdict.approved and evo.best_fitness.total > 0.0)

        stored_id: str | None = None
        if verdict.approved:
            record = StrategyRecord(
                id=best.id,
                chromosome_genes=[float(x) for x in best.genes.tolist()],
                fitness_total=float(evo.best_fitness.total),
                explainability=expl,
                quantum_metrics={
                    "entanglement_score": float(best.metadata.get("entanglement_score", 0.0)),
                    "generation": best.generation,
                },
                paper_metrics={k: float(v) if isinstance(v, (int, float)) else v for k, v in paper.items()},
                safety_approved=verdict.approved,
                safety_reasons=list(verdict.reasons),
                live_candidate=live_candidate,
            )
            try:
                stored_id = self.store.add(record)
                logger.info(
                    "Orchestrator: stored strategy id=%s live_candidate=%s risk=%.3f",
                    stored_id,
                    live_candidate,
                    verdict.risk_score,
                )
            except Exception as exc:
                logger.exception("Vector store add failed")
                errors.append(f"store: {exc}")

        summary = {
            "best_fitness": evo.best_fitness.total,
            "history_tail": evo.history[-3:] if evo.history else [],
            "paper_eval_days": self.settings.paper_eval_days,
        }

        return AutonomousCycleResult(
            success=bool(verdict.approved and stored_id),
            stored_id=stored_id,
            live_candidate=live_candidate,
            safety={
                "approved": verdict.approved,
                "reasons": verdict.reasons,
                "risk_score": verdict.risk_score,
            },
            evolution_summary=summary,
            explainability=expl,
            errors=errors,
        )


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    orch = SuperBotOrchestrator()
    result = orch.run_autonomous_cycle()
    print(json.dumps(asdict(result), indent=2, default=str))
    return 0 if result.success or result.stored_id else 1


if __name__ == "__main__":
    raise SystemExit(main())
