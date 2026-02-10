import { Spot, Side, OrderType } from "@binance/connector-typescript"
import { OrderExchangeConnector } from "../logic/orderConnector"
import { LiveOrderIntent, LiveOrderResult } from "../types/exchange"

export interface BinanceConnectorConfig {
  apiKey: string
  apiSecret: string
  baseUrl?: string
}

export class BinanceConnector implements OrderExchangeConnector {
  private client: Spot

  constructor(cfg: BinanceConnectorConfig) {
    this.client = new Spot(cfg.apiKey, cfg.apiSecret, {
      baseURL: cfg.baseUrl ?? "https://api.binance.com",
    })
  }

  async placeOrder(intent: LiveOrderIntent): Promise<LiveOrderResult> {
    const side = intent.side === "buy" ? Side.BUY : Side.SELL
    const type = intent.type === "market" ? OrderType.MARKET : OrderType.LIMIT

    const options: Record<string, unknown> = {
      quantity: intent.amount,
    }
    if (intent.type === "limit" && intent.price != null) {
      options.price = intent.price
      options.timeInForce = "GTC"
    }
    if (intent.clientOrderId) {
      options.newClientOrderId = intent.clientOrderId
    }

    const res = await this.client.newOrder(
      intent.symbol,
      side,
      type,
      options
    )

    return {
      venue: "binance",
      symbol: intent.symbol,
      orderId: String(res.orderId),
      clientOrderId: res.clientOrderId,
      status: (res.status?.toLowerCase?.() ?? "new") as LiveOrderResult["status"],
      executedQty: Number(res.executedQty ?? 0),
      avgPrice: res.price ? Number(res.price) : undefined,
      raw: res,
    }
  }
}
