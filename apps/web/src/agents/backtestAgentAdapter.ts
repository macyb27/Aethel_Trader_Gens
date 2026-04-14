/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST AGENT ADAPTER
 * Adapter: BaseAgent → DecideStrategy für BacktestEngine
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { BaseAgent } from './baseAgent';
import type { DecideStrategy } from '../logic/backtestEngine';
import type { Candle } from '../types/backtest';

export function createBacktestAdapter(agent: BaseAgent): DecideStrategy {
  return {
    decide(candle: Candle, context: { index: number; candles: Candle[] }) {
      return agent.decide(candle, {
        ...context,
        symbol: 'BTCUSDT',
      });
    },
  };
}
