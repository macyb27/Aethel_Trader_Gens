/** Dependencies for RiskGuard - provide real data from portfolio/positions. */
export const riskDeps = {
  async getCurrentEquity(): Promise<number> {
    // TODO: Integrate with portfolio store
    return 10000
  },
  async getTodayPnl(): Promise<number> {
    // TODO: Integrate with PnL tracking
    return 0
  },
  async getOpenPositionSize(_symbol: string): Promise<number> {
    // TODO: Integrate with positions store
    return 0
  },
  async getLastLossStreak(): Promise<number> {
    // TODO: Integrate with trade history
    return 0
  },
  async getCooldownUntil(): Promise<number | undefined> {
    // TODO: Integrate with cooldown state
    return undefined
  },
}
