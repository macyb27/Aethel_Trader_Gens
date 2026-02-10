/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - STRATEGY ADAPTER
 * Adapter zwischen IStrategy (Signal) und decide(Candle) → OrderIntent[]
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { IStrategy, Signal } from '../interfaces/IStrategy';
import type { OrderIntent, OrderSide } from '../types/trading';
import type { Candle } from '../types/backtest';
import type { NormalizedKline } from './crdt_store';

function candleToKline(candle: Candle, symbol: string, interval: string): NormalizedKline {
  return {
    timestamp: candle.timestamp,
    exchange: 'BACKTEST',
    symbol: candle.symbol ?? symbol,
    interval: candle.interval ?? interval,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    trades: 0,
  };
}

function signalToOrderIntents(signal: Signal, source: string): OrderIntent[] {
  if (signal.type === 'NEUTRAL') return [];

  const id = `intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const side: OrderSide = signal.type === 'LONG' || signal.type === 'CLOSE_SHORT' ? 'buy' : 'sell';

  if (signal.type === 'CLOSE_LONG' || signal.type === 'CLOSE_SHORT') {
    return [{
      id,
      symbol: signal.symbol,
      side,
      orderType: 'market',
      quantity: 0, // closeAll
      source,
      timestamp: signal.timestamp,
      closePosition: true,
    }];
  }

  return [{
    id,
    symbol: signal.symbol,
    side,
    orderType: 'market',
    quantity: 0, // Menge muss von Engine berechnet werden
    source,
    timestamp: signal.timestamp,
    metadata: { strength: signal.strength, confidence: signal.confidence },
  }];
}

/**
 * StrategyAdapter – wandelt IStrategy in decide(candle) → OrderIntent[] um
 */
export class StrategyAdapter {
  constructor(
    private strategy: IStrategy,
    private symbol: string = 'BTCUSDT',
    private interval: string = '1m',
  ) {}

  /**
   * Verarbeitet eine Candle und gibt OrderIntents zurück
   */
  decide(candle: Candle): OrderIntent[] {
    const kline = candleToKline(candle, this.symbol, this.interval);
    const signal = this.strategy.evaluateKline(kline);
    if (!signal) return [];
    return signalToOrderIntents(signal, this.strategy.id);
  }

  /**
   * Verarbeitet mehrere Klines (für Indikatoren)
   */
  decideFromKlines(klines: Candle[]): OrderIntent[] {
    const normalized = klines.map((c) => candleToKline(c, this.symbol, this.interval));
    const signal = this.strategy.evaluateKlines(normalized);
    if (!signal) return [];
    return signalToOrderIntents(signal, this.strategy.id);
  }
}
