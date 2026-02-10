/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - EXCHANGE CONNECTOR INTERFACE
 * Interface für Order-Ausführung (nicht Market-Data)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { ExchangeVenue, LiveOrderResult } from '../types/exchange';

/**
 * IExchangeConnector – Order-Ausführung an einer Börse
 * Connectors (Binance, Bybit) implementieren dieses Interface.
 */
export interface IExchangeConnector {
  readonly venue: ExchangeVenue;

  /** Order ausführen */
  executeOrder(intent: OrderIntent): Promise<LiveOrderResult>;

  /** Verbindung prüfen */
  isConnected(): boolean;

  /** Verbinden */
  connect(): Promise<void>;

  /** Trennen */
  disconnect(): void;
}
