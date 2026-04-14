/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LEARNING LOGGER
 * Loggt Entscheidungen für spätere RL/ML-Auswertung
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { LearningLogger as LearningLoggerInterface } from './liveRouter';

export class LearningLoggerImpl implements LearningLoggerInterface {
  private decisions: Array<{
    intent: OrderIntent;
    outcome: 'filled' | 'rejected' | 'cancelled';
    timestamp: number;
  }> = [];

  logDecision(intent: OrderIntent, outcome: 'filled' | 'rejected' | 'cancelled'): void {
    this.decisions.push({
      intent: { ...intent },
      outcome,
      timestamp: Date.now(),
    });
  }

  getDecisions(): ReadonlyArray<{ intent: OrderIntent; outcome: string; timestamp: number }> {
    return [...this.decisions];
  }

  clear(): void {
    this.decisions = [];
  }
}
