import { BaseAgent } from "./baseAgent"
import { liveRouter } from "../bootstrap/liveTrading"
import { Candle } from "../types/backtest"
import { OrderIntent } from "../types/trading"

export class LiveAgentRunner {
  constructor(private readonly agent: BaseAgent) {}

  async onTick(bar: Candle): Promise<void> {
    const intents: OrderIntent[] = await this.agent.decide(bar)
    for (const intent of intents) {
      await liveRouter.route(intent)
    }
  }
}
