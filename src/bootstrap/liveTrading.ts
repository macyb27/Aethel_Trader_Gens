/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LIVE TRADING BOOTSTRAP
 * Verbindet BinanceConnector, ExchangeRouter, RiskGuard, PaperEngine,
 * LearningLogger und LiveRouter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { TradeMode } from '../types/trading';
import { RiskGuard } from '../logic/riskGuard';
import { LiveRouter } from '../logic/liveRouter';
import { ExchangeRouter } from '../logic/exchangeRouter';
import { PaperEngineImpl } from '../logic/paperEngine';
import { LearningLoggerImpl } from '../logic/learningLogger';

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

let tradeMode: TradeMode = 'paper';
let liveRouterInstance: LiveRouter | null = null;

export function setTradeMode(mode: TradeMode): void {
  tradeMode = mode;
}

export function getTradeMode(): TradeMode {
  return tradeMode;
}

/** Portfolio-Snapshot-Lieferant (an Store anbindbar) */
export type GetPortfolioSnapshot = () => {
  totalValue: number;
  unrealizedPnL: number;
  positions: Array<{ symbol: string; side: string; size: number; value: number }>;
} | null;

/** Log-Callback (an Store actions anbindbar) */
export type OnLog = (level: string, source: string, message: string) => void;

export interface LiveTradingBootstrapOptions {
  getPortfolio?: GetPortfolioSnapshot;
  onLog?: OnLog;
  defaultVenue?: 'BINANCE' | 'BYBIT';
}

export function bootstrapLiveTrading(options: LiveTradingBootstrapOptions = {}): LiveRouter {
  const riskGuard = new RiskGuard(
    {
      maxPositionPercent: 0.1,
      maxDrawdownPercent: 0.2,
      maxDailyLossPercent: 0.05,
      maxOrderSizePercent: 0.05,
    },
    options.getPortfolio ?? (() => null)
  );

  const exchangeRouter = new ExchangeRouter(options.defaultVenue ?? 'BYBIT');
  const paperEngine = new PaperEngineImpl();
  const learningLogger = new LearningLoggerImpl();

  const liveRouter = new LiveRouter({
    tradeMode: () => tradeMode,
    riskGuard,
    exchangeRouter,
    paperEngine,
    learningLogger,
    onLog: options.onLog,
  });

  liveRouterInstance = liveRouter;
  return liveRouter;
}

export function getLiveRouter(): LiveRouter | null {
  return liveRouterInstance;
}
