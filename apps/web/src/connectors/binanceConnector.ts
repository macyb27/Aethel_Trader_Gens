/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BINANCE CONNECTOR
 * Live-Order-Platzierung an Binance Futures
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { callExchangeApi } from '../services/api';
import type { OrderIntent } from '../types/trading';
import type { LiveOrderResult } from '../types/exchange';
import type { IExchangeConnector } from './exchangeConnector';

export class BinanceConnector implements IExchangeConnector {
  readonly venue = 'BINANCE' as const;

  async placeOrder(intent: OrderIntent): Promise<LiveOrderResult> {
    try {
      const orderType = intent.type.toUpperCase();
      const side = intent.side.toUpperCase();
      const body: Record<string, unknown> = {
        symbol: intent.symbol,
        side,
        type: orderType,
        quantity: intent.quantity.toString(),
      };
      if (intent.type === 'limit' || intent.type === 'stop_limit') {
        body.price = intent.price?.toString();
      }
      if (intent.type === 'stop' || intent.type === 'stop_limit') {
        body.stopPrice = intent.stopPrice?.toString();
      }
      if (intent.reduceOnly) {
        body.reduceOnly = 'true';
      }

      const response = await callExchangeApi<{
        orderId?: string;
        clientOrderId?: string;
        symbol?: string;
        status?: string;
        msg?: string;
      }>({
        exchange: 'BINANCE',
        endpoint: '/fapi/v1/order',
        method: 'POST',
        body,
      });

      if (response.msg) {
        return {
          success: false,
          error: response.msg,
          venue: 'BINANCE',
        };
      }

      return {
        success: true,
        orderId: response.orderId?.toString(),
        clientOrderId: response.clientOrderId,
        venue: 'BINANCE',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        venue: 'BINANCE',
      };
    }
  }
}
