/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - APPLICATION ENTRY POINT
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { render } from 'solid-js/web';
import App from './App';
import { bootstrapLiveTrading } from './bootstrap/liveTrading';
import { state, actions } from './store';

// Bootstrap LiveRouter für Order-Routing (Live/Paper/Backtest)
bootstrapLiveTrading({
  getPortfolio: () => {
    const p = state.portfolio;
    if (!p) return null;
    return {
      totalValue: p.totalValue,
      unrealizedPnL: p.unrealizedPnL,
      positions: (p.positions ?? []).map((pos) => ({
        symbol: pos.symbol,
        side: pos.side,
        size: pos.size,
        value: pos.size * (pos.currentPrice ?? pos.entryPrice),
      })),
    };
  },
  onLog: (level, source, message) => {
    actions.addLog(level as 'info' | 'warn' | 'error' | 'success', source, message);
  },
  defaultVenue: 'BYBIT',
});

const root = document.getElementById('root');

if (root) {
  // Remove preloader
  root.innerHTML = '';

  // Mount Solid.js application
  render(() => <App />, root);
} else {
  console.error('Root element not found');
}
