/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BYBIT CONNECTOR
 * Live-Order-Platzierung an Bybit
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { callExchangeApi } from '../services/api';
import type { OrderIntent } from '../types/trading';
import type { LiveOrderResult } from '../types/exchange';
import type { IExchangeConnector } from './exchangeConnector';

export class BybitConnector implements IExchangeConnector {
  readonly venue = 'BYBIT' as const;

  async placeOrder(intent: OrderIntent): Promise<LiveOrderResult> {
    try {
      const orderType = intent.type === 'market' ? 'Market' : intent.type === 'limit' ? 'Limit' : 'Market';
      const side = intent.side === 'buy' ? 'Buy' : 'Sell';
      const body: Record<string, unknown> = {
        category: 'linear',
        symbol: intent.symbol,
        side,
        orderType,
        qty: intent.quantity.toString(),
      };
      if (intent.type === 'limit' || intent.type === 'stop_limit') {
        body.price = intent.price?.toString();
      }
      if (intent.type === 'stop' || intent.type === 'stop_limit') {
        body.stopLoss = intent.stopPrice?.toString();
      }
      if (intent.reduceOnly) {
        body.reduceOnly = true;
      }

      const response = await callExchangeApi<{
        result?: { orderId?: string; orderLinkId?: string };
        retMsg?: string;
      }>({
        exchange: 'BYBIT',
        endpoint: '/v5/order/create',
        method: 'POST',
        body,
      });

      if (response.retMsg && response.retMsg !== 'OK') {
        return {
          success: false,
          error: response.retMsg,
          venue: 'BYBIT',
        };
      }

      const orderId = response.result?.orderId;
      const clientOrderId = response.result?.orderLinkId;

      return {
        success: true,
        orderId,
        clientOrderId,
        venue: 'BYBIT',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        venue: 'BYBIT',
      };
    }
  }
}
