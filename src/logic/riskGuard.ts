/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - RISK GUARD
 * Risikoprüfung vor Order-Ausführung
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';

export interface RiskGuardConfig {
  maxPositionSizePercent: number;
  maxDrawdownPercent: number;
  maxOrderValuePercent: number;
  maxDailyLossPercent: number;
  maxOpenOrders: number;
}

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * RiskGuard – prüft OrderIntents vor Ausführung
 */
export class RiskGuard {
  private config: RiskGuardConfig;
  private dailyPnL: number = 0;
  private openOrdersCount: number = 0;
  private portfolioValue: number = 0;

  constructor(config?: Partial<RiskGuardConfig>) {
    this.config = {
      maxPositionSizePercent: 0.1,
      maxDrawdownPercent: 0.2,
      maxOrderValuePercent: 0.05,
      maxDailyLossPercent: 0.05,
      maxOpenOrders: 10,
      ...config,
    };
  }

  /** Portfolio-Wert setzen (für Positionsgrößen-Prüfung) */
  setPortfolioValue(value: number): void {
    this.portfolioValue = value;
  }

  /** Täglichen PnL aktualisieren */
  updateDailyPnL(pnl: number): void {
    this.dailyPnL += pnl;
  }

  /** Anzahl offener Orders setzen */
  setOpenOrdersCount(count: number): void {
    this.openOrdersCount = count;
  }

  /** Prüft, ob ein OrderIntent ausgeführt werden darf */
  check(intent: OrderIntent): RiskCheckResult {
    // Max offene Orders
    if (this.openOrdersCount >= this.config.maxOpenOrders) {
      return { allowed: false, reason: `Max open orders (${this.config.maxOpenOrders}) reached` };
    }

    // Order-Wert vs. Portfolio
    const orderValue = intent.quantity * (intent.price ?? 0);
    if (intent.price && this.portfolioValue > 0) {
      const valuePercent = orderValue / this.portfolioValue;
      if (valuePercent > this.config.maxOrderValuePercent) {
        return {
          allowed: false,
          reason: `Order value ${(valuePercent * 100).toFixed(1)}% exceeds max ${(this.config.maxOrderValuePercent * 100)}%`,
        };
      }
    }

    // Täglicher Verlust
    if (this.portfolioValue > 0 && this.dailyPnL < 0) {
      const dailyLossPercent = Math.abs(this.dailyPnL) / this.portfolioValue;
      if (dailyLossPercent >= this.config.maxDailyLossPercent) {
        return {
          allowed: false,
          reason: `Daily loss limit (${(this.config.maxDailyLossPercent * 100)}%) reached`,
        };
      }
    }

    return { allowed: true };
  }

  getConfig(): RiskGuardConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RiskGuardConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
