export type TradeMode = "paper" | "live"

export type OrderSide = "long" | "short"
export type OrderType = "market" | "limit"

export interface OrderIntent {
  id?: string
  mode?: TradeMode
  symbol: string
  side: OrderSide
  type: OrderType
  size: number
  limitPrice?: number
  stopLoss?: number
  takeProfit?: number
  timeInForce?: "GTC" | "IOC" | "FOK"
  meta?: {
    sourceAgent?: string
    strategyId?: string
    lastPrice?: number
    [key: string]: unknown
  }
}
