"""
Zentraler Quantum-Backend-Switcher.

Heute: **classical** (NumPy / PyTorch ohne QPU). Später: **pennylane** / **qiskit**
mit identischer API für Rotations- und Mess-Operationen.

Alle QML- und QIGA-Module sollen über :func:`get_quantum_backend` arbeiten, nicht
direkt Hardware-Bibliotheken importieren.
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Literal

import numpy as np

if TYPE_CHECKING:
    from core.settings import AetherTraderSettings


BackendName = Literal["classical", "pennylane", "qiskit"]


class QuantumBackend(ABC):
    """Abstrakte Schnittstelle für quanten-inspirierte oder echte QC-Operationen."""

    name: BackendName

    @abstractmethod
    def rotate_pair(
        self,
        g_i: float,
        g_j: float,
        theta: float,
        *,
        rng_state: int | None = None,
    ) -> tuple[float, float]:
        """2D-Rotation auf Gen-Paar (klassisch); QC-Implementierung liefert gleiche Signatur."""


class ClassicalBackend(QuantumBackend):
    """NumPy-basierte Simulation (Standard)."""

    name: BackendName = "classical"

    def rotate_pair(
        self,
        g_i: float,
        g_j: float,
        theta: float,
        *,
        rng_state: int | None = None,
    ) -> tuple[float, float]:
        c, s = math.cos(theta), math.sin(theta)
        return (
            float(np.clip(c * g_i - s * g_j, -1.0, 1.0)),
            float(np.clip(s * g_i + c * g_j, -1.0, 1.0)),
        )


class PennyLaneBackendStub(QuantumBackend):
    """
    Platzhalter für PennyLane-Anbindung.

    Bis zur Integration: identisch zu :class:`ClassicalBackend`, loggt aber ``backend=pennylane``.
    """

    name: BackendName = "pennylane"

    def __init__(self) -> None:
        self._delegate = ClassicalBackend()

    def rotate_pair(
        self,
        g_i: float,
        g_j: float,
        theta: float,
        *,
        rng_state: int | None = None,
    ) -> tuple[float, float]:
        return self._delegate.rotate_pair(g_i, g_j, theta, rng_state=rng_state)


class QiskitBackendStub(QuantumBackend):
    """Platzhalter für Qiskit (gleiche Delegation wie PennyLane-Stub)."""

    name: BackendName = "qiskit"

    def __init__(self) -> None:
        self._delegate = ClassicalBackend()

    def rotate_pair(
        self,
        g_i: float,
        g_j: float,
        theta: float,
        *,
        rng_state: int | None = None,
    ) -> tuple[float, float]:
        return self._delegate.rotate_pair(g_i, g_j, theta, rng_state=rng_state)


def get_quantum_backend(settings: AetherTraderSettings | None = None) -> QuantumBackend:
    """
    Factory gemäß ``settings.quantum_backend``.

    Args:
        settings: :class:`~core.settings.AetherTraderSettings`; sonst :func:`~core.settings.get_settings`.

    Returns:
        Passende :class:`QuantumBackend`-Implementierung.
    """
    from core.settings import get_settings as _gs

    s = settings or _gs()
    name = s.quantum_backend
    if name == "pennylane":
        return PennyLaneBackendStub()
    if name == "qiskit":
        return QiskitBackendStub()
    return ClassicalBackend()
