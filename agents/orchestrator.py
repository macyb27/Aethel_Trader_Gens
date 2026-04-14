"""
Haupt-Orchestrierung (Python): Strategy Engineer → QIGA → Paper-Eval → vollständiger Safety-Layer → Strategy Memory.

Safety-Pipeline (alle müssen **bestehen** für ``live_ready`` / Speicherung als live-fähig):
    1. Oracle Shield (Crisis, Entanglement-Shift, Vol-Spike, Regime, Drawdown)
    2. Multi-Level Circuit Breaker (System / Strategy / Portfolio)
    3. Risk Engine (Quantum-Diversifikation, Quantum-Volatility, Position-Sizing)

Bei jedem Fehler oder Safety-Violation: **Paper-Only-Modus** (kein Live-Ready), strukturierte Logs.

Ausführung vom Repository-Root::

    PYTHONPATH=. python3 -m agents.orchestrator
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import asdict, dataclass, field
from typing import Any

from agents._python_path import ensure_repo_root
from agents.strategy_engineer import StrategyEngineerAgent

ensure_repo_root()

from core.settings import get_settings  # noqa: E402
from safety._logging import log_safety_event  # noqa: E402
from safety.circuit_breaker import MultiLevelCircuitBreaker  # noqa: E402
from safety.oracle_shield import MarketStressState, OracleShield, OracleShieldContext  # noqa: E402
from safety.risk_engine import RiskEngine  # noqa: E402
from strategy_memory.vector_store import StrategyRecord, StrategyVectorStore  # noqa: E402

logger = logging.getLogger(__name__)


def _oracle_verdict_dict(v: Any) -> dict[str, Any]:
    from safety.oracle_shield import OracleShieldVerdict  # noqa: PLC0415

    if not isinstance(v, OracleShieldVerdict):
        return {}
    return {
        "approved": v.approved,
        "crisis_level": v.crisis_level,
        "reasons": list(v.reasons),
        "entanglement_shift": v.entanglement_shift,
        "volatility_spike_ratio": v.volatility_spike_ratio,
        "vix_stress": v.vix_stress,
        "regime_shift": v.regime_shift,
        "details": dict(v.details),
    }


def _risk_assessment_dict(v: Any) -> dict[str, Any]:
    from safety.risk_engine import RiskAssessment  # noqa: PLC0415

    if not isinstance(v, RiskAssessment):
        return {}
    return {
        "approved": v.approved,
        "quantum_diversification_score": v.quantum_diversification_score,
        "quantum_volatility": v.quantum_volatility,
        "suggested_position_fraction": v.suggested_position_fraction,
        "reasons": list(v.reasons),
        "details": dict(v.details),
    }


@dataclass(slots=True)
class AutonomousCycleResult:
    """Ergebnis eines Super-Bot-Zyklus."""

    success: bool
    stored_id: str | None
    live_ready: bool
    paper_only: bool
    safety_pipeline: dict[str, Any]
    evolution_summary: dict[str, Any]
    explainability: dict[str, Any]
    errors: list[str] = field(default_factory=list)


def _paper_dict_from_metadata(paper: dict[str, Any]) -> dict[str, float]:
    """Normalisiert Paper-Metriken für Safety/Risk (inkl. Vol-Proxy)."""
    sharpe = float(paper.get("sharpe_proxy", 0.0))
    mdd = float(paper.get("max_drawdown_pct", 0.0))
    vol_proxy = float(paper.get("volatility_proxy", min(1.2, mdd / 30.0 + abs(sharpe) * 0.08)))
    return {
        "sharpe_proxy": sharpe,
        "max_drawdown_pct": mdd,
        "total_return_pct": float(paper.get("total_return_pct", 0.0)),
        "win_rate": float(paper.get("win_rate", 0.0)),
        "trades": float(paper.get("trades", 0)),
        "volatility_proxy": vol_proxy,
    }


class SuperBotOrchestrator:
    """
    Orchestriert QIGA, Paper, Oracle Shield, Circuit Breaker und Risk Engine.

    Nur wenn **alle** drei Komponenten grün sind, wird ``live_ready=True`` gesetzt und
    die Strategie persistiert (mit vollständiger Explainability).
    """

    def __init__(self, *, store: StrategyVectorStore | None = None) -> None:
        self.settings = get_settings()
        self.engineer = StrategyEngineerAgent(settings=self.settings)
        self.store = store or StrategyVectorStore()
        self.oracle = OracleShield(self.settings)
        self.breakers = MultiLevelCircuitBreaker(self.settings)
        self.risk = RiskEngine(self.settings)
        self._paper_only_forced = False

    @property
    def paper_only_mode(self) -> bool:
        """True, sobald Fail-Safe Paper-Only aktiviert wurde."""
        return self._paper_only_forced

    def force_paper_only(self, reason: str) -> None:
        """Aktiviert Paper-Only (z. B. nach kritischem Fehler)."""
        self._paper_only_forced = True
        log_safety_event(
            "paper_only_activated",
            component="pipeline",
            approved=False,
            reasons=[reason],
            extra={"fail_safe": True},
        )
        logger.critical("SuperBot: PAPER-ONLY aktiviert — %s", reason)

    def run_autonomous_cycle(
        self,
        *,
        generations: int | None = None,
        population_size: int | None = None,
        market: MarketStressState | None = None,
        prior_entanglement: float | None = None,
        portfolio_metrics: dict[str, float] | None = None,
    ) -> AutonomousCycleResult:
        """
        Vollständiger Zyklus: QIGA → Paper → Oracle Shield → Circuit Breaker → Risk Engine → Store.

        Args:
            generations: optional QIGA-Generationen.
            population_size: optional Populationsgröße.
            market: optional Marktstress für Oracle Shield.
            prior_entanglement: optional für Entanglement-Shift-Erkennung.
            portfolio_metrics: optional Portfolio-Drawdown / Liquidität für CB.

        Returns:
            AutonomousCycleResult; ``live_ready`` nur bei voller Safety-Freigabe.
        """
        errors: list[str] = []
        market = market or MarketStressState()

        try:
            evo = self.engineer.evolve_strategies(
                generations=generations,
                population_size=population_size,
            )
        except Exception as exc:
            logger.exception("Evolution phase failed")
            if self.settings.paper_only_on_safety_failure:
                self.force_paper_only(f"Evolution/critical error: {exc}")
            return AutonomousCycleResult(
                success=False,
                stored_id=None,
                live_ready=False,
                paper_only=True,
                safety_pipeline={"error": str(exc)},
                evolution_summary={},
                explainability={},
                errors=[str(exc)],
            )

        report = self.engineer.build_report(evo)
        best = evo.best
        paper_raw = dict(best.metadata.get("paper", {}))
        paper = _paper_dict_from_metadata(paper_raw)

        quantum_metrics: dict[str, Any] = {
            "entanglement_score": float(best.metadata.get("entanglement_score", 0.0)),
            "generation": best.generation,
            "quantum_backend": self.settings.quantum_backend,
        }
        expl: dict[str, Any] = {
            **dict(evo.best_fitness.explainability),
            "strategy_engineer_log": report.log_lines,
            "quantum_features": {
                "entanglement_score": quantum_metrics["entanglement_score"],
                "rotation_gate_used": True,
                "backend": self.settings.quantum_backend,
            },
        }

        # --- 1) Oracle Shield ---
        oracle_ctx = OracleShieldContext(
            strategy_id=best.id,
            paper_metrics=paper,
            quantum_metrics=quantum_metrics,
            explainability=expl,
            market=market,
            prior_entanglement=prior_entanglement,
        )
        try:
            oracle_v = self.oracle.evaluate(oracle_ctx)
        except Exception as exc:
            logger.exception("Oracle Shield exception")
            errors.append(f"oracle_shield: {exc}")
            if self.settings.paper_only_on_safety_failure:
                self.force_paper_only(f"Oracle Shield failure: {exc}")
            oracle_v = None

        # --- 2) Circuit Breaker ---
        try:
            cb_v = self.breakers.evaluate(
                strategy_id=best.id,
                paper_metrics=paper,
                portfolio_metrics=portfolio_metrics,
            )
        except Exception as exc:
            logger.exception("Circuit breaker exception")
            errors.append(f"circuit_breaker: {exc}")
            if self.settings.paper_only_on_safety_failure:
                self.force_paper_only(f"Circuit breaker failure: {exc}")
            cb_v = None

        # --- 3) Risk Engine ---
        try:
            risk_v = self.risk.assess(
                strategy_id=best.id,
                chromosome_genes=best.genes.tolist(),
                paper_metrics=paper,
                quantum_metrics=quantum_metrics,
            )
        except Exception as exc:
            logger.exception("Risk engine exception")
            errors.append(f"risk_engine: {exc}")
            if self.settings.paper_only_on_safety_failure:
                self.force_paper_only(f"Risk engine failure: {exc}")
            risk_v = None

        oracle_ok = oracle_v is not None and oracle_v.approved
        cb_ok = cb_v is not None and cb_v.approved
        risk_ok = risk_v is not None and risk_v.approved

        all_ok = oracle_ok and cb_ok and risk_ok
        paper_only = self._paper_only_forced or not all_ok

        if oracle_v and not oracle_v.approved:
            msg = (
                f"Strategy {best.id} wurde von Oracle Shield blockiert: "
                f"{'; '.join(oracle_v.reasons) if oracle_v.reasons else 'crisis signals'}"
            )
            logger.warning(msg)
            log_safety_event(
                "strategy_blocked",
                component="pipeline",
                approved=False,
                reasons=oracle_v.reasons,
                quantum={"crisis_level": oracle_v.crisis_level, "entanglement_shift": oracle_v.entanglement_shift},
                extra={"strategy_id": best.id, "stage": "oracle_shield"},
            )

        if cb_v and not cb_v.approved:
            logger.warning(
                "Strategy %s: Circuit Breaker ausgelöst (%s)",
                best.id,
                "; ".join(cb_v.reasons()),
            )
            log_safety_event(
                "strategy_blocked",
                component="pipeline",
                approved=False,
                reasons=cb_v.reasons(),
                extra={"strategy_id": best.id, "stage": "circuit_breaker", "worst": cb_v.worst_level},
            )

        if risk_v and not risk_v.approved:
            logger.warning(
                "Strategy %s: Risk Engine blockiert — %s",
                best.id,
                "; ".join(risk_v.reasons),
            )
            log_safety_event(
                "strategy_blocked",
                component="pipeline",
                approved=False,
                reasons=risk_v.reasons,
                quantum=risk_v.details,
                extra={"strategy_id": best.id, "stage": "risk_engine"},
            )

        live_ready = bool(all_ok and not paper_only)
        if not all_ok and self.settings.paper_only_on_safety_failure:
            self._paper_only_forced = True

        safety_pipeline: dict[str, Any] = {
            "oracle_shield": _oracle_verdict_dict(oracle_v) if oracle_v else None,
            "circuit_breaker": {
                "approved": cb_v.approved if cb_v else False,
                "reasons": cb_v.reasons() if cb_v else [],
                "worst_level": cb_v.worst_level.value if cb_v and cb_v.worst_level else None,
            }
            if cb_v
            else None,
            "risk_engine": _risk_assessment_dict(risk_v) if risk_v else None,
            "all_checks_passed": all_ok,
            "paper_only": paper_only,
        }

        expl["safety_pipeline"] = safety_pipeline
        expl["live_ready"] = live_ready

        stored_id: str | None = None
        # Speicherung: immer Audit-Trail; live_candidate nur bei live_ready
        record = StrategyRecord(
            id=best.id,
            chromosome_genes=[float(x) for x in best.genes.tolist()],
            fitness_total=float(evo.best_fitness.total),
            explainability=expl,
            quantum_metrics=quantum_metrics,
            paper_metrics=paper,
            safety_approved=all_ok,
            safety_reasons=(
                (oracle_v.reasons if oracle_v else [])
                + (cb_v.reasons() if cb_v else [])
                + (risk_v.reasons if risk_v else [])
            ),
            live_candidate=live_ready,
        )
        try:
            stored_id = self.store.add(record)
            log_safety_event(
                "strategy_persisted",
                component="pipeline",
                approved=all_ok,
                reasons=None if all_ok else record.safety_reasons,
                metrics={"fitness": evo.best_fitness.total},
                extra={"strategy_id": best.id, "live_ready": live_ready, "stored_id": stored_id},
            )
            logger.info(
                "Orchestrator: stored id=%s live_ready=%s paper_only=%s",
                stored_id,
                live_ready,
                paper_only,
            )
        except Exception as exc:
            logger.exception("Vector store add failed")
            errors.append(f"store: {exc}")
            if self.settings.paper_only_on_safety_failure:
                self.force_paper_only(f"Store failure: {exc}")

        summary = {
            "best_fitness": evo.best_fitness.total,
            "history_tail": evo.history[-3:] if evo.history else [],
            "paper_eval_days": self.settings.paper_eval_days,
        }

        return AutonomousCycleResult(
            success=bool(all_ok and stored_id),
            stored_id=stored_id,
            live_ready=live_ready,
            paper_only=paper_only,
            safety_pipeline=safety_pipeline,
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
    return 0 if result.live_ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
