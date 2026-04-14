"""
Oracle Shield – erweiterte Krisenerkennung mit quanten-inspirierten Markt- und Strategie-Metriken.

Erkennt u. a.:
    - VIX-ähnliche Stress-Proxys (konfigurierbar),
    - Volatilitäts-Spikes (Verhältnis Kurz- zu Basis-Vol),
    - Regime-Shift-Signale (Trend-Knick / Mean-Shift-Proxy),
    - ungewöhnliche Quantum-Metriken (plötzliche Entanglement-Änderung, Extremwerte),
    - tiefe Drawdown-Warnungen.

Die Klasse ist bewusst **backend-agnostisch**: später können echte VIX-Daten oder
PennyLane-/Qiskit-gestützte Metriken in ``market_state`` / ``quantum_metrics`` injiziert werden.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from quantum_inspired.settings import QuantumInspiredSettings, get_settings

from safety._logging import log_safety_event

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class MarketStressState:
    """
    Markt- und Strategie-Kontext für die Krisenerkennung.

    Alle Felder optional; fehlende Werte werden konservativ interpretiert (fail-safe).
    """

    vix_proxy: float | None = None
    """Synthetischer oder echter Stress-Indikator (typ. skaliert 0–100, je nach Feed)."""

    volatility_short: float | None = None
    volatility_baseline: float | None = None
    regime_shift_signal: float | None = None
    """0 = ruhig, 1 = starker Verdacht auf Regimewechsel."""

    liquidity_stress_proxy: float | None = None
    """0 = normal, 1 = extremer Liquiditätsstress."""


@dataclass(slots=True)
class OracleShieldContext:
    """Vollständiger Kontext für einen Oracle-Shield-Lauf."""

    strategy_id: str
    paper_metrics: dict[str, float]
    quantum_metrics: dict[str, Any]
    explainability: dict[str, Any]
    market: MarketStressState = field(default_factory=MarketStressState)
    prior_entanglement: float | None = None
    """Vorheriger Entanglement-Score derselben Strategie / Linie für Δ-Erkennung."""


@dataclass(slots=True)
class OracleShieldVerdict:
    """Ergebnis der Oracle-Shield-Prüfung."""

    approved: bool
    crisis_level: str  # "none" | "elevated" | "high" | "critical"
    reasons: list[str]
    entanglement_shift: float | None
    volatility_spike_ratio: float | None
    vix_stress: bool
    regime_shift: bool
    details: dict[str, Any]


class OracleShield:
    """
    Erweiterte Crisis-Detection mit quanten-inspirierten Metriken.

    Attributes:
        settings: Schwellen und Strikt-Modus aus :class:`QuantumInspiredSettings`.
    """

    def __init__(self, settings: QuantumInspiredSettings | None = None) -> None:
        self._s = settings or get_settings()

    def evaluate(self, ctx: OracleShieldContext) -> OracleShieldVerdict:
        """
        Führt alle Oracle-Shield-Checks aus.

        Args:
            ctx: Strategie-, Paper-, Quantum- und Marktkontext.

        Returns:
            OracleShieldVerdict mit ``approved`` nur True, wenn **keine** der geprüften
            Bedingungen einen Eintrag in ``reasons`` erzeugt hat (maximale Strenge).
        """
        reasons: list[str] = []
        details: dict[str, Any] = {}

        ent = float(ctx.quantum_metrics.get("entanglement_score", 0.0))
        ent_shift: float | None = None
        if ctx.prior_entanglement is not None:
            ent_shift = abs(ent - float(ctx.prior_entanglement))
            details["entanglement_shift"] = ent_shift
            if ent_shift > self._s.oracle_entanglement_shift_max:
                reasons.append(
                    f"Oracle Shield: hoher Entanglement-Shift Δ={ent_shift:.3f} "
                    f"> max {self._s.oracle_entanglement_shift_max:.3f}"
                )

        vol_ratio: float | None = None
        m = ctx.market
        if m.volatility_short is not None and m.volatility_baseline not in (None, 0.0):
            base = max(float(m.volatility_baseline), 1e-9)
            vol_ratio = float(m.volatility_short) / base
            details["volatility_spike_ratio"] = vol_ratio
            if vol_ratio >= self._s.oracle_volatility_spike_ratio:
                reasons.append(
                    f"Oracle Shield: Volatilitäts-Spike ratio={vol_ratio:.2f} "
                    f">= {self._s.oracle_volatility_spike_ratio}"
                )

        vix_stress = False
        if m.vix_proxy is not None and float(m.vix_proxy) >= self._s.oracle_vix_proxy_stress:
            vix_stress = True
            reasons.append(
                f"Oracle Shield: VIX-Proxy Stress {float(m.vix_proxy):.1f} >= {self._s.oracle_vix_proxy_stress}"
            )

        regime_shift = False
        if m.regime_shift_signal is not None and float(m.regime_shift_signal) >= self._s.oracle_regime_shift_min:
            regime_shift = True
            reasons.append(
                f"Oracle Shield: Regime-Shift-Signal {float(m.regime_shift_signal):.2f} "
                f">= {self._s.oracle_regime_shift_min}"
            )

        mdd = float(ctx.paper_metrics.get("max_drawdown_pct", 0.0))
        if mdd >= self._s.oracle_drawdown_crisis_pct:
            reasons.append(
                f"Oracle Shield: Drawdown-Krise {mdd:.2f}% >= {self._s.oracle_drawdown_crisis_pct}%"
            )

        sharpe = float(ctx.paper_metrics.get("sharpe_proxy", 0.0))
        if sharpe < self._s.safety_min_sharpe_proxy:
            reasons.append(
                f"Oracle Shield: Sharpe-Proxy {sharpe:.3f} < {self._s.safety_min_sharpe_proxy}"
            )

        if self._s.oracle_shield_strict and ent > 0.95:
            reasons.append(
                f"Oracle Shield: extremes Entanglement {ent:.3f} (strict) — QC-/Korrelationsrisiko"
            )

        # Quantum-Backend-Überwachung (Platzhalter für echte QPU-Metriken)
        qbe = str(ctx.quantum_metrics.get("quantum_backend", self._s.quantum_backend))
        if qbe in ("pennylane", "qiskit"):
            details["quantum_backend_monitored"] = qbe
            # konservativ: Hardware-Pfad erfordert explizite Freigabe in Zukunft
            if ctx.quantum_metrics.get("qpu_calibration_ok") is False:
                reasons.append("Oracle Shield: Quantum-Backend meldet fehlende Kalibrierung")

        crisis_level = self._crisis_level(len(reasons), vix_stress, regime_shift, mdd)

        # Super-Bot: jede dokumentierte Verletzung blockt (maximale Sicherheit)
        approved = len(reasons) == 0

        verdict = OracleShieldVerdict(
            approved=approved,
            crisis_level=crisis_level,
            reasons=reasons,
            entanglement_shift=ent_shift,
            volatility_spike_ratio=vol_ratio,
            vix_stress=vix_stress,
            regime_shift=regime_shift,
            details=details,
        )
        log_safety_event(
            "oracle_shield_decision",
            component="oracle_shield",
            approved=verdict.approved,
            reasons=verdict.reasons,
            quantum={"entanglement": ent, "shift": ent_shift, "backend": qbe},
            metrics={"mdd": mdd, "sharpe_proxy": sharpe},
            extra={"strategy_id": ctx.strategy_id, "crisis_level": crisis_level},
        )
        logger.info(
            "OracleShield strategy=%s approved=%s crisis=%s reasons=%s",
            ctx.strategy_id,
            verdict.approved,
            verdict.crisis_level,
            "; ".join(verdict.reasons) if verdict.reasons else "none",
        )
        return verdict

    @staticmethod
    def _crisis_level(n_reasons: int, vix: bool, regime: bool, mdd: float) -> str:
        if mdd >= 35 or (vix and regime):
            return "critical"
        if n_reasons >= 3 or vix or regime:
            return "high"
        if n_reasons >= 1:
            return "elevated"
        return "none"
