/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST AGENT ADAPTER
 * Lässt IBaseAgent in der BacktestEngine laufen
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { IBaseAgent } from './baseAgent';
import type { OrderIntent } from '../types/trading';
import type { Candle } from '../types/backtest';
import type { BacktestContext, DecideFn } from '../logic/backtestEngine';

/**
 * BacktestAgentAdapter – wandelt IBaseAgent in DecideFn um
 */
export function createBacktestDecideFn(agent: IBaseAgent): DecideFn {
  return (candle: Candle, context: BacktestContext): OrderIntent[] => {
    return agent.decide(candle, context);
  };
}
