import { OrderExchangeConnector } from "./orderConnector"
import { LiveOrderIntent, LiveOrderResult, ExchangeVenue } from "../types/exchange"

export class ExchangeRouter implements OrderExchangeConnector {
  private readonly connectors: Partial<Record<ExchangeVenue, OrderExchangeConnector>>

  constructor(connectors: Partial<Record<ExchangeVenue, OrderExchangeConnector>>) {
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
