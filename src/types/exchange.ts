export type ExchangeVenue = "binance" | "bybit"

export interface LiveOrderIntent {
  venue: ExchangeVenue
  symbol: string          // z.B. "BTCUSDT"
  side: "buy" | "sell"
  type: "market" | "limit"
  amount: number
  price?: number
  clientOrderId?: string
}

export interface LiveOrderResult {
  venue: ExchangeVenue
  symbol: string
  orderId: string
  clientOrderId?: string
  status: "new" | "filled" | "partial" | "canceled" | "rejected"
  executedQty: number
  avgPrice?: number
  raw: unknown
}
