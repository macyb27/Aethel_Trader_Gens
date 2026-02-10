import { Candle } from "../types/backtest"
import * as fs from "node:fs"
import * as readline from "node:readline"

export async function loadCandlesFromCsv(path: string): Promise<Candle[]> {
  const stream = fs.createReadStream(path)
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  const candles: Candle[] = []
  let isHeader = true

  for await (const line of rl) {
    if (!line.trim()) continue
    if (isHeader) {
      isHeader = false
      continue
    }

    const [symbol, ts, open, high, low, close, volume] = line.split(",")
    candles.push({
      symbol: symbol ?? "",
      timestamp: Number(ts),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    })
  }

  return candles
}
