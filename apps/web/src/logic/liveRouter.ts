/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LIVE ROUTER
 * Leitet OrderIntents je nach TradeMode an Live/Paper/Backtest weiter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent, TradeMode } from '../types/trading';
import type { LiveOrderResult } from '../types/exchange';
import { RiskGuard } from './riskGuard';

// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCY INTERFACES (Platzhalter für PaperEngine, LearningLogger, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export interface PaperEngine {
  executePaperOrder(intent: OrderIntent): Promise<{ success: boolean; orderId?: string }>;
}

export interface LearningLogger {
  logDecision(intent: OrderIntent, outcome: 'filled' | 'rejected' | 'cancelled'): void;
}

export interface ExchangeRouter {
  route(intent: OrderIntent, venue?: string): Promise<LiveOrderResult>;
}

export interface LiveRouterDeps {
  tradeMode: () => TradeMode;
  riskGuard: RiskGuard;
  exchangeRouter?: ExchangeRouter;
  paperEngine?: PaperEngine;
  learningLogger?: LearningLogger;
  onLog?: (level: string, source: string, message: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export class LiveRouter {
  private deps: LiveRouterDeps;

  constructor(deps: LiveRouterDeps) {
    this.deps = deps;
  }

  /** Routet OrderIntent je nach TradeMode */
  async route(intent: OrderIntent): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const tradeMode = this.deps.tradeMode();
    this.log('info', 'LIVE_ROUTER', `Routing intent: ${intent.side} ${intent.quantity} ${intent.symbol} (mode: ${tradeMode})`);

    const riskCheck = this.deps.riskGuard.check(intent);
    if (!riskCheck.allowed) {
      this.log('warn', 'RISK_GUARD', riskCheck.reason ?? 'Order rejected by RiskGuard');
      this.deps.learningLogger?.logDecision(intent, 'rejected');
      return { success: false, error: riskCheck.reason };
    }

    if (tradeMode === 'live') {
      if (!this.deps.exchangeRouter) {
        this.log('error', 'LIVE_ROUTER', 'Live mode requires exchangeRouter');
        return { success: false, error: 'Exchange router not configured' };
      }
      const result = await this.deps.exchangeRouter.route(intent);
      this.deps.learningLogger?.logDecision(intent, result.success ? 'filled' : 'rejected');
      return {
        success: result.success,
        orderId: result.orderId,
        error: result.error,
      };
    }

    if (tradeMode === 'paper') {
      if (!this.deps.paperEngine) {
        this.log('warn', 'LIVE_ROUTER', 'Paper engine not configured, simulating accept');
        this.deps.learningLogger?.logDecision(intent, 'filled');
        return { success: true, orderId: `paper-${Date.now()}` };
      }
      const result = await this.deps.paperEngine.executePaperOrder(intent);
      this.deps.learningLogger?.logDecision(intent, result.success ? 'filled' : 'rejected');
      return {
        success: result.success,
        orderId: result.orderId,
      };
    }

    // backtest: Intents werden von BacktestEngine direkt verarbeitet, nicht über Router
    this.log('info', 'LIVE_ROUTER', 'Backtest mode: intent logged for engine');
    this.deps.learningLogger?.logDecision(intent, 'filled');
    return { success: true, orderId: `bt-${Date.now()}` };
  }

  private log(level: string, source: string, message: string): void {
    this.deps.onLog?.(level, source, message);
  }
}
