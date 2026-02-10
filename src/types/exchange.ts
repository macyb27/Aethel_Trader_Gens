/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE TYPES
 * Live-Order- und Exchange-spezifische Typen
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from './trading';

/** Unterstützte Börsen */
export type ExchangeVenue = 'BINANCE' | 'BYBIT';

/** Live-Order-Intent: OrderIntent + Ziel-Börse */
export interface LiveOrderIntent extends OrderIntent {
  venue?: ExchangeVenue;    // Falls nicht gesetzt: Default-Börse
}

/** Ergebnis einer Live-Order-Platzierung */
export interface LiveOrderResult {
  success: boolean;
  orderId?: string;
  clientOrderId?: string;
  error?: string;
  venue: ExchangeVenue;
}
