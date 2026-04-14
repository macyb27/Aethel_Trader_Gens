"""
Quanten-inspirierte Komponenten: QIGA (Evolution), QAOA-inspirierte Optimierung, QLSTM-Forecasting.

Backend für spätere Anbindung von PennyLane/Qiskit über ``settings.QuantumInspiredSettings.quantum_backend``.
"""

from __future__ import annotations

from .qaoa_optimizer import QAOAInspiredConfig, QAOAInspiredOptimizer
from .qiga import (
    DefaultOracleShield,
    DefaultPaperTrader,
    EvolutionResult,
    MultiObjectiveFitness,
    QIGAEngine,
    SafetyOracleProtocol,
    SafetyVerdict,
    StrategyChromosome,
    entanglement_score,
    evolve_strategies,
    multi_objective_fitness,
    quantum_rotation_gate,
)
from .settings import QuantumInspiredSettings, get_settings

try:
    from .quantum_forecasting import QLSTMConfig, QLSTMForecaster, train_forecaster_stub
except ImportError:  # pragma: no cover - optional torch
    QLSTMConfig = None  # type: ignore[misc, assignment]
    QLSTMForecaster = None  # type: ignore[misc, assignment]
    train_forecaster_stub = None  # type: ignore[misc, assignment]

__all__ = [
    "DefaultOracleShield",
    "DefaultPaperTrader",
    "EvolutionResult",
    "MultiObjectiveFitness",
    "QAOAInspiredConfig",
    "QAOAInspiredOptimizer",
    "QIGAEngine",
    "QLSTMConfig",
    "QLSTMForecaster",
    "QuantumInspiredSettings",
    "SafetyOracleProtocol",
    "SafetyVerdict",
    "StrategyChromosome",
    "entanglement_score",
    "evolve_strategies",
    "get_settings",
    "multi_objective_fitness",
    "quantum_rotation_gate",
    "train_forecaster_stub",
]
