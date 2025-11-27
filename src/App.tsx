/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - MAIN APPLICATION
 * Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, Show, onMount, onCleanup, createEffect } from 'solid-js';
import { state, actions } from './store';
import './index.css';

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SCREEN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LoadingScreen: Component = () => {
  return (
    <div class="oracle-loading">
      <div class="oracle-spinner">
        <div class="oracle-spinner-core" />
      </div>
      <h1 class="oracle-title">ÆTHER-TRADER Ω</h1>
      <p class="oracle-status">Oracle Initializing...</p>
      <p class="oracle-agents">
        {state.agentsSpawned} / {state.totalAgents} Agents
      </p>
      <div class="oracle-progress">
        <div 
          class="oracle-progress-bar" 
          style={{ width: `${state.loadingProgress}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODE TRANSITION OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

const ModeTransition: Component = () => {
  return (
    <div 
      class="mode-transition" 
      classList={{ active: state.isTransitioning }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS OVERLAY (Oracle Shield)
// ─────────────────────────────────────────────────────────────────────────────

const CrisisOverlay: Component = () => {
  return (
    <div 
      class="crisis-overlay"
      classList={{ active: state.crisis.isActive }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FLOW MODE COMPONENT (Audit Logbook)
// ─────────────────────────────────────────────────────────────────────────────

const FlowMode: Component = () => {
  return (
    <div class="flow-mode">
      <div class="flow-header">
        <h2 class="flow-title">
          <span class="flow-icon">📜</span>
          ORACLE LOGBOOK
        </h2>
        <div class="flow-status">
          <span class="status-dot" classList={{ active: state.status === 'active' }} />
          <span class="status-text">{state.status.toUpperCase()}</span>
        </div>
      </div>
      
      <div class="flow-content">
        <div class="log-container">
          <Show when={state.logs.length === 0}>
            <div class="log-empty">
              <span class="log-empty-icon">⏳</span>
              <p>Awaiting Oracle initialization...</p>
            </div>
          </Show>
          
          {state.logs.map((log) => (
            <div class={`log-entry log-${log.level}`}>
              <span class="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  fractionalSecondDigits: 3
                })}
              </span>
              <span class="log-level">[{log.level.toUpperCase().padEnd(7)}]</span>
              <span class="log-source">{`<${log.source}>`}</span>
              <span class="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div class="flow-sidebar">
        <div class="metrics-panel panel">
          <div class="panel-header">METRICS</div>
          <div class="panel-body">
            <div class="metric-row">
              <span class="metric-label">Agents</span>
              <span class="metric-value text-cyan">{state.agentsSpawned}</span>
            </div>
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
            <Show when={state.activeGenome}>
              <div class="metric-row">
                <span class="metric-label">Sharpe</span>
                <span class="metric-value text-green">
                  {state.activeGenome!.sharpeRatio.toFixed(3)}
                </span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Max DD</span>
                <span class="metric-value text-red">
                  {(state.activeGenome!.maxDrawdown * 100).toFixed(2)}%
                </span>
              </div>
            </Show>
          </div>
        </div>
      </div>
      
      <style>{`
        .flow-mode {
          display: grid;
          grid-template-columns: 1fr 280px;
          grid-template-rows: auto 1fr;
          height: 100%;
          background: var(--void-black);
        }
        
        .flow-header {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid rgba(0, 243, 255, 0.1);
          background: var(--deep-space);
        }
        
        .flow-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 4px;
          color: var(--neon-cyan);
          text-shadow: var(--glow-cyan);
        }
        
        .flow-icon {
          font-size: 1.5rem;
        }
        
        .flow-status {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-secondary);
        }
        
        .status-dot.active {
          background: var(--success-green);
          box-shadow: 0 0 10px var(--success-green);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .status-text {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: var(--text-secondary);
        }
        
        .flow-content {
          overflow: hidden;
          padding: var(--space-md);
        }
        
        .log-container {
          height: 100%;
          overflow-y: auto;
          padding-right: var(--space-sm);
        }
        
        .log-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-secondary);
        }
        
        .log-empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
          opacity: 0.5;
        }
        
        .log-entry {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-xs) 0;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          line-height: 1.4;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        .log-timestamp {
          color: var(--text-secondary);
          flex-shrink: 0;
          width: 100px;
        }
        
        .log-level {
          flex-shrink: 0;
          width: 80px;
        }
        
        .log-info .log-level { color: var(--neon-cyan); }
        .log-warn .log-level { color: #ffaa00; }
        .log-error .log-level { color: var(--warning-red); }
        .log-success .log-level { color: var(--success-green); }
        .log-quantum .log-level { color: var(--plasma-purple); }
        
        .log-source {
          color: var(--plasma-purple);
          flex-shrink: 0;
          width: 120px;
        }
        
        .log-message {
          color: var(--text-primary);
          flex: 1;
          word-break: break-word;
        }
        
        .flow-sidebar {
          padding: var(--space-md);
          border-left: 1px solid rgba(0, 243, 255, 0.1);
          background: rgba(10, 10, 10, 0.5);
          overflow-y: auto;
        }
        
        .metrics-panel {
          margin-bottom: var(--space-md);
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-xs) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .metric-row:last-child {
          border-bottom: none;
        }
        
        .metric-label {
          color: var(--text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .metric-value {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NEXUS MODE COMPONENT (GSM 3D Visualization Placeholder)
// ─────────────────────────────────────────────────────────────────────────────

const NexusMode: Component = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  
  onMount(() => {
    // WebGPU/Three.js initialization will happen in Phase 2
    actions.addLog('info', 'NEXUS', 'GSM Visualization initialized');
  });
  
  return (
    <div class="nexus-mode">
      <canvas ref={canvasRef} class="nexus-canvas" />
      
      <div class="nexus-overlay">
        <div class="nexus-header">
          <h2 class="nexus-title">
            <span class="nexus-icon">🌌</span>
            GENERATIVE STRATEGY MATRIX
          </h2>
        </div>
        
        <div class="nexus-info">
          <div class="gsm-stats">
            <div class="gsm-stat">
              <span class="gsm-stat-value">{state.gsmNodes.length}</span>
              <span class="gsm-stat-label">Active Genomes</span>
            </div>
            <div class="gsm-stat">
              <span class="gsm-stat-value">{state.population.length > 0 
                ? Math.max(...state.population.map(p => p.sharpeRatio)).toFixed(2)
                : '---'
              }</span>
              <span class="gsm-stat-label">Best Sharpe</span>
            </div>
          </div>
        </div>
        
        <div class="nexus-placeholder">
          <div class="placeholder-grid" />
          <p class="placeholder-text">
            3D Strategy Space Initializing...
            <br />
            <span class="text-muted">WebGPU/Three.js rendering pending</span>
          </p>
        </div>
      </div>
      
      <style>{`
        .nexus-mode {
          position: relative;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, #0a0a15 0%, var(--void-black) 100%);
          overflow: hidden;
        }
        
        .nexus-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        
        .nexus-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .nexus-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: var(--space-md) var(--space-lg);
          background: linear-gradient(180deg, rgba(5, 5, 5, 0.9) 0%, transparent 100%);
          pointer-events: auto;
        }
        
        .nexus-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 4px;
          color: var(--plasma-purple);
          text-shadow: var(--glow-purple);
        }
        
        .nexus-icon {
          font-size: 1.5rem;
        }
        
        .nexus-info {
          position: absolute;
          top: var(--space-lg);
          right: var(--space-lg);
          margin-top: 40px;
        }
        
        .gsm-stats {
          display: flex;
          gap: var(--space-lg);
        }
        
        .gsm-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: var(--space-sm) var(--space-md);
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(188, 19, 254, 0.3);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
        
        .gsm-stat-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neon-cyan);
          text-shadow: var(--glow-cyan);
        }
        
        .gsm-stat-label {
          font-size: 0.65rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        
        .nexus-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .placeholder-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-drift 20s linear infinite;
          transform: perspective(500px) rotateX(60deg);
          transform-origin: center center;
        }
        
        @keyframes grid-drift {
          from { background-position: 0 0; }
          to { background-position: 50px 50px; }
        }
        
        .placeholder-text {
          position: relative;
          text-align: center;
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 3px;
          color: var(--plasma-purple);
          text-shadow: var(--glow-purple);
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTKEY HINTS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const HotkeyHints: Component = () => {
  return (
    <div class="hotkey-hints">
      <div class="hotkey-hint">
        <span class="hotkey-key">F</span>
        <span>Flow Mode</span>
      </div>
      <div class="hotkey-hint">
        <span class="hotkey-key">N</span>
        <span>Nexus Mode</span>
      </div>
      <div class="hotkey-hint">
        <span class="hotkey-key">ESC</span>
        <span>Toggle</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const App: Component = () => {
  // Simulated initialization sequence
  onMount(() => {
    let agents = 0;
    const interval = setInterval(() => {
      agents += Math.floor(Math.random() * 15) + 5;
      if (agents >= state.totalAgents) {
        agents = state.totalAgents;
        clearInterval(interval);
        
        // Initialization complete
        setTimeout(() => {
          actions.setStatus('ready');
          actions.addLog('success', 'CORE', '✅ Oracle initialization complete');
          actions.addLog('info', 'CORE', `Spawned ${state.totalAgents} trading agents`);
          actions.addLog('quantum', 'QUANTUM', 'Entanglement detector online');
          actions.addLog('info', 'SHIELD', 'Oracle Shield armed and monitoring');
        }, 500);
      }
      
      actions.updateLoadingProgress(agents, (agents / state.totalAgents) * 100);
    }, 50);
    
    return () => clearInterval(interval);
  });
  
  // Keyboard shortcuts
  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'f':
          actions.setMode('flow');
          break;
        case 'n':
          actions.setMode('nexus');
          break;
        case 'escape':
          actions.toggleMode();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleKeydown));
  });
  
  return (
    <div class="app-container">
      {/* Loading Screen */}
      <Show when={state.status === 'initializing'}>
        <LoadingScreen />
      </Show>
      
      {/* Main Content */}
      <Show when={state.status !== 'initializing'}>
        <Show when={state.mode === 'flow'}>
          <FlowMode />
        </Show>
        
        <Show when={state.mode === 'nexus'}>
          <NexusMode />
        </Show>
        
        <HotkeyHints />
      </Show>
      
      {/* Overlays */}
      <ModeTransition />
      <CrisisOverlay />
    </div>
  );
};

export default App;
