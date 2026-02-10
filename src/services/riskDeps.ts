// Einfache In-Memory-Implementierung für RiskGuard-Dependencies
const state = {
  lastLossStreak: 0,
  cooldownUntil: 0 as number | undefined,
}

export const riskDeps = {
  async getCurrentEquity(): Promise<number> {
    // Platzhalter: Sollte aus PaperEngine oder Live-Account kommen
    return 100_000
  },
  async getTodayPnl(): Promise<number> {
    // Platzhalter: Sollte aus Trade-History kommen
    return 0
  },
  async getOpenPositionSize(_symbol: string): Promise<number> {
    // Platzhalter: Sollte aus PaperEngine.getPosition kommen
    return 0
  },
  async getLastLossStreak(): Promise<number> {
    return state.lastLossStreak
  },
  async getCooldownUntil(): Promise<number | undefined> {
    return state.cooldownUntil
  },
}
