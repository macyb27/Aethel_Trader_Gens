/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BASE AGENT
 * Gemeinsame API für alle Trading-Agenten
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { Candle } from '../types/backtest';
import type { BacktestContext } from '../logic/backtestEngine';

/**
 * BaseAgent – Interface für Agenten
 * decide(candle) → OrderIntent[] ist die gemeinsame Schnittstelle für Live und Backtest
 */
export interface IBaseAgent {
  readonly id: string;
  readonly name: string;

  /**
   * Entscheidung basierend auf einer Candle
   * @param candle Aktuelle Candle
   * @param context Kontext (nur bei Backtest)
   */
  decide(candle: Candle, context?: BacktestContext): OrderIntent[];
}

/**
 * Abstrakte Basisklasse für Agenten
 */
export abstract class BaseAgent implements IBaseAgent {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract decide(candle: Candle, context?: BacktestContext): OrderIntent[];
}
