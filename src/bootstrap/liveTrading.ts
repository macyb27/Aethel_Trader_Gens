/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LIVE TRADING BOOTSTRAP
 * Verknüpft Connectors, Router, RiskGuard, PaperEngine und LiveRouter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { TradeMode } from '../types/trading';
import type { ExchangeVenue } from '../types/exchange';
import { LiveRouter } from '../logic/liveRouter';
import { RiskGuard } from '../logic/riskGuard';
import { ExchangeRouter } from '../logic/exchangeRouter';
import { PaperEngine } from '../logic/paperEngine';
import { BinanceConnector } from '../connectors/binanceConnector';
import { BybitConnector } from '../connectors/bybitConnector';

// ─────────────────────────────────────────────────────────────────────────────
// PLATZHALTER: LearningLogger
// ─────────────────────────────────────────────────────────────────────────────

/** Platzhalter – später mit existierendem Service verbinden */
const createLearningLogger = () => ({
  logTrade(_intent: import('../types/trading').OrderIntent, _result: import('../types/exchange').LiveOrderResult) {
    // TODO: Mit LearningEntry / Transfer-Learning verbinden
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────────────────────────────────────

let liveRouterInstance: LiveRouter | null = null;

export interface LiveTradingConfig {
  tradeMode: TradeMode;
  initialBalance?: number;
  defaultVenue?: 'BINANCE' | 'BYBIT';
  binanceApiKey?: string;
  binanceApiSecret?: string;
  bybitApiKey?: string;
  bybitApiSecret?: string;
}

/**
 * Erstellt und konfiguriert den LiveRouter mit allen Abhängigkeiten
 */
export function bootstrapLiveTrading(config: LiveTradingConfig): LiveRouter {
  const riskGuard = new RiskGuard();

  const paperEngine = new PaperEngine(config.initialBalance ?? 10000);

  const binanceConnector = new BinanceConnector({
    apiKey: config.binanceApiKey,
    apiSecret: config.binanceApiSecret,
  });

  const bybitConnector = new BybitConnector({
    apiKey: config.bybitApiKey,
    apiSecret: config.bybitApiSecret,
  });

  const connectors = new Map<ExchangeVenue, import('../logic/exchangeConnectorInterface').IExchangeConnector>([
    ['BINANCE', binanceConnector],
    ['BYBIT', bybitConnector],
  ]);

  const exchangeRouter = new ExchangeRouter({
    defaultVenue: config.defaultVenue ?? 'BINANCE',
    connectors,
  });

  const liveRouter = new LiveRouter({
    tradeMode: config.tradeMode,
    riskGuard,
    paperEngine,
    exchangeRouter: config.tradeMode === 'live' ? exchangeRouter : undefined,
    learningLogger: createLearningLogger(),
  });

  liveRouterInstance = liveRouter;
  return liveRouter;
}

/**
 * Gibt die aktuelle LiveRouter-Instanz zurück
 */
export function getLiveRouter(): LiveRouter | null {
  return liveRouterInstance;
}
