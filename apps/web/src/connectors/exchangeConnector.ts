/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE CONNECTOR INTERFACE
 * Interface für Live-Order-Platzierung an Börsen
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { LiveOrderResult } from '../types/exchange';
import type { ExchangeVenue } from '../types/exchange';

export interface IExchangeConnector {
  readonly venue: ExchangeVenue;
  placeOrder(intent: OrderIntent): Promise<LiveOrderResult>;
}
