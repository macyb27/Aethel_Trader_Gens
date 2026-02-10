import { Candle } from "../types/backtest"
import { OrderIntent } from "../types/trading"

export interface Strategy {
  readonly id: string
  onBar(bar: Candle): OrderIntent[]
}
