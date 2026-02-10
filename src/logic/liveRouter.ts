import { OrderIntent, TradeMode } from "../types/trading"
import { PaperEngine } from "../services/paperEngine"
import { RiskGuard } from "./riskGuard"
import { LearningLogger } from "../services/learningLogger"
import { ExchangeRouter } from "./exchangeRouter"
import { LiveOrderIntent } from "../types/exchange"

export interface LiveRouterConfig {
  shadowMode: boolean
  defaultMode: TradeMode
  maxLiveSizeFactor: number
  defaultVenue: "binance" | "bybit"
}

export interface LiveRouterDeps {
  paperEngine: PaperEngine
  riskGuard: RiskGuard
  learningLogger: LearningLogger
  exchangeRouter?: ExchangeRouter
}

export class LiveRouter {
  constructor(
    private readonly config: LiveRouterConfig,
    private readonly deps: LiveRouterDeps
  ) {}

  async route(intent: OrderIntent): Promise<void> {
    await this.deps.paperEngine.execute(intent)

    await this.deps.learningLogger.logIntent(intent, {
      modeRequested: intent.mode ?? this.config.defaultMode,
      shadowMode: this.config.shadowMode,
    })

    if (this.config.shadowMode) return

    const liveOk = await this.deps.riskGuard.allowLive(intent)
    if (!liveOk) {
      await this.deps.learningLogger.logSkippedLive(intent, "risk_guard_blocked")
      return
    }

    const scaledIntent = this.scaleForLive(intent, this.config.maxLiveSizeFactor)

    if (!this.deps.exchangeRouter) {
      await this.deps.learningLogger.logSkippedLive(scaledIntent, "no_exchange_router")
      return
    }

    const liveOrder: LiveOrderIntent = {
      venue: this.config.defaultVenue,
      symbol: scaledIntent.symbol,
      side: scaledIntent.side === "long" ? "buy" : "sell",
      type: scaledIntent.type === "market" ? "market" : "limit",
      amount: scaledIntent.size,
      price: scaledIntent.limitPrice,
    }

    const result = await this.deps.exchangeRouter.placeOrder(liveOrder)
    await this.deps.learningLogger.logExecutedLive(scaledIntent, result)
  }

  private scaleForLive(intent: OrderIntent, factor: number): OrderIntent {
    if (!factor || factor >= 1) return intent
    const size = intent.size ?? 0
    return {
      ...intent,
      size: size * factor,
      meta: {
        ...intent.meta,
        liveSizeFactor: factor,
      },
    }
  }
}
