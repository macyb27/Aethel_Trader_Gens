import { OrderIntent } from "../types/trading"

/** Simulates order execution for paper trading. */
export class PaperEngine {
  async execute(intent: OrderIntent): Promise<void> {
    // Paper trading: log only, no real execution
    console.debug("[PaperEngine] Simulated execution:", {
      symbol: intent.symbol,
      side: intent.side,
      type: intent.type,
      size: intent.size,
    })
  }
}

export const paperEngine = new PaperEngine()
