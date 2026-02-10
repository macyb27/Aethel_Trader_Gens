import { RestClientV5 } from "bybit-api"
import { OrderExchangeConnector } from "../logic/orderConnector"
import { LiveOrderIntent, LiveOrderResult } from "../types/exchange"

export interface BybitConnectorConfig {
  apiKey: string
  apiSecret: string
  testnet?: boolean
}

export class BybitConnector implements OrderExchangeConnector {
  private client: RestClientV5

  constructor(cfg: BybitConnectorConfig) {
    this.client = new RestClientV5({
      key: cfg.apiKey,
      secret: cfg.apiSecret,
      testnet: cfg.testnet ?? true,
    })
  }

  async placeOrder(intent: LiveOrderIntent): Promise<LiveOrderResult> {
    const side = intent.side === "buy" ? "Buy" : "Sell"
    const orderType = intent.type === "market" ? "Market" : "Limit"

    const res = (await this.client.submitOrder({
      category: "linear",
      symbol: intent.symbol,
      side,
      orderType,
      qty: intent.amount.toString(),
      price: intent.price?.toString(),
      timeInForce: "GTC",
      orderLinkId: intent.clientOrderId,
    })) as unknown as { result: Record<string, unknown> }

    const o = res.result
    return {
      venue: "bybit",
      symbol: intent.symbol,
      orderId: o.orderId as string,
      clientOrderId: o.orderLinkId as string | undefined,
      status: ((o.orderStatus as string)?.toLowerCase?.() ?? "new") as LiveOrderResult["status"],
      executedQty: Number(o.cumExecQty ?? 0),
      avgPrice: o.avgPrice ? Number(o.avgPrice) : undefined,
      raw: res,
    }
  }
}
