"""
Strukturierte Safety-Logs (JSON-Zeilen) für Audit und Explainability.

Ohne externe Abhängigkeit; kompatibel mit Log-Aggregatoren, die JSON parsen.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

_LOG = logging.getLogger("aether.safety")


def log_safety_event(
    event: str,
    *,
    component: str,
    approved: bool | None = None,
    reasons: list[str] | None = None,
    quantum: dict[str, Any] | None = None,
    metrics: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """
    Schreibt eine einzeilige JSON-Nachricht mit festem Schema.

    Args:
        event: Kurzname des Ereignisses (z. B. ``oracle_shield_decision``).
        component: ``oracle_shield`` | ``circuit_breaker`` | ``risk_engine`` | ``pipeline``.
        approved: Optional globales Urteil.
        reasons: Textuelle Gründe für Operatoren.
        quantum: Entanglement, Backend-Hinweise etc.
        metrics: numerische Kennzahlen (Drawdown, Sharpe, …).
        extra: beliebige Zusatzfelder.
    """
    payload: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "component": component,
    }
    if approved is not None:
        payload["approved"] = approved
    if reasons is not None:
        payload["reasons"] = reasons
    if quantum is not None:
        payload["quantum"] = quantum
    if metrics is not None:
        payload["metrics"] = metrics
    if extra:
        payload.update(extra)
    _LOG.info("%s", json.dumps(payload, default=str))
