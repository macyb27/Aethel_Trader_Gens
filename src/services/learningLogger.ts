import { OrderIntent } from "../types/trading"
import { LiveOrderResult } from "../types/exchange"

export interface LearningLogger {
  logIntent(intent: OrderIntent, ctx: { modeRequested?: string; shadowMode?: boolean }): Promise<void>
  logSkippedLive(intent: OrderIntent, reason: string): Promise<void>
  logExecutedLive(intent: OrderIntent, result: LiveOrderResult): Promise<void>
}

// Stub-Implementierung: Loggt in Konsole (kann später durch DB/ML-Pipeline ersetzt werden)
export const learningLogger: LearningLogger = {
  async logIntent(intent: OrderIntent, ctx: { modeRequested?: string; shadowMode?: boolean }): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[LearningLogger] intent", intent.symbol, intent.side, intent.size, ctx)
    }
  },
  async logSkippedLive(intent: OrderIntent, reason: string): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[LearningLogger] skipped live", intent.symbol, reason)
    }
  },
  async logExecutedLive(intent: OrderIntent, result: LiveOrderResult): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[LearningLogger] executed live", intent.symbol, result.orderId, result.status)
    }
  },
}
