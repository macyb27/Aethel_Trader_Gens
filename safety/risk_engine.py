"""
Zentrale Risk-Engine mit quanten-inspirierten Risiko-Metriken und Position-Sizing.

Berechnet u. a.:
    - **Quantum-Diversifikation:** abgeleitet aus Entanglement (niedriges Kreuz-Gen-Korrelat =
      höhere effektive Diversifikation im Strategieraum-Proxy),
    - **Quantum-Volatility:** Kombination aus Paper-Vol-Proxy und Entanglement (Kopplungsrisiko),
    - **Position-Sizing:** konservative Skalierung basierend auf Sharpe, Drawdown und Risk-Cap.

Später können echte Quantum-Backend-Metriken (Shot Noise, Gate-Fehler) in
``quantum_metrics`` eingespeist und hier berücksichtigt werden.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from core.settings import AetherTraderSettings, get_settings

from safety._logging import log_safety_event

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class RiskAssessment:
    """Ergebnis der Risk-Engine."""

    approved: bool
    quantum_diversification_score: float
    quantum_volatility: float
    suggested_position_fraction: float
    reasons: list[str]
    details: dict[str, Any]


class RiskEngine:
    """
    Bewertet Strategie-Risiko und schlägt Positionsgrößen vor.

    ``approved`` ist False, wenn harte Grenzen (Quantum-Vol, Diversifikation) verletzt werden
    und ``risk_fail_on_hard_violation`` aktiv ist.
    """

    def __init__(self, settings: AetherTraderSettings | None = None) -> None:
        self._s = settings or get_settings()

    def assess(
        self,
        *,
        strategy_id: str,
        chromosome_genes: list[float] | np.ndarray,
        paper_metrics: dict[str, float],
        quantum_metrics: dict[str, Any],
    ) -> RiskAssessment:
        """
        Führt Metrik-Berechnung und Gate-Checks aus.

        Args:
            strategy_id: ID für Logging.
            chromosome_genes: Gen-Vektor zur Diversifikations-Schätzung.
            paper_metrics: Kennzahlen aus Paper-Trading.
            quantum_metrics: u. a. ``entanglement_score``, optional ``qpu_error_rate``.

        Returns:
            RiskAssessment inkl. ``suggested_position_fraction`` in ``(0, risk_max_position_fraction]``.
        """
        reasons: list[str] = []
        genes = np.asarray(chromosome_genes, dtype=np.float64)
        ent = float(quantum_metrics.get("entanglement_score", 0.0))

        # Diversifikation: hohe Varianz der Gene + moderate Entkopplung
        gene_std = float(np.std(genes)) if genes.size else 0.0
        div_raw = min(1.0, gene_std * 1.8) * (1.0 - 0.5 * ent)
        q_div = float(np.clip(div_raw, 0.0, 1.0))

        vol_paper = float(paper_metrics.get("volatility_proxy", paper_metrics.get("max_drawdown_pct", 10.0) / 25.0))
        if vol_paper > 1.5:
            vol_paper = min(1.5, vol_paper / 100.0 + 0.2)  # grobe Normalisierung falls als % übergeben
        q_vol = float(np.clip(vol_paper * 0.6 + ent * 0.55, 0.0, 2.0))

        sharpe = float(paper_metrics.get("sharpe_proxy", 0.0))
        mdd = float(paper_metrics.get("max_drawdown_pct", 0.0))

        # Position sizing: Sharpe hoch, MDD niedrig → näher am Cap
        sharpe_term = max(0.0, min(1.0, sharpe / 2.0))
        dd_term = max(0.0, 1.0 - mdd / 40.0)
        vol_term = max(0.0, 1.0 - q_vol)
        frac = self._s.risk_max_position_fraction * sharpe_term * dd_term * vol_term * (0.5 + 0.5 * q_div)
        frac = float(np.clip(frac, 0.0, self._s.risk_max_position_fraction))

        if q_div < self._s.risk_quantum_diversification_min:
            msg = (
                f"RiskEngine: Quantum-Diversifikation {q_div:.3f} < min "
                f"{self._s.risk_quantum_diversification_min}"
            )
            reasons.append(msg)

        if q_vol > self._s.risk_quantum_volatility_max:
            reasons.append(
                f"RiskEngine: Quantum-Volatility {q_vol:.3f} > max {self._s.risk_quantum_volatility_max}"
            )

        qpu_err = quantum_metrics.get("qpu_error_rate")
        if qpu_err is not None and float(qpu_err) > 0.05:
            reasons.append(f"RiskEngine: QPU error rate {float(qpu_err):.4f} hoch — sizing reduziert")
            frac *= 0.5

        hard = q_div < self._s.risk_quantum_diversification_min or q_vol > self._s.risk_quantum_volatility_max
        approved = not (hard and self._s.risk_fail_on_hard_violation)

        details = {
            "gene_std": gene_std,
            "entanglement": ent,
            "quantum_diversification_score": q_div,
            "quantum_volatility": q_vol,
            "sizing_factors": {"sharpe": sharpe_term, "drawdown": dd_term, "vol": vol_term, "div": q_div},
        }
        log_safety_event(
            "risk_engine_assessment",
            component="risk_engine",
            approved=approved,
            reasons=reasons if reasons else None,
            quantum={"entanglement": ent, "q_div": q_div, "q_vol": q_vol},
            metrics={"sharpe": sharpe, "mdd": mdd, "position_fraction": frac},
            extra={"strategy_id": strategy_id},
        )
        logger.info(
            "RiskEngine strategy=%s approved=%s pos_frac=%.4f q_div=%.3f q_vol=%.3f",
            strategy_id,
            approved,
            frac,
            q_div,
            q_vol,
        )
        return RiskAssessment(
            approved=approved,
            quantum_diversification_score=q_div,
            quantum_volatility=q_vol,
            suggested_position_fraction=frac if approved else 0.0,
            reasons=reasons,
            details=details,
        )
