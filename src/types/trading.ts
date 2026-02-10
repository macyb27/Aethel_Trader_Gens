/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - TRADING TYPES
 * Zentrale Order- und Trading-Typen für LiveRouter, Backtest und Agenten
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// TRADE MODE
// ─────────────────────────────────────────────────────────────────────────────

/** Betriebsmodus: Paper, Live oder Backtest */
export type TradeMode = 'paper' | 'live' | 'backtest';

// ─────────────────────────────────────────────────────────────────────────────
// ORDER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type OrderSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

/** Aktion: Was soll mit der Order passieren? (für erweiterte Flows) */
export type OrderAction =
  | { action: 'open'; side: OrderSide; symbol: string; quantity: number; orderType?: OrderType; price?: number; stopPrice?: number }
  | { action: 'close'; symbol: string; quantity?: number; closeAll?: boolean }
  | { action: 'modify'; orderId: string; symbol: string; quantity?: number; price?: number; stopPrice?: number }
  | { action: 'cancel'; orderId: string; symbol: string };

// ─────────────────────────────────────────────────────────────────────────────
// ORDER INTENT (Strategy-/Agent-Ausgabe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OrderIntent – gemeinsame Schnittstelle für Strategien und Agenten.
 * LiveRouter nimmt OrderIntent[] entgegen und routed sie je nach TradeMode.
 */
export interface OrderIntentBase {
  /** Eindeutige ID (z.B. von Agent/Strategie) */
  id: string;
  /** Symbol (z.B. BTCUSDT) */
  symbol: string;
  /** Seite */
  side: OrderSide;
  /** Order-Typ */
  orderType: OrderType;
  /** Menge in Basiswährung */
  quantity: number;
  /** Limit-Preis (bei limit/stop_limit) */
  price?: number;
  /** Stop-Preis (bei stop/stop_limit) */
  stopPrice?: number;
  /** Quelle (Agent-ID, Strategie-ID) */
  source: string;
  /** Zeitstempel */
  timestamp: number;
  /** Metadaten */
  metadata?: Record<string, unknown>;
}

/**
 * Erweiterter OrderIntent mit optionalen SL/TP
 */
export interface OrderIntent extends OrderIntentBase {
  /** Stop-Loss (als Prozent oder absoluter Preis) */
  stopLoss?: number | { percent: number } | { price: number };
  /** Take-Profit */
  takeProfit?: number | { percent: number } | { price: number };
  /** Schließen einer bestehenden Position? */
  closePosition?: boolean;
}
