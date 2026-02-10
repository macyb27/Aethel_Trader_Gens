import { Candle, BacktestConfig, BacktestResult, SimulatedFill } from "../types/backtest"
import { Strategy } from "./strategyAdapter"
import { OrderIntent } from "../types/trading"

export class BacktestEngine {
  constructor(private readonly cfg: BacktestConfig) {}

  run(strategy: Strategy, data: Candle[]): BacktestResult {
    let cash = this.cfg.initialCapital
    let position = 0
    let avgPrice = 0

    const equityCurve: { t: number; equity: number }[] = []
    const trades: SimulatedFill[] = []

    for (const bar of data) {
      const intents: OrderIntent[] = strategy.onBar(bar)

      for (const intent of intents) {
        const fills = this.simulateFill(intent, bar)
        for (const f of fills) {
          const value = f.price * f.qty
          const fee = value * this.cfg.commission

          if (f.side === "buy") {
            const totalCost = avgPrice * position + value
            position += f.qty
            avgPrice = position > 0 ? totalCost / position : 0
            cash -= value + fee
          } else {
            position -= f.qty
            cash += value - fee
            if (position <= 0) {
              position = 0
              avgPrice = 0
            }
          }

          trades.push({ ...f, fee })
        }
      }

      const markValue = position * bar.close
      const equity = cash + markValue
      equityCurve.push({ t: bar.timestamp, equity })
    }

    const stats = this.computeStats(equityCurve, trades)
    return { equityCurve, trades, stats }
  }

  private simulateFill(intent: OrderIntent, bar: Candle): SimulatedFill[] {
    if (intent.type === "market") {
      const side = intent.side === "long" ? "buy" : "sell"
      const rawPrice = bar.close
      const slip = this.cfg.slippage
      const price =
        side === "buy" ? rawPrice * (1 + slip) : rawPrice * (1 - slip)

      return [{
        timestamp: bar.timestamp,
        symbol: intent.symbol,
        side,
        qty: intent.size,
        price,
        fee: 0,
      }]
    }

    if (intent.type === "limit" && intent.limitPrice != null) {
      const hit =
        (intent.side === "long" && bar.low <= intent.limitPrice) ||
        (intent.side === "short" && bar.high >= intent.limitPrice)

      if (!hit) return []

      const side = intent.side === "long" ? "buy" : "sell"
      return [{
        timestamp: bar.timestamp,
        symbol: intent.symbol,
        side,
        qty: intent.size,
        price: intent.limitPrice,
        fee: 0,
      }]
    }

    return []
  }

  private computeStats(
    equityCurve: { t: number; equity: number }[],
    trades: SimulatedFill[]
  ): Record<string, number> {
    if (equityCurve.length === 0) return {}

    const start = equityCurve[0].equity
    const end = equityCurve[equityCurve.length - 1].equity
    const ret = (end - start) / start

    let peak = equityCurve[0].equity
    let maxDD = 0
    for (const p of equityCurve) {
      if (p.equity > peak) peak = p.equity
      const dd = (peak - p.equity) / peak
      if (dd > maxDD) maxDD = dd
    }

    return {
      totalReturn: ret,
      maxDrawdown: maxDD,
      tradeCount: trades.length,
    }
  }
}
