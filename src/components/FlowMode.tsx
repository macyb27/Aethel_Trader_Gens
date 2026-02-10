/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - FLOW MODE (Audit Logbook)
 * Secure, scrolling logbook with conservative-serious audit feeling
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, For, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { state, actions, LogEntry } from '../store';
import OracleAssistPanel from './OracleAssistPanel';

// ─────────────────────────────────────────────────────────────────────────────
// LOG ENTRY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LogEntryRow: Component<{ log: LogEntry }> = (props) => {
  const levelClass = () => {
    switch (props.log.level) {
      case 'info': return 'log-info';
      case 'warn': return 'log-warn';
      case 'error': return 'log-error';
      case 'success': return 'log-success';
      case 'quantum': return 'log-quantum';
      default: return 'log-info';
    }
  };
  
  const levelIcon = () => {
    switch (props.log.level) {
      case 'info': return '○';
      case 'warn': return '⚠';
      case 'error': return '✖';
      case 'success': return '✓';
      case 'quantum': return '◈';
      default: return '○';
    }
  };
  
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  return (
    <div class={`log-entry ${levelClass()}`}>
      <span class="log-timestamp">{formatTime(props.log.timestamp)}</span>
      <span class="log-icon">{levelIcon()}</span>
      <span class="log-level">[{props.log.level.toUpperCase().padEnd(7)}]</span>
      <span class="log-source">&lt;{props.log.source}&gt;</span>
      <span class="log-message">{props.log.message}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// METRICS PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const MetricsPanel: Component = () => {
  return (
    <div class="metrics-panel panel">
      <div class="panel-header">
        <span class="panel-icon">📊</span>
        ORACLE METRICS
      </div>
      <div class="panel-body">
        <div class="metric-row">
          <span class="metric-label">Status</span>
          <span class="metric-value" classList={{
            'text-cyan': state.status === 'active',
            'text-green': state.status === 'ready',
            'text-red': state.status === 'survival',
            'text-purple': state.status === 'initializing',
          }}>
            {state.status.toUpperCase()}
          </span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Agents</span>
          <span class="metric-value text-cyan">
            {state.agentsSpawned}/{state.totalAgents}
          </span>
        </div>
        
        <div class="metric-divider" />
        
        <Show when={state.activeGenome}>
          <div class="metric-group-title">Active Genome</div>
          
          <div class="metric-row">
            <span class="metric-label">Sharpe Ratio</span>
            <span class="metric-value" classList={{
              'text-green': state.activeGenome!.sharpeRatio > 1,
              'text-cyan': state.activeGenome!.sharpeRatio > 0 && state.activeGenome!.sharpeRatio <= 1,
              'text-red': state.activeGenome!.sharpeRatio <= 0,
            }}>
              {state.activeGenome!.sharpeRatio.toFixed(3)}
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">Max Drawdown</span>
            <span class="metric-value text-red">
              -{(state.activeGenome!.maxDrawdown * 100).toFixed(2)}%
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">Win Rate</span>
            <span class="metric-value text-cyan">
              {(state.activeGenome!.winRate * 100).toFixed(1)}%
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">Generation</span>
            <span class="metric-value text-purple">
              #{state.activeGenome!.generation}
            </span>
          </div>
        </Show>
        
        <Show when={!state.activeGenome}>
          <div class="metric-empty">
            <span class="metric-empty-icon">⌛</span>
            <span>No active genome</span>
          </div>
        </Show>
        
        <div class="metric-divider" />
        
        <div class="metric-group-title">Phenotype Bias</div>
        
        <div class="metric-row">
          <span class="metric-label">Risk</span>
          <div class="metric-bar">
            <div 
              class="metric-bar-fill risk" 
              style={{ width: `${state.currentPhenotype.riskLevel * 100}%` }} 
            />
          </div>
          <span class="metric-value-small">{(state.currentPhenotype.riskLevel * 100).toFixed(0)}%</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Horizon</span>
          <div class="metric-bar">
            <div 
              class="metric-bar-fill horizon" 
              style={{ width: `${state.currentPhenotype.timeHorizon * 100}%` }} 
            />
          </div>
          <span class="metric-value-small">{(state.currentPhenotype.timeHorizon * 100).toFixed(0)}%</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Trend</span>
          <div class="metric-bar">
            <div 
              class="metric-bar-fill trend" 
              style={{ width: `${state.currentPhenotype.trendBias * 100}%` }} 
            />
          </div>
          <span class="metric-value-small">{(state.currentPhenotype.trendBias * 100).toFixed(0)}%</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Volatility</span>
          <div class="metric-bar">
            <div 
              class="metric-bar-fill volatility" 
              style={{ width: `${state.currentPhenotype.volatilityAffinity * 100}%` }} 
            />
          </div>
          <span class="metric-value-small">{(state.currentPhenotype.volatilityAffinity * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const PortfolioPanel: Component = () => {
  return (
    <div class="portfolio-panel panel">
      <div class="panel-header">
        <span class="panel-icon">💰</span>
        PORTFOLIO
      </div>
      <div class="panel-body">
        <div class="portfolio-value">
          <span class="portfolio-label">Total Value</span>
          <span class="portfolio-amount text-cyan">
            ${state.portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <div class="portfolio-pnl">
          <div class="pnl-row">
            <span class="pnl-label">Unrealized P&L</span>
            <span class="pnl-value" classList={{
              'text-green': state.portfolio.unrealizedPnL > 0,
              'text-red': state.portfolio.unrealizedPnL < 0,
              'text-muted': state.portfolio.unrealizedPnL === 0,
            }}>
              {state.portfolio.unrealizedPnL >= 0 ? '+' : ''}
              ${state.portfolio.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div class="pnl-row">
            <span class="pnl-label">Realized P&L</span>
            <span class="pnl-value" classList={{
              'text-green': state.portfolio.realizedPnL > 0,
              'text-red': state.portfolio.realizedPnL < 0,
              'text-muted': state.portfolio.realizedPnL === 0,
            }}>
              {state.portfolio.realizedPnL >= 0 ? '+' : ''}
              ${state.portfolio.realizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <Show when={state.portfolio.positions.length > 0}>
          <div class="positions-list">
            <div class="positions-header">Open Positions</div>
            <For each={state.portfolio.positions}>
              {(pos) => (
                <div class="position-row">
                  <span class="position-symbol">{pos.symbol}</span>
                  <span class={`position-side ${pos.side}`}>{pos.side.toUpperCase()}</span>
                  <span class="position-pnl" classList={{
                    'text-green': pos.unrealizedPnL > 0,
                    'text-red': pos.unrealizedPnL < 0,
                  }}>
                    {pos.unrealizedPnL >= 0 ? '+' : ''}
                    ${pos.unrealizedPnL.toFixed(2)}
                  </span>
                </div>
              )}
            </For>
          </div>
        </Show>
        
        <Show when={state.portfolio.positions.length === 0}>
          <div class="positions-empty">No open positions</div>
        </Show>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FLOW MODE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const FlowMode: Component = () => {
  let logContainerRef: HTMLDivElement | undefined;
  const [autoScroll, setAutoScroll] = createSignal(true);
  
  // Auto-scroll to bottom when new logs arrive
  onMount(() => {
    const observer = new MutationObserver(() => {
      if (autoScroll() && logContainerRef) {
        logContainerRef.scrollTop = logContainerRef.scrollHeight;
      }
    });
    
    if (logContainerRef) {
      observer.observe(logContainerRef, { childList: true, subtree: true });
    }
    
    onCleanup(() => observer.disconnect());
  });
  
  // Handle manual scroll
  const handleScroll = () => {
    if (!logContainerRef) return;
    const isAtBottom = logContainerRef.scrollHeight - logContainerRef.scrollTop <= logContainerRef.clientHeight + 50;
    setAutoScroll(isAtBottom);
  };
  
  return (
    <div class="flow-mode">
      <div class="flow-header">
        <div class="flow-header-left">
          <h2 class="flow-title">
            <span class="flow-icon">📜</span>
            ORACLE LOGBOOK
          </h2>
          <span class="flow-subtitle">Secure Audit Trail</span>
        </div>
        
        <div class="flow-header-right">
          <Show when={state.crisis.isActive}>
            <div class="crisis-badge">
              <span class="crisis-pulse" />
              <span class="crisis-text">🛡️ SHIELD ACTIVE</span>
            </div>
          </Show>
          
          <div class="status-badge" classList={{
            active: state.status === 'active',
            ready: state.status === 'ready',
            survival: state.status === 'survival',
            initializing: state.status === 'initializing',
          }}>
            <span class="status-dot" />
            <span class="status-text">{state.status.toUpperCase()}</span>
          </div>
          
          <button 
            class="btn btn-small"
            onClick={() => actions.clearLogs()}
            title="Clear logs"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div class="flow-body">
        <div class="flow-content">
          <div 
            ref={logContainerRef}
            class="log-container" 
            onScroll={handleScroll}
          >
            <Show when={state.logs.length === 0}>
              <div class="log-empty">
                <div class="log-empty-icon">⏳</div>
                <p class="log-empty-title">Awaiting Oracle Initialization...</p>
                <p class="log-empty-subtitle">Logs will appear here once the system is active</p>
              </div>
            </Show>
            
            <For each={state.logs.slice().reverse()}>
              {(log) => <LogEntryRow log={log} />}
            </For>
          </div>
          
          <Show when={!autoScroll()}>
            <button 
              class="scroll-to-bottom"
              onClick={() => {
                if (logContainerRef) {
                  logContainerRef.scrollTop = logContainerRef.scrollHeight;
                  setAutoScroll(true);
                }
              }}
            >
              ↓ New logs available
            </button>
          </Show>
        </div>
        
        <div class="flow-sidebar">
          <MetricsPanel />
          <PortfolioPanel />
          <OracleAssistPanel />
        </div>
      </div>
    </div>
  );
};

export default FlowMode;
