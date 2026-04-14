"""
Strategy Engineer Agent – ruft QIGA.evolve() auf und übergibt Kandidaten an den PaperTrader.

Der PaperTrader ist über :class:`quantum_inspired.qiga.QIGAEngine` injiziert; so bleibt
dieser Agent eine dünne Orchestrierungsschicht mit Logging und Explainability.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from agents._python_path import ensure_repo_root

ensure_repo_root()

if TYPE_CHECKING:
    from quantum_inspired.qiga import EvolutionResult, PaperTraderProtocol, QIGAEngine, SafetyOracleProtocol
    from quantum_inspired.settings import QuantumInspiredSettings

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class EvolutionRunReport:
    """Kurzbericht nach einem Evolutionslauf."""

    best_chromosome_id: str
    best_fitness: float
    generations: int
    explainability: dict[str, Any]
    paper_notes: list[str]
    log_lines: list[str]


class StrategyEngineerAgent:
    """
    Agent, der QIGA als Motor nutzt und neue Strategien (Chromosome) erzeugt.

    Attributes:
        engine: Konfigurierter :class:`QIGAEngine` mit Paper- und Safety-Implementierung.
    """

    def __init__(
        self,
        *,
        settings: "QuantumInspiredSettings | None" = None,
        paper_trader: "PaperTraderProtocol | None" = None,
        safety: "SafetyOracleProtocol | None" = None,
    ) -> None:
        from quantum_inspired.qiga import QIGAEngine
        from quantum_inspired.settings import get_settings

        s = settings or get_settings()
        self.engine = QIGAEngine(settings=s, paper_trader=paper_trader, safety=safety)
        self._settings = s

    def evolve_strategies(
        self,
        *,
        generations: int | None = None,
        population_size: int | None = None,
    ) -> "EvolutionResult":
        """
        Führt einen vollen QIGA-Lauf inkl. Paper-Eval pro Individuum aus.

        Raises:
            RuntimeError: wenn die Population kollabiert.
        """
        logger.info(
            "StrategyEngineer: start QIGA evolve pop=%s gen=%s paper_days=%s",
            population_size or self.engine.settings.qiga_population_size,
            generations or self.engine.settings.qiga_generations,
            self.engine.settings.paper_eval_days,
        )
        try:
            result = self.engine.evolve(
                generations=generations,
                population_size=population_size,
                pre_screen_safety=True,
            )
        except Exception as exc:
            logger.exception("QIGA evolution failed: %s", exc)
            raise
        logger.info(
            "StrategyEngineer: best id=%s fitness=%.4f",
            result.best.id,
            result.best_fitness.total,
        )
        return result

    def build_report(self, result: "EvolutionResult") -> EvolutionRunReport:
        """Erstellt einen erklärbaren Kurzbericht für Orchestrator / Memory."""
        paper_meta = result.best.metadata.get("paper", {})
        notes = []
        if isinstance(result.best.metadata.get("paper_eval_notes"), list):
            notes = list(result.best.metadata["paper_eval_notes"])
        lines = [
            f"best_chromosome={result.best.id}",
            f"fitness_total={result.best_fitness.total:.6f}",
            f"entanglement={result.best.metadata.get('entanglement_score')}",
            f"paper_sharpe_proxy={paper_meta.get('sharpe_proxy')}",
            f"paper_mdd={paper_meta.get('max_drawdown_pct')}",
        ]
        return EvolutionRunReport(
            best_chromosome_id=result.best.id,
            best_fitness=result.best_fitness.total,
            generations=len(result.history),
            explainability=dict(result.best_fitness.explainability),
            paper_notes=notes,
            log_lines=lines,
        )
