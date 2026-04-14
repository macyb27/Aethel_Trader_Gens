"""
QLSTM-ähnliches Forecasting (PyTorch) für die Hypothesis-Phase.

Kombiniert Standard-LSTM mit einem zusätzlichen *quantum-inspired* Misch-Layer
(lineare Rotation + nichtlineare Phase), um später durch echte parametrisierte
Schaltungen (PennyLane) ersetzt zu werden.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Any

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class QLSTMConfig:
    input_size: int = 5
    hidden_size: int = 64
    num_layers: int = 2
    dropout: float = 0.1
    horizon: int = 1  # vorhergesagte Schritte


class QuantumInspiredForecastingHead(nn.Module):
    """
    Projektion Hidden → Output mit *phase*-artiger Nichtlinearität.

    Dient als Platzhalter für parametrisierte Rotations-Gates aus einem QC-Stack.
    """

    def __init__(self, hidden_size: int, output_size: int) -> None:
        super().__init__()
        self.lin = nn.Linear(hidden_size, output_size)
        self.phase = nn.Parameter(torch.zeros(output_size))

    def forward(self, h: torch.Tensor) -> torch.Tensor:
        z = self.lin(h)
        return torch.tanh(z * torch.cos(self.phase) + torch.sin(self.phase))


class QLSTMForecaster(nn.Module):
    """
    Sequenzmodell: LSTM-Backbone + quantum-inspired Head.
    """

    def __init__(self, config: QLSTMConfig | None = None) -> None:
        super().__init__()
        self.config = config or QLSTMConfig()
        self.lstm = nn.LSTM(
            input_size=self.config.input_size,
            hidden_size=self.config.hidden_size,
            num_layers=self.config.num_layers,
            batch_first=True,
            dropout=self.config.dropout if self.config.num_layers > 1 else 0.0,
        )
        self.head = QuantumInspiredForecastingHead(self.config.hidden_size, self.config.horizon)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor (batch, seq, features)
        Returns:
            (batch, horizon) Vorhersage der nächsten Rendite-Proxys
        """
        out, _ = self.lstm(x)
        last = out[:, -1, :]
        return self.head(last)


def train_forecaster_stub(
    model: QLSTMForecaster,
    x: torch.Tensor,
    y: torch.Tensor,
    *,
    epochs: int = 20,
    lr: float = 1e-3,
) -> dict[str, Any]:
    """
    Minimales Training (MSE). In Produktion: DataLoader, Validierung, Early Stopping.

    Raises:
        RuntimeError: wenn Dimensionen nicht passen
    """
    if x.dim() != 3 or y.dim() != 2:
        raise RuntimeError("x must be (B,T,F), y must be (B,H)")
    opt = torch.optim.AdamW(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()
    model.train()
    losses: list[float] = []
    for ep in range(epochs):
        opt.zero_grad()
        pred = model(x)
        loss = loss_fn(pred, y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        losses.append(float(loss.detach().cpu()))
        if ep % 5 == 0:
            logger.debug("QLSTM epoch=%d loss=%.6f", ep, losses[-1])
    return {"epochs": epochs, "final_loss": losses[-1] if losses else math.nan, "losses_tail": losses[-5:]}
