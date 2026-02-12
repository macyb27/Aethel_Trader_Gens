/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE TYPES
 * Live-Order-Typen für Exchange-Connectors und Router
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from './trading';

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE VENUE
// ─────────────────────────────────────────────────────────────────────────────

export type ExchangeVenue = 'BINANCE' | 'BYBIT' | 'PAPER';

// ─────────────────────────────────────────────────────────────────────────────
// LIVE ORDER INTENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LiveOrderIntent – OrderIntent + Ziel-Exchange
 * Wird vom ExchangeRouter an den entsprechenden Connector weitergeleitet.
 */
export interface LiveOrderIntent extends OrderIntent {
  /** Ziel-Exchange */
  venue: ExchangeVenue;
  /** Client-Order-ID (optional, wird sonst generiert) */
  clientOrderId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE ORDER RESULT
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus = 'new' | 'submitted' | 'filled' | 'partial' | 'canceled' | 'rejected' | 'expired';

export interface LiveOrderResult {
  /** Original Intent-ID */
  intentId: string;
  /** Exchange-Order-ID */
  orderId?: string;
  /** Client-Order-ID */
  clientOrderId?: string;
  /** Venue */
  venue: ExchangeVenue;
  /** Status */
  status: OrderStatus;
  /** Ausgeführte Menge */
  filledQuantity?: number;
  /** Durchschnittspreis */
  avgPrice?: number;
  /** Fehlermeldung (falls rejected) */
  error?: string;
  /** Zeitstempel */
  timestamp: number;
}
