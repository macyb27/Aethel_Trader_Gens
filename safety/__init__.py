"""
Safety & Risk Layer – letzter Gatekeeper vor Live-Trading.

Komponenten:
    - :mod:`safety.oracle_shield` – Krisen- und Quantum-Metrik-Erkennung
    - :mod:`safety.circuit_breaker` – mehrstufige Breaker
    - :mod:`safety.risk_engine` – Risk-Metriken und Position-Sizing
"""

from __future__ import annotations

from safety.circuit_breaker import (
    BreakerLevel,
    BreakerTrip,
    CircuitBreakerVerdict,
    MultiLevelCircuitBreaker,
)
from safety.oracle_shield import (
    MarketStressState,
    OracleShield,
    OracleShieldContext,
    OracleShieldVerdict,
)
from safety.risk_engine import RiskAssessment, RiskEngine

__all__ = [
    "BreakerLevel",
    "BreakerTrip",
    "CircuitBreakerVerdict",
    "MarketStressState",
    "MultiLevelCircuitBreaker",
    "OracleShield",
    "OracleShieldContext",
    "OracleShieldVerdict",
    "RiskAssessment",
    "RiskEngine",
]
