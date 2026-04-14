/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BASE AGENT
 * Gemeinsame API für alle Trading-Agenten: decide(candle) → OrderIntent[]
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { Candle } from '../types/backtest';

export interface DecideContext {
  index: number;
  candles: Candle[];
  symbol?: string;
}

/**
 * BaseAgent: Alle Agenten implementieren decide(candle) → OrderIntent[]
 * Kompatibel mit LiveRouter und BacktestEngine
 */
export abstract class BaseAgent {
  abstract readonly id: string;
  abstract readonly name: string;

  /**
   * Entscheidet basierend auf Candle-Daten, welche Orders platziert werden sollen.
   * @returns Array von OrderIntents (leer = keine Aktion)
   */
  abstract decide(candle: Candle, context: DecideContext): OrderIntent[];
}
