/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE ROUTER
 * Multi-Exchange-Router: leitet Orders an die richtige Börse
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { LiveOrderResult, LiveOrderIntent, ExchangeVenue } from '../types/exchange';
import type { IExchangeConnector } from '../connectors/exchangeConnector';
import { BinanceConnector } from '../connectors/binanceConnector';
import { BybitConnector } from '../connectors/bybitConnector';

export class ExchangeRouter {
  private connectors: Map<ExchangeVenue, IExchangeConnector> = new Map();
  private defaultVenue: ExchangeVenue;

  constructor(defaultVenue: ExchangeVenue = 'BYBIT') {
    this.defaultVenue = defaultVenue;
    this.connectors.set('BINANCE', new BinanceConnector());
    this.connectors.set('BYBIT', new BybitConnector());
  }

  /** Routet OrderIntent an die gewählte Börse */
  async route(intent: OrderIntent, venue?: string): Promise<LiveOrderResult> {
    const liveIntent = intent as LiveOrderIntent;
    const targetVenue: ExchangeVenue =
      (venue as ExchangeVenue) ?? liveIntent.venue ?? this.defaultVenue;

    const connector = this.connectors.get(targetVenue);
    if (!connector) {
      return {
        success: false,
        error: `No connector for venue: ${targetVenue}`,
        venue: targetVenue,
      };
    }

    return connector.placeOrder(intent);
  }

  setDefaultVenue(venue: ExchangeVenue): void {
    this.defaultVenue = venue;
  }

  registerConnector(connector: IExchangeConnector): void {
    this.connectors.set(connector.venue, connector);
  }
}
