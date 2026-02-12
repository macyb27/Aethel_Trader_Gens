/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST ENGINE
 * Führt Backtest mit Candles und Strategy/Agent decide-Funktion aus
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { Candle, BacktestConfig, BacktestResult, BacktestTrade } from '../types/backtest';

export type DecideFn = (candle: Candle, context: BacktestContext) => OrderIntent[];

export interface BacktestContext {
  /** Index der aktuellen Candle */
  index: number;
  /** Alle Candles */
  candles: Candle[];
  /** Aktuelles Kapital */
  balance: number;
  /** Offene Position */
  position: { side: 'long' | 'short'; quantity: number; entryPrice: number; entryTime: number } | null;
  /** Bisherige Trades */
  trades: BacktestTrade[];
}

/**
 * BacktestEngine – führt Backtest mit decide(candle) → OrderIntent[] aus
 */
export class BacktestEngine {
  async run(
    candles: Candle[],
    decide: DecideFn,
    config: BacktestConfig,
  ): Promise<BacktestResult> {
    const feePercent = config.feePercent ?? 0.001;
    const trades: BacktestTrade[] = [];
    let balance = config.initialCapital;
    let position: BacktestContext['position'] = null;
    let maxBalance = balance;
    let maxDrawdown = 0;

    for (let i = 50; i < candles.length; i++) {
      const candle = candles[i];
      const context: BacktestContext = {
        index: i,
        candles,
        balance,
        position,
        trades,
      };

      const intents = decide(candle, context);

      for (const intent of intents) {
        if (intent.closePosition && position) {
          const exitPrice = candle.close;
          const pnl = position.side === 'long'
            ? (exitPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - exitPrice) * position.quantity;
          const fees = position.quantity * position.entryPrice * feePercent;

          trades.push({
            entryTime: position.entryTime,
            exitTime: candle.timestamp,
            symbol: config.symbol,
            side: position.side,
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            pnl: pnl - fees,
            pnlPercent: (pnl - fees) / (position.entryPrice * position.quantity),
            fees,
          });

          balance += pnl - fees;
          maxBalance = Math.max(maxBalance, balance);
          maxDrawdown = Math.max(maxDrawdown, (maxBalance - balance) / maxBalance);
          position = null;
        } else if (!position && intent.side) {
          const quantity = intent.quantity > 0
            ? intent.quantity
            : (balance * 0.05) / candle.close; // 5% pro Trade wenn nicht angegeben

          position = {
            side: intent.side === 'buy' ? 'long' : 'short',
            quantity,
            entryPrice: candle.close,
            entryTime: candle.timestamp,
          };
        }
      }
    }

    // Restposition schließen
    if (position && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const pnl = position.side === 'long'
        ? (lastCandle.close - position.entryPrice) * position.quantity
        : (position.entryPrice - lastCandle.close) * position.quantity;
      const fees = position.quantity * position.entryPrice * feePercent;

      trades.push({
        entryTime: position.entryTime,
        exitTime: lastCandle.timestamp,
        symbol: config.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: lastCandle.close,
        quantity: position.quantity,
        pnl: pnl - fees,
        pnlPercent: (pnl - fees) / (position.entryPrice * position.quantity),
        fees,
      });
      balance += pnl - fees;
    }

    return this.calculateMetrics(config.initialCapital, balance, trades);
  }

  private calculateMetrics(initialCapital: number, finalCapital: number, trades: BacktestTrade[]): BacktestResult {
    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl <= 0);
    const returns = trades.map((t) => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1),
    );

    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    for (const t of trades) {
      if (t.pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    }

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      profitFactor:
        losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0) > 0
          ? winningTrades.reduce((s, t) => s + t.pnl, 0) / losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0)
          : 0,
      sharpeRatio: stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0,
      sortinoRatio: (() => {
        const negReturns = returns.filter((r) => r < 0);
        const downDev = Math.sqrt(negReturns.reduce((sum, r) => sum + r * r, 0) / (negReturns.length || 1));
        return downDev > 0 ? (avgReturn / downDev) * Math.sqrt(252) : 0;
      })(),
      maxDrawdown: 0, // TODO: aus equity curve
      totalReturn: (finalCapital - initialCapital) / initialCapital,
      annualizedReturn: 0,
      averageWin: winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.pnl, 0) / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0) / losingTrades.length : 0,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      trades,
      finalCapital,
    };
  }
}
