/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - TRADING TYPES
 * Zentrale Order- und Trading-Typen für Live, Paper und Backtest
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENUMS
// ─────────────────────────────────────────────────────────────────────────────

/** Modus: Live, Paper oder Backtest */
export type TradeMode = 'live' | 'paper' | 'backtest';

/** Order-Seite: Kauf oder Verkauf */
export type OrderSide = 'buy' | 'sell';

/** Order-Typ: Market, Limit, Stop, Stop-Limit */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

// ─────────────────────────────────────────────────────────────────────────────
// ORDER INTENT (Agent → LiveRouter)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OrderIntent: Einheitliche Repräsentation einer Order-Absicht von Agenten.
 * Wird vom LiveRouter je nach TradeMode weitergeleitet oder simuliert.
 */
export interface OrderIntent {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;           // Für Limit/Stop-Limit
  stopPrice?: number;       // Für Stop/Stop-Limit
  reduceOnly?: boolean;
  tag?: string;            // Agent- oder Strategy-Tag
  metadata?: Record<string, unknown>;
}

/**
 * Hilfsfunktion: OrderIntent aus Signalen erstellen
 */
export function createOrderIntent(
  symbol: string,
  side: OrderSide,
  quantity: number,
  options?: Partial<Pick<OrderIntent, 'type' | 'price' | 'stopPrice' | 'reduceOnly' | 'tag' | 'metadata'>>
): OrderIntent {
  return {
    symbol,
    side,
    type: options?.type ?? 'market',
    quantity,
    price: options?.price,
    stopPrice: options?.stopPrice,
    reduceOnly: options?.reduceOnly,
    tag: options?.tag,
    metadata: options?.metadata,
  };
}
