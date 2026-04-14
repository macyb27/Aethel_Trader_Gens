/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST ENGINE
 * Führt Backtests mit Candles und decide(candle) → OrderIntent[] aus
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Candle, BacktestConfig, BacktestResult, BacktestTradeRecord } from '../types/backtest';
import type { OrderIntent } from '../types/trading';

export interface DecideStrategy {
  decide(candle: Candle, context: { index: number; candles: Candle[] }): OrderIntent[];
}

export function runBacktest(
  candles: Candle[],
  strategy: DecideStrategy,
  config: BacktestConfig
): BacktestResult {
  const {
    symbol = 'BTCUSDT',
    initialCapital = 10000,
    feeRate = 0.001,
  } = config;

  let capital = initialCapital;
  let position: { side: 'buy' | 'sell'; quantity: number; entryPrice: number; entryTime: number } | null = null;
  const trades: BacktestTradeRecord[] = [];
  const equityCurve: Array<{ timestamp: number; equity: number }> = [];
  let peak = initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const context = { index: i, candles };
    const intents = strategy.decide(candle, context);

    for (const intent of intents) {
      if (intent.side !== 'buy' && intent.side !== 'sell') continue;

      if (position) {
        const shouldClose =
          (position.side === 'buy' && intent.side === 'sell') ||
          (position.side === 'sell' && intent.side === 'buy') ||
          intent.reduceOnly;

        if (shouldClose) {
          const exitPrice = candle.close;
          const pnl = position.side === 'buy'
            ? (exitPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - exitPrice) * position.quantity;
          const fees = position.quantity * position.entryPrice * feeRate + position.quantity * exitPrice * feeRate;
          const netPnl = pnl - fees;
          capital += position.side === 'buy' ? position.quantity * exitPrice : 0;
          capital -= position.side === 'sell' ? position.quantity * exitPrice : 0;
          capital += netPnl;

          trades.push({
            entryTime: position.entryTime,
            exitTime: candle.timestamp,
            symbol,
            side: position.side,
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            pnl: netPnl,
            pnlPercent: (netPnl / (position.entryPrice * position.quantity)) * 100,
            reason: intent.tag ?? 'signal',
          });
          position = null;
        }
      }

      if (!position && !intent.reduceOnly) {
        const qty = Math.min(intent.quantity, (capital * 0.1) / candle.close);
        if (qty > 0) {
          position = {
            side: intent.side,
            quantity: qty,
            entryPrice: candle.close,
            entryTime: candle.timestamp,
          };
          capital += intent.side === 'buy' ? -qty * candle.close : qty * candle.close;
        }
      }
    }

    const equity = capital + (position
      ? position.side === 'buy' ? position.quantity * candle.close : -position.quantity * candle.close
      : 0);
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
    equityCurve.push({ timestamp: candle.timestamp, equity });
  }

  if (position && candles.length > 0) {
    const last = candles[candles.length - 1];
    const pnl = position.side === 'buy'
      ? (last.close - position.entryPrice) * position.quantity
      : (position.entryPrice - last.close) * position.quantity;
    capital += position.side === 'buy' ? position.quantity * last.close : 0;
    capital -= position.side === 'sell' ? position.quantity * last.close : 0;
    trades.push({
      entryTime: position.entryTime,
      exitTime: last.timestamp,
      symbol,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice: last.close,
      quantity: position.quantity,
      pnl,
      pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
      reason: 'end',
    });
  }

  const finalCapital = capital;
  const totalReturn = finalCapital - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;
  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl <= 0);
  const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.pnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0) / losingTrades.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;

  const returns = trades.map((t) => t.pnlPercent);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length)
    : 0;
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;
  const downsideReturns = returns.filter((r) => r < 0);
  const downStd = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length)
    : 0;
  const sortinoRatio = downStd > 0 ? (avgReturn / downStd) * Math.sqrt(252) : 0;

  const passed = sharpeRatio >= 1.5 && maxDrawdown < 0.2 && winRate >= 0.5;
  const passReason = passed
    ? 'Strategy passed validation'
    : `Sharpe=${sharpeRatio.toFixed(2)} (need ≥1.5), Drawdown=${(maxDrawdown * 100).toFixed(1)}% (need <20%), WinRate=${(winRate * 100).toFixed(1)}% (need ≥50%)`;

  return {
    symbol,
    startDate: new Date(candles[0]?.timestamp ?? 0).toISOString().slice(0, 10),
    endDate: new Date(candles[candles.length - 1]?.timestamp ?? 0).toISOString().slice(0, 10),
    initialCapital,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    maxDrawdownPercent: maxDrawdown * 100,
    winRate,
    profitFactor,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    trades,
    equityCurve,
    passed,
    passReason,
  };
}
