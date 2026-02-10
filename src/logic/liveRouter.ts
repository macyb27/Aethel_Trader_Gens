/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LIVE ROUTER
 * Routet OrderIntents je nach TradeMode zu Paper, Live oder Backtest
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent, TradeMode } from '../types/trading';
import type { LiveOrderResult } from '../types/exchange';
import { RiskGuard } from './riskGuard';

export interface PaperEngine {
  execute(intent: OrderIntent): Promise<LiveOrderResult>;
}

export interface ExchangeRouter {
  route(intent: OrderIntent): Promise<LiveOrderResult>;
}

export interface LearningLogger {
  logTrade(intent: OrderIntent, result: LiveOrderResult): void;
}

export interface LiveRouterDeps {
  tradeMode: TradeMode;
  riskGuard: RiskGuard;
  paperEngine?: PaperEngine;
  exchangeRouter?: ExchangeRouter;
  learningLogger?: LearningLogger;
}

/**
 * LiveRouter – zentrale Stelle für Order-Routing
 * Agenten/Strategien rufen liveRouter.route(intent) auf.
 */
export class LiveRouter {
  private deps: LiveRouterDeps;

  constructor(deps: LiveRouterDeps) {
    this.deps = deps;
  }

  async route(intent: OrderIntent): Promise<LiveOrderResult> {
    // Risk-Check
    const riskResult = this.deps.riskGuard.check(intent);
    if (!riskResult.allowed) {
      return this.rejectResult(intent, riskResult.reason ?? 'Risk check failed');
    }

    if (this.deps.tradeMode === 'backtest') {
      return this.rejectResult(intent, 'Backtest mode: use BacktestEngine instead of LiveRouter');
    }

    if (this.deps.tradeMode === 'paper' && this.deps.paperEngine) {
      const result = await this.deps.paperEngine.execute(intent);
      this.deps.learningLogger?.logTrade(intent, result);
      return result;
    }

    if (this.deps.tradeMode === 'live' && this.deps.exchangeRouter) {
      const result = await this.deps.exchangeRouter.route(intent);
      this.deps.learningLogger?.logTrade(intent, result);
      return result;
    }

    return this.rejectResult(intent, `No executor for mode ${this.deps.tradeMode}`);
  }

  async routeMany(intents: OrderIntent[]): Promise<LiveOrderResult[]> {
    return Promise.all(intents.map((i) => this.route(i)));
  }

  private rejectResult(intent: OrderIntent, error: string): LiveOrderResult {
    return {
      intentId: intent.id,
      status: 'rejected',
      error,
      timestamp: Date.now(),
      venue: 'BINANCE', // Placeholder – wird bei Rejection nicht verwendet
    };
  }

  setTradeMode(mode: TradeMode): void {
    this.deps = { ...this.deps, tradeMode: mode };
  }

  getTradeMode(): TradeMode {
    return this.deps.tradeMode;
  }
}
