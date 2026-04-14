"""
Rückwärtskompatibler Re-Export der zentralen Settings.

Neue Imports bitte ``from core.settings import AetherTraderSettings, get_settings``.
"""

from __future__ import annotations

from core.settings import AetherTraderSettings, QuantumInspiredSettings, get_settings

__all__ = ["AetherTraderSettings", "QuantumInspiredSettings", "get_settings"]
