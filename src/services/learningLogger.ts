import { OrderIntent } from "../types/trading"
import { LiveOrderResult } from "../types/exchange"

/** Logs trading intents and outcomes for ML/learning pipeline. */
export class LearningLogger {
  async logIntent(
    intent: OrderIntent,
    meta: { modeRequested?: "paper" | "live"; shadowMode?: boolean }
  ): Promise<void> {
    console.debug("[LearningLogger] Intent:", { intent, meta })
  }

  async logSkippedLive(intent: OrderIntent, reason: string): Promise<void> {
    console.debug("[LearningLogger] Live skipped:", { intent, reason })
  }

  async logExecutedLive(intent: OrderIntent, result: LiveOrderResult): Promise<void> {
    console.debug("[LearningLogger] Live executed:", { intent, result })
  }
}

export const learningLogger = new LearningLogger()
