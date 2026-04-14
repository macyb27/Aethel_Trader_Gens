"""
Strukturiertes Logging mit Quantum-Metriken und Explainability für den Super-Bot.

Alle Pipeline-Schritte sollen über :func:`log_pipeline` oder :func:`log_explainability`
gehen, damit Logs einheitlich maschinenlesbar (JSON) und für Dashboards verwertbar sind.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Literal

_LOGGER_NAME = "aether.pipeline"
_DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"


def setup_structured_logging(
    level: int = logging.INFO,
    *,
    stream: Any | None = None,
) -> logging.Logger:
    """
    Konfiguriert Root-Handler für konsolenfreundliche Ausgabe.

    Args:
        level: logging.INFO / DEBUG etc.
        stream: Stdout/Stderr; Standard sys.stdout.

    Returns:
        Logger ``aether.pipeline``.
    """
    root = logging.getLogger()
    if not root.handlers:
        h = logging.StreamHandler(stream or sys.stdout)
        h.setFormatter(logging.Formatter(_DEFAULT_FORMAT))
        root.addHandler(h)
    root.setLevel(level)
    log = logging.getLogger(_LOGGER_NAME)
    log.setLevel(level)
    return log


def _json_line(
    event: str,
    *,
    component: str,
    step: str | None = None,
    quantum: dict[str, Any] | None = None,
    explainability: dict[str, Any] | None = None,
    metrics: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> str:
    payload: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "component": component,
    }
    if step:
        payload["step"] = step
    if quantum is not None:
        payload["quantum"] = quantum
    if explainability is not None:
        payload["explainability"] = explainability
    if metrics is not None:
        payload["metrics"] = metrics
    if extra:
        payload.update(extra)
    return json.dumps(payload, default=str)


def log_pipeline(
    event: str,
    *,
    component: str,
    step: str | None = None,
    level: Literal["debug", "info", "warning", "error", "critical"] = "info",
    quantum: dict[str, Any] | None = None,
    explainability: dict[str, Any] | None = None,
    metrics: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """
    Schreibt eine strukturierte JSON-Zeile auf den Pipeline-Logger.

    Args:
        event: Kurzbezeichner (z. B. ``qiga_generation``).
        component: z. B. ``orchestrator``, ``qiga``, ``oracle_shield``.
        step: optional feiner Schrittname.
        level: Log-Level als String.
        quantum: Entanglement, Backend, Schichten etc.
        explainability: menschenlesbare / modell-erklärende Felder.
        metrics: Zahlen (Fitness, Drawdown, …).
        extra: beliebige Zusatzfelder.
    """
    log = logging.getLogger(_LOGGER_NAME)
    line = _json_line(
        event,
        component=component,
        step=step,
        quantum=quantum,
        explainability=explainability,
        metrics=metrics,
        extra=extra,
    )
    getattr(log, level)(line)


def log_explainability(
    *,
    strategy_id: str,
    message: str,
    details: dict[str, Any] | None = None,
    quantum: dict[str, Any] | None = None,
) -> None:
    """Kurzform für Explainability-only Events (Audits, UI-Feed)."""
    log_pipeline(
        "explainability",
        component="explainability",
        step=strategy_id,
        explainability={"message": message, **(details or {})},
        quantum=quantum,
    )
