"""
Konfiguration für quanten-inspirierte Module (Pydantic Settings).

Umgebungsvariablen optional via Präfix ``AETHER_`` (z. B. ``AETHER_QIGA_POPULATION_SIZE``).
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class QuantumInspiredSettings(BaseSettings):
    """Zentrale Settings für QIGA, Paper-Eval und spätere QC-Backends."""

    model_config = SettingsConfigDict(
        env_prefix="AETHER_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # QIGA
    qiga_population_size: int = Field(default=48, ge=4, description="Populationsgröße")
    qiga_generations: int = Field(default=30, ge=1, description="Evolutionsgenerationen pro Lauf")
    qiga_mutation_rate: float = Field(default=0.12, ge=0.0, le=1.0)
    qiga_crossover_rate: float = Field(default=0.72, ge=0.0, le=1.0)
    qiga_elitism_count: int = Field(default=2, ge=0)
    qiga_rotation_strength: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
        description="Stärke des quanten-inspirierten Rotationsoperators",
    )
    qiga_entanglement_weight: float = Field(
        default=0.25,
        ge=0.0,
        le=1.0,
        description="Gewicht für Entanglement-Score in Fitness",
    )
    qiga_chromosome_length: int = Field(default=16, ge=4, description="Anzahl Gene pro Chromosom")

    # Paper / Safety
    paper_eval_days: int = Field(default=30, ge=1, description="Simulierte Handelstage für Paper-Eval")
    safety_max_drawdown_pct: float = Field(default=22.0, ge=0.0)
    safety_min_sharpe_proxy: float = Field(default=0.35, ge=0.0)
    oracle_shield_strict: bool = Field(default=True)

    # --- Oracle Shield (Crisis & Quantum-Metriken) ---
    oracle_vix_proxy_stress: float = Field(
        default=28.0,
        ge=0.0,
        description="Ab diesem VIX-Proxy (synthetisch 0–100) gilt Markt als gestresst",
    )
    oracle_volatility_spike_ratio: float = Field(
        default=2.2,
        ge=1.0,
        description="Aktuelle Vol / gleitende Basis-Vol über diesem Faktor = Spike",
    )
    oracle_entanglement_shift_max: float = Field(
        default=0.35,
        ge=0.0,
        le=1.0,
        description="Max. |Δ Entanglement| pro Fenster ohne Alarm",
    )
    oracle_regime_shift_min: float = Field(
        default=0.4,
        ge=0.0,
        le=1.0,
        description="Trend-Knick-Indikator ab diesem Wert = Regime-Shift-Verdacht",
    )
    oracle_drawdown_crisis_pct: float = Field(
        default=32.0,
        ge=0.0,
        description="Drawdown über diesem Wert löst Crisis-Stufe aus",
    )

    # --- Circuit Breaker (mehrstufig) ---
    cb_system_max_drawdown_pct: float = Field(default=25.0, ge=0.0)
    cb_strategy_max_drawdown_pct: float = Field(default=24.0, ge=0.0)
    cb_portfolio_max_drawdown_pct: float = Field(default=28.0, ge=0.0)
    cb_sharpe_floor: float = Field(default=0.25, ge=0.0)
    cb_liquidity_crash_proxy: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Proxy 0=normal, 1=extremer Liquiditätsstress",
    )

    # --- Risk Engine ---
    risk_max_position_fraction: float = Field(default=0.12, ge=0.0, le=1.0)
    risk_quantum_diversification_min: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
        description="Mindest-Score für entanglement-basierte Diversifikation",
    )
    risk_quantum_volatility_max: float = Field(
        default=0.72,
        ge=0.0,
        le=2.0,
        description="Obergrenze für Quantum-Volatility-Proxy",
    )
    risk_fail_on_hard_violation: bool = Field(default=True)

    # Globaler Fail-Safe
    paper_only_on_safety_failure: bool = Field(
        default=True,
        description="Bei Safety-Violation oder kritischem Fehler nur Paper-Modus",
    )

    # QC-Backend (Platzhalter für PennyLane / Qiskit)
    quantum_backend: Literal["classical", "pennylane", "qiskit"] = Field(
        default="classical",
        description="classical = rein klassisch; andere Werte reserviert für Hardware-Integration",
    )
    random_seed: int | None = Field(default=None, description="Optional: Reproduzierbarkeit")

    @model_validator(mode="after")
    def _cap_elitism(self) -> QuantumInspiredSettings:
        if self.qiga_elitism_count >= self.qiga_population_size:
            object.__setattr__(self, "qiga_elitism_count", max(1, self.qiga_population_size // 8))
        return self


@lru_cache
def get_settings() -> QuantumInspiredSettings:
    """Cached Settings-Instanz (pro Prozess)."""
    return QuantumInspiredSettings()
