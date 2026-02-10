import { Candle } from "../types/backtest"
import { OrderIntent } from "../types/trading"

export interface AgentContext {
  readonly id: string
}

export abstract class BaseAgent {
  constructor(public readonly ctx: AgentContext) {}

  abstract decide(bar: Candle): Promise<OrderIntent[]>
}
