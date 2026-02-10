import { LiveRouter, LiveRouterConfig } from "../logic/liveRouter"
import { ExchangeRouter } from "../logic/exchangeRouter"
import { BinanceConnector } from "../connectors/binanceConnector"
import { RiskGuard, RiskLimits } from "../logic/riskGuard"
import { paperEngine } from "../services/paperEngine"
import { riskDeps } from "../services/riskDeps"
import { learningLogger } from "../services/learningLogger"

const binanceConnector = new BinanceConnector({
  apiKey: process.env.BINANCE_KEY ?? "",
  apiSecret: process.env.BINANCE_SECRET ?? "",
})

const exchangeRouter = new ExchangeRouter({
  binance: binanceConnector,
})

const riskLimits: RiskLimits = {
  maxRiskPerTradePct: 1,
  maxDailyLossPct: 3,
  maxPositionSizePct: 10,
  lossStreakLimit: 3,
  cooldownMinutes: 60,
}

const riskGuard = new RiskGuard(riskLimits, riskDeps)

const config: LiveRouterConfig = {
  shadowMode: true,
  defaultMode: "live",
  maxLiveSizeFactor: 0.1,
  defaultVenue: "binance",
}

export const liveRouter = new LiveRouter(config, {
  paperEngine,
  riskGuard,
  learningLogger,
  exchangeRouter,
})
