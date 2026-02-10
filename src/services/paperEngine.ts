import { OrderIntent } from "../types/trading"

/**
 * Paper Engine - simuliert Order-Ausführungen für Paper Trading.
 * Aktualisiert Positionen und Equity im virtuellen Portfolio.
 */
export interface PaperEngine {
  execute(intent: OrderIntent): Promise<void>
}

// In-memory Simulation für Paper Trading
const paperState = {
  cash: 100_000,
  positions: new Map<string, { size: number; avgPrice: number }>(),
}

export const paperEngine: PaperEngine = {
  async execute(intent: OrderIntent): Promise<void> {
    const price = intent.limitPrice ?? intent.meta?.lastPrice ?? 0
    if (price <= 0) return

    const pos = paperState.positions.get(intent.symbol) ?? { size: 0, avgPrice: 0 }
    const notional = intent.size * price

    if (intent.side === "long") {
      const totalCost = pos.size * pos.avgPrice + notional
      const newSize = pos.size + intent.size
      paperState.positions.set(intent.symbol, {
        size: newSize,
        avgPrice: newSize > 0 ? totalCost / newSize : 0,
      })
      paperState.cash -= notional
    } else {
      const reduceSize = Math.min(pos.size, intent.size)
      paperState.cash += reduceSize * price
      const remaining = pos.size - reduceSize
      if (remaining <= 0) {
        paperState.positions.delete(intent.symbol)
      } else {
        paperState.positions.set(intent.symbol, { size: remaining, avgPrice: pos.avgPrice })
      }
    }
  },
}
