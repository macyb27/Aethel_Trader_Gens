"""
QAOA-inspirierte Hyperparameter-Optimierung (klassisch, erweiterbar).

Interpretiert einen kleinen diskreten Suchraum als Graph-Knoten und minimiert eine
Kostenfunktion durch *layered* lokale Suche (Analogon zu QAOA-Schichten p=1..P).
Echte PennyLane-/Qiskit-QAOA kann dieselbe Schnittstelle ``optimize()`` implementieren.
"""

from __future__ import annotations

import logging
import math
import random
from dataclasses import dataclass
from typing import Any, Callable, Sequence

logger = logging.getLogger(__name__)

CostFn = Callable[[dict[str, float]], float]


@dataclass(slots=True)
class QAOAInspiredConfig:
    """Konfiguration für die klassische QAOA-inspirierte Suche."""

    layers: int = 3
    shots_per_layer: int = 24
    gamma_init: float = 0.7
    beta_init: float = 0.4
    random_seed: int | None = None


class QAOAInspiredOptimizer:
    """
    Optimiert kontinuierliche Hyperparameter in ``[0, 1]`` über diskretisierte Kandidaten.

    ``param_bounds`` mappt Namen auf (low, high); intern werden Werte normalisiert.
    """

    def __init__(self, config: QAOAInspiredConfig | None = None) -> None:
        self.config = config or QAOAInspiredConfig()
        self._rng = random.Random(self.config.random_seed)

    def optimize(
        self,
        param_bounds: dict[str, tuple[float, float]],
        cost_fn: CostFn,
        *,
        grid_points: int = 5,
    ) -> dict[str, Any]:
        """
        Führt geschichtete lokale Minimierung aus.

        Returns:
            Dict mit ``best_params`` (physikalische Skala), ``best_cost``, ``trace``.
        """
        names = list(param_bounds.keys())
        if not names:
            raise ValueError("param_bounds must not be empty")

        # Start: zufälliger Punkt in [0,1]^d
        d = len(names)
        current = {n: self._rng.random() for n in names}
        best = dict(current)
        best_cost = cost_fn(self._denormalize(best, param_bounds))
        trace: list[dict[str, Any]] = []

        for layer in range(self.config.layers):
            gamma = self.config.gamma_init * math.exp(-0.35 * layer)
            beta = self.config.beta_init * math.exp(-0.25 * layer)
            for _ in range(self.config.shots_per_layer):
                # Nachbar: Gitter-Sprung + Mischung (beta)
                proposal = {}
                for n in names:
                    step = self._rng.choice([-1, 0, 1]) / max(grid_points - 1, 1)
                    raw = current[n] + gamma * step + beta * (self._rng.random() - 0.5)
                    proposal[n] = float(max(0.0, min(1.0, raw)))
                phys = self._denormalize(proposal, param_bounds)
                try:
                    c = cost_fn(phys)
                except Exception as exc:
                    logger.warning("cost_fn failed: %s", exc)
                    continue
                trace.append({"layer": layer, "cost": c, "params": dict(phys)})
                if c < best_cost:
                    best_cost = c
                    best = dict(proposal)
                    current = dict(proposal)

        return {
            "best_params": self._denormalize(best, param_bounds),
            "best_cost": best_cost,
            "trace": trace[-50:],  # tail für Logging
            "backend": "classical_qaoa_inspired",
        }

    @staticmethod
    def _denormalize(norm: dict[str, float], bounds: dict[str, tuple[float, float]]) -> dict[str, float]:
        out: dict[str, float] = {}
        for k, v in norm.items():
            lo, hi = bounds[k]
            out[k] = lo + v * (hi - lo)
        return out
