"""
Zentrale Pydantic-Settings für Aether Trader (Super-Bot).

Ein Präfix ``AETHER_`` für Umgebungsvariablen (z. B. ``AETHER_QIGA_POPULATION_SIZE``).
Umfasst QIGA, QLSTM/Forecasting, QSVM-Platzhalter, Safety, Risk, Exchanges, Laufzeit-Device
und Quantum-Backend-Switch (classical | pennylane | qiskit).

Hinweis: ``QuantumInspiredSettings`` ist ein Alias für :class:`AetherTraderSettings`,
damit bestehende Imports aus ``quantum_inspired.settings`` weiter funktionieren.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AetherTraderSettings(BaseSettings):
    """
    Vollständige Konfiguration für Evolution, QML, Safety und Anbindungen.

    Alle Schwellen sind bewusst konservativ gewählt (Safety-First); Produktion
    justiert über ENV / Secret Store.
    """

    model_config = SettingsConfigDict(
        env_prefix="AETHER_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Laufzeit & Device (PyTorch / später QPU) ---
    device: Literal["auto", "cpu", "cuda", "mps"] = Field(
        default="auto",
        description="auto wählt CUDA wenn verfügbar, sonst CPU",
    )

    # --- Quantum-Backend-Switcher ---
    quantum_backend: Literal["classical", "pennylane", "qiskit"] = Field(
        default="classical",
        description="classical = NumPy/PyTorch; pennylane/qiskit für echte QC-Pfade (Integration folgt)",
    )
    random_seed: int | None = Field(default=None, description="Globale Reproduzierbarkeit")

    # --- QIGA ---
    qiga_population_size: int = Field(default=48, ge=4)
    qiga_generations: int = Field(default=30, ge=1)
    qiga_mutation_rate: float = Field(default=0.12, ge=0.0, le=1.0)
    qiga_crossover_rate: float = Field(default=0.72, ge=0.0, le=1.0)
    qiga_elitism_count: int = Field(default=2, ge=0)
    qiga_rotation_strength: float = Field(default=0.15, ge=0.0, le=1.0)
    qiga_entanglement_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    qiga_chromosome_length: int = Field(default=16, ge=4)

    # --- QLSTM / Forecasting ---
    qlstm_input_size: int = Field(default=5, ge=1)
    qlstm_hidden_size: int = Field(default=64, ge=8)
    qlstm_num_layers: int = Field(default=2, ge=1)
    qlstm_dropout: float = Field(default=0.1, ge=0.0, le=0.9)
    qlstm_horizon: int = Field(default=1, ge=1)
    qlstm_train_epochs: int = Field(default=20, ge=1)
    qlstm_uncertainty_samples: int = Field(default=8, ge=1, description="MC-Dropout-ähnliche Samples für Epistemic-Proxy")

    # --- QSVM / Regime (Platzhalter-Schwellen für Classifier) ---
    qsvm_regime_confidence_min: float = Field(default=0.55, ge=0.0, le=1.0)
    qsvm_crisis_score_max: float = Field(default=0.85, ge=0.0, le=1.0)

    # --- Paper ---
    paper_eval_days: int = Field(default=30, ge=1)
    paper_only_on_safety_failure: bool = Field(default=True)

    # --- Safety (Oracle + allgemein) ---
    safety_max_drawdown_pct: float = Field(default=22.0, ge=0.0)
    safety_min_sharpe_proxy: float = Field(default=0.35, ge=0.0)
    oracle_shield_strict: bool = Field(default=True)
    oracle_vix_proxy_stress: float = Field(default=28.0, ge=0.0)
    oracle_volatility_spike_ratio: float = Field(default=2.2, ge=1.0)
    oracle_entanglement_shift_max: float = Field(default=0.35, ge=0.0, le=1.0)
    oracle_regime_shift_min: float = Field(default=0.4, ge=0.0, le=1.0)
    oracle_drawdown_crisis_pct: float = Field(default=32.0, ge=0.0)

    # --- Circuit Breaker ---
    cb_system_max_drawdown_pct: float = Field(default=25.0, ge=0.0)
    cb_strategy_max_drawdown_pct: float = Field(default=24.0, ge=0.0)
    cb_portfolio_max_drawdown_pct: float = Field(default=28.0, ge=0.0)
    cb_sharpe_floor: float = Field(default=0.25, ge=0.0)
    cb_liquidity_crash_proxy: float = Field(default=0.85, ge=0.0, le=1.0)

    # --- Risk Engine ---
    risk_max_position_fraction: float = Field(default=0.12, ge=0.0, le=1.0)
    risk_quantum_diversification_min: float = Field(default=0.15, ge=0.0, le=1.0)
    risk_quantum_volatility_max: float = Field(default=0.72, ge=0.0, le=2.0)
    risk_fail_on_hard_violation: bool = Field(default=True)

    # --- Exchanges (optional; primär über .env für Apps) ---
    alpaca_paper: bool = Field(default=True)
    alpaca_base_url: str = Field(default="https://paper-api.alpaca.markets")
    binance_testnet: bool = Field(default=True)
    bybit_testnet: bool = Field(default=True)

    # --- Autonomous loop ---
    autonomous_loop_interval_sec: float = Field(
        default=0.0,
        ge=0.0,
        description="Pause zwischen Zyklen in Sekunden; 0 = einmaliger Lauf",
    )
    autonomous_max_cycles: int | None = Field(
        default=None,
        description="None = unbegrenzt (bei interval>0)",
    )

    @model_validator(mode="after")
    def _cap_elitism(self) -> AetherTraderSettings:
        if self.qiga_elitism_count >= self.qiga_population_size:
            object.__setattr__(self, "qiga_elitism_count", max(1, self.qiga_population_size // 8))
        return self


# Rückwärtskompatibilität mit quantum_inspired.settings
QuantumInspiredSettings = AetherTraderSettings


@lru_cache
def get_settings() -> AetherTraderSettings:
    """Singleton-Settings pro Prozess (Cache invalidieren: get_settings.cache_clear())."""
    return AetherTraderSettings()
