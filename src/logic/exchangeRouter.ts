import { ExchangeConnector } from "./orderExchangeConnector"
import { LiveOrderIntent, LiveOrderResult, ExchangeVenue } from "../types/exchange"

export class ExchangeRouter implements ExchangeConnector {
  private readonly connectors: Partial<Record<ExchangeVenue, ExchangeConnector>>

  constructor(connectors: Partial<Record<ExchangeVenue, ExchangeConnector>>) {
    this.connectors = connectors
  }

  async placeOrder(intent: LiveOrderIntent): Promise<LiveOrderResult> {
    const connector = this.connectors[intent.venue]
    if (!connector) {
      throw new Error(`No connector configured for venue=${intent.venue}`)
    }
    return connector.placeOrder(intent)
  }
}
