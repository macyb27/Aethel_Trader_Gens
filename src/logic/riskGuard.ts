import { OrderIntent } from "../types/trading"

export interface RiskLimits {
  maxRiskPerTradePct: number
  maxDailyLossPct: number
  maxPositionSizePct: number
  lossStreakLimit: number
  cooldownMinutes: number
}

export interface RiskGuardDeps {
  getCurrentEquity(): Promise<number>
  getTodayPnl(): Promise<number>
  getOpenPositionSize(symbol: string): Promise<number>
  getLastLossStreak(): Promise<number>
  getCooldownUntil(): Promise<number | undefined>
}

export class RiskGuard {
  constructor(
    private readonly limits: RiskLimits,
    private readonly deps: RiskGuardDeps
  ) {}

  async allowLive(intent: OrderIntent): Promise<boolean> {
    const [equity, dailyPnl, openPos, lossStreak, cooldownUntil] =
      await Promise.all([
        this.deps.getCurrentEquity(),
        this.deps.getTodayPnl(),
        this.deps.getOpenPositionSize(intent.symbol),
        this.deps.getLastLossStreak(),
        this.deps.getCooldownUntil(),
      ])

    const now = Date.now()
    if (cooldownUntil && now < cooldownUntil) {
      return false
    }

    const equityRisk = (equity * this.limits.maxRiskPerTradePct) / 100
    const maxPosNotional = (equity * this.limits.maxPositionSizePct) / 100

    const price = intent.limitPrice ?? intent.meta?.lastPrice ?? 0
    const intentNotional = intent.size * price
    if (intentNotional > equityRisk) return false
    if (openPos + intentNotional > maxPosNotional) return false

    const dailyLossPct = dailyPnl < 0 ? (-dailyPnl / equity) * 100 : 0
    if (dailyLossPct > this.limits.maxDailyLossPct) return false
    if (lossStreak >= this.limits.lossStreakLimit) return false

    return true
  }
}
