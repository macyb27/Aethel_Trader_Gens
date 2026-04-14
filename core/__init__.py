"""
Zentrale Infrastruktur für Aether Trader: Settings, Logging, Quantum-Backend-Switch.

Alle Domänenmodule (quantum_inspired, safety, agents) sollen hierüber importieren,
um Konflikte und doppelte Konfiguration zu vermeiden.
"""

from __future__ import annotations

from core.logging import log_explainability, log_pipeline, setup_structured_logging
from core.quantum_backend import QuantumBackend, get_quantum_backend
from core.settings import AetherTraderSettings, QuantumInspiredSettings, get_settings

__all__ = [
    "AetherTraderSettings",
    "QuantumInspiredSettings",
    "QuantumBackend",
    "get_quantum_backend",
    "get_settings",
    "log_explainability",
    "log_pipeline",
    "setup_structured_logging",
]
