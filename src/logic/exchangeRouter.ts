/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE ROUTER
 * Multi-Exchange-Router für Order-Ausführung
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { ExchangeVenue, LiveOrderIntent, LiveOrderResult } from '../types/exchange';
import type { IExchangeConnector } from './exchangeConnectorInterface';

export interface ExchangeRouterConfig {
  defaultVenue: ExchangeVenue;
  connectors: Map<ExchangeVenue, IExchangeConnector>;
}

/**
 * ExchangeRouter – leitet Orders an den richtigen Connector
 */
export class ExchangeRouter implements IExchangeRouter {
  private defaultVenue: ExchangeVenue;
  private connectors: Map<ExchangeVenue, IExchangeConnector>;

  constructor(config: ExchangeRouterConfig) {
    this.defaultVenue = config.defaultVenue;
    this.connectors = config.connectors;
  }

  async route(intent: OrderIntent): Promise<LiveOrderResult> {
    const venue = (intent as LiveOrderIntent).venue ?? this.defaultVenue;
    const connector = this.connectors.get(venue);

    if (!connector) {
      return {
        intentId: intent.id,
        venue,
        status: 'rejected',
        error: `No connector for venue ${venue}`,
        timestamp: Date.now(),
      };
    }

    return connector.executeOrder(intent);
  }
}

/** Interface für LiveRouter-Kompatibilität */
export interface IExchangeRouter {
  route(intent: OrderIntent): Promise<LiveOrderResult>;
}
