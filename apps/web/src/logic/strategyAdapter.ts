/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - STRATEGY ADAPTER
 * Adapter zwischen IStrategy (Signal) und OrderIntent
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Signal } from '../interfaces/IStrategy';
import type { NormalizedKline } from './crdt_store';
import type { OrderIntent } from '../types/trading';
import type { Candle } from '../types/backtest';

/** Wandelt IStrategy-Signal in OrderIntent um */
export function signalToOrderIntent(
  signal: Signal,
  kline: NormalizedKline | Candle,
  quantity: number,
  symbolOverride?: string
): OrderIntent | null {
  const price = kline.close;
  const symbol = symbolOverride ?? ('symbol' in kline ? (kline as NormalizedKline).symbol : 'BTCUSDT');

  let side: 'buy' | 'sell';
  if (signal.type === 'LONG' || signal.type === 'CLOSE_SHORT') {
    side = 'buy';
  } else if (signal.type === 'SHORT' || signal.type === 'CLOSE_LONG') {
    side = 'sell';
  } else {
    return null;
  }

  const reduceOnly = signal.type === 'CLOSE_LONG' || signal.type === 'CLOSE_SHORT';

  return {
    symbol,
    side,
    type: 'market',
    quantity,
    price,
    reduceOnly,
    tag: signal.source,
    metadata: { signal, strength: signal.strength, confidence: signal.confidence },
  };
}

/** Strategy-Interface für Backtest (Candle-basiert) */
export interface StrategyLike {
  evaluateKline?(kline: NormalizedKline): Signal | null;
  evaluateKlines?(klines: NormalizedKline[]): Signal | null;
}
