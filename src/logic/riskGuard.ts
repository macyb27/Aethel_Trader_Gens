/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - RISK GUARD
 * Prüft OrderIntents vor Ausführung (Position Limits, Drawdown, etc.)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';

export interface RiskGuardConfig {
  maxPositionPercent?: number;
  maxDrawdownPercent?: number;
  maxDailyLossPercent?: number;
  maxOrderSizePercent?: number;
}

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface PortfolioSnapshot {
  totalValue: number;
  unrealizedPnL: number;
  positions: Array<{ symbol: string; side: string; size: number; value: number }>;
}

/**
 * RiskGuard: Prüft OrderIntents gegen Risikolimits
 */
export class RiskGuard {
  private config: Required<RiskGuardConfig>;
  private getPortfolio: () => PortfolioSnapshot | null;

  constructor(
    config: RiskGuardConfig = {},
    getPortfolio: () => PortfolioSnapshot | null = () => null
  ) {
    this.config = {
      maxPositionPercent: config.maxPositionPercent ?? 0.1,
      maxDrawdownPercent: config.maxDrawdownPercent ?? 0.2,
      maxDailyLossPercent: config.maxDailyLossPercent ?? 0.05,
      maxOrderSizePercent: config.maxOrderSizePercent ?? 0.05,
      ...config,
    };
    this.getPortfolio = getPortfolio;
  }

  /** Prüft ob ein OrderIntent ausgeführt werden darf */
  check(intent: OrderIntent): RiskCheckResult {
    const portfolio = this.getPortfolio();
    if (!portfolio) {
      return { allowed: true };
    }

    const orderValue = intent.quantity * (intent.price ?? 0);
    const maxOrderValue = portfolio.totalValue * this.config.maxOrderSizePercent;
    if (orderValue > maxOrderValue && intent.price) {
      return {
        allowed: false,
        reason: `Order size ${orderValue.toFixed(2)} exceeds max ${maxOrderValue.toFixed(2)} (${this.config.maxOrderSizePercent * 100}% of portfolio)`,
      };
    }

    const symbolPosition = portfolio.positions.find(p => p.symbol === intent.symbol);
    const currentSymbolValue = symbolPosition?.value ?? 0;
    const newSymbolValue = currentSymbolValue + (intent.side === 'buy' ? 1 : -1) * orderValue;
    const maxPositionValue = portfolio.totalValue * this.config.maxPositionPercent;
    if (Math.abs(newSymbolValue) > maxPositionValue) {
      return {
        allowed: false,
        reason: `Position for ${intent.symbol} would exceed max ${this.config.maxPositionPercent * 100}% of portfolio`,
      };
    }

    if (portfolio.unrealizedPnL < 0) {
      const drawdown = Math.abs(portfolio.unrealizedPnL) / portfolio.totalValue;
      if (drawdown >= this.config.maxDrawdownPercent) {
        return {
          allowed: false,
          reason: `Current drawdown ${(drawdown * 100).toFixed(1)}% exceeds limit ${this.config.maxDrawdownPercent * 100}%`,
        };
      }
    }

    return { allowed: true };
  }

  updateConfig(config: Partial<RiskGuardConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
