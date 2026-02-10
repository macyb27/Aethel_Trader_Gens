import { LiveOrderIntent, LiveOrderResult } from "../types/exchange"

export interface ExchangeConnector {
  placeOrder(intent: LiveOrderIntent): Promise<LiveOrderResult>
  cancelOrder?(
    venue: string,
    symbol: string,
    orderId: string
  ): Promise<void>
}
