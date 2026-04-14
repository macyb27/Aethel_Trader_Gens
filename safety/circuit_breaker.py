"""
Mehrstufige Circuit Breaker: System-, Strategie- und Portfolio-Ebene.

Klare Trigger (Drawdown, Sharpe unter Schranke, Liquiditäts-Crash-Proxy) mit
priorisierten Urteilen. Ergänzt Oracle Shield; typischerweise werden alle
Breaker konsultiert und das strengste Ergebnis gewinnt.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from core.settings import AetherTraderSettings, get_settings

from safety._logging import log_safety_event

logger = logging.getLogger(__name__)


class BreakerLevel(str, Enum):
    """Ebene des Circuit Breakers."""

    SYSTEM = "system"
    STRATEGY = "strategy"
    PORTFOLIO = "portfolio"


@dataclass(slots=True)
class BreakerTrip:
    """Einzelner Auslöser."""

    level: BreakerLevel
    tripped: bool
    reason: str
    metric_name: str
    metric_value: float


@dataclass(slots=True)
class CircuitBreakerVerdict:
    """Gesamturteil aller Breaker."""

    approved: bool
    trips: list[BreakerTrip] = field(default_factory=list)
    worst_level: BreakerLevel | None = None

    def reasons(self) -> list[str]:
        return [t.reason for t in self.trips if t.tripped]


class MultiLevelCircuitBreaker:
    """
    Drei Ebenen mit konfigurierbaren Schwellen aus :class:`~core.settings.AetherTraderSettings`.

    **System-Level:** globale Drawdown-Grenze (institutioneller Not-Aus).
    **Strategy-Level:** pro Strategie / Paper-Lauf (Sharpe, Drawdown).
    **Portfolio-Level:** aggregierter Portfolio-Drawdown + Liquidität.
    """

    def __init__(self, settings: AetherTraderSettings | None = None) -> None:
        self._s = settings or get_settings()

    def evaluate(
        self,
        *,
        strategy_id: str,
        paper_metrics: dict[str, float],
        portfolio_metrics: dict[str, float] | None = None,
    ) -> CircuitBreakerVerdict:
        """
        Prüft alle Ebenen.

        Args:
            strategy_id: Kennung für Logs.
            paper_metrics: u. a. ``max_drawdown_pct``, ``sharpe_proxy``.
            portfolio_metrics: optional ``max_drawdown_pct``, ``liquidity_stress_proxy``.

        Returns:
            CircuitBreakerVerdict mit ``approved`` False sobald eine Ebene auslöst.
        """
        portfolio_metrics = portfolio_metrics or {}
        trips: list[BreakerTrip] = []

        mdd_paper = float(paper_metrics.get("max_drawdown_pct", 0.0))
        sharpe = float(paper_metrics.get("sharpe_proxy", 0.0))

        # System
        sys_trip = mdd_paper >= self._s.cb_system_max_drawdown_pct
        trips.append(
            BreakerTrip(
                level=BreakerLevel.SYSTEM,
                tripped=sys_trip,
                reason=f"System CB: strategy drawdown {mdd_paper:.2f}% >= {self._s.cb_system_max_drawdown_pct}%",
                metric_name="max_drawdown_pct",
                metric_value=mdd_paper,
            )
        )

        # Strategy
        strat_dd = mdd_paper >= self._s.cb_strategy_max_drawdown_pct
        strat_sh = sharpe < self._s.cb_sharpe_floor
        trips.append(
            BreakerTrip(
                level=BreakerLevel.STRATEGY,
                tripped=strat_dd,
                reason=f"Strategy CB: drawdown {mdd_paper:.2f}% >= {self._s.cb_strategy_max_drawdown_pct}%",
                metric_name="max_drawdown_pct",
                metric_value=mdd_paper,
            )
        )
        trips.append(
            BreakerTrip(
                level=BreakerLevel.STRATEGY,
                tripped=strat_sh,
                reason=f"Strategy CB: sharpe_proxy {sharpe:.3f} < floor {self._s.cb_sharpe_floor}",
                metric_name="sharpe_proxy",
                metric_value=sharpe,
            )
        )

        # Portfolio
        mdd_port = float(portfolio_metrics.get("max_drawdown_pct", mdd_paper))
        liq = float(portfolio_metrics.get("liquidity_stress_proxy", 0.0))
        port_dd = mdd_port >= self._s.cb_portfolio_max_drawdown_pct
        port_liq = liq >= self._s.cb_liquidity_crash_proxy
        trips.append(
            BreakerTrip(
                level=BreakerLevel.PORTFOLIO,
                tripped=port_dd,
                reason=f"Portfolio CB: drawdown {mdd_port:.2f}% >= {self._s.cb_portfolio_max_drawdown_pct}%",
                metric_name="portfolio_max_drawdown_pct",
                metric_value=mdd_port,
            )
        )
        trips.append(
            BreakerTrip(
                level=BreakerLevel.PORTFOLIO,
                tripped=port_liq,
                reason=f"Portfolio CB: liquidity stress {liq:.2f} >= {self._s.cb_liquidity_crash_proxy}",
                metric_name="liquidity_stress_proxy",
                metric_value=liq,
            )
        )

        fired = [t for t in trips if t.tripped]
        approved = len(fired) == 0
        worst: BreakerLevel | None = None
        if fired:
            order = {BreakerLevel.SYSTEM: 0, BreakerLevel.PORTFOLIO: 1, BreakerLevel.STRATEGY: 2}
            worst = min(fired, key=lambda t: order.get(t.level, 9)).level

        verdict = CircuitBreakerVerdict(approved=approved, trips=trips, worst_level=worst)
        log_safety_event(
            "circuit_breaker_decision",
            component="circuit_breaker",
            approved=verdict.approved,
            reasons=verdict.reasons(),
            metrics={"mdd_paper": mdd_paper, "sharpe": sharpe, "mdd_port": mdd_port, "liq": liq},
            extra={"strategy_id": strategy_id, "worst_level": worst.value if worst else None},
        )
        logger.info(
            "CircuitBreaker strategy=%s approved=%s trips=%d",
            strategy_id,
            approved,
            len(fired),
        )
        return verdict
