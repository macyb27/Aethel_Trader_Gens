export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  symbol: string
}

export interface BacktestConfig {
  initialCapital: number
  commission: number
  slippage: number
}

export interface SimulatedFill {
  timestamp: number
  symbol: string
  side: "buy" | "sell"
  qty: number
  price: number
  fee: number
}

export interface BacktestResult {
  equityCurve: { t: number; equity: number }[]
  trades: SimulatedFill[]
  stats: Record<string, number>
}
