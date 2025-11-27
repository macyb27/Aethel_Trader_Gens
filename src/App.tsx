/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - MAIN APPLICATION
 * Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, Show, onMount, onCleanup, lazy, Suspense } from 'solid-js';
import { state, actions, StrategyDNA } from './store';
import './index.css';
import './styles/flow-mode.css';
import './styles/nexus-mode.css';

// Lazy load heavy components
const FlowMode = lazy(() => import('./components/FlowMode'));
const NexusMode = lazy(() => import('./components/NexusMode'));

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
// MODE TRANSITION OVERLAY (Plasma Warp Effect)
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
// MODE LOADING FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

const ModeLoadingFallback: Component = () => {
  return (
    <div class="mode-loading">
      <div class="mode-loading-spinner" />
      <p>Loading view...</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE MOCK POPULATION (For Demo)
// ─────────────────────────────────────────────────────────────────────────────

function generateMockPopulation(count: number): StrategyDNA[] {
  const population: StrategyDNA[] = [];
  
  for (let i = 0; i < count; i++) {
    const dna: StrategyDNA = {
      genomeId: `GENOME-${i.toString().padStart(4, '0')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      genomeString: btoa(`R${Math.random().toFixed(4)}H${Math.random().toFixed(4)}`),
      generation: Math.floor(Math.random() * 50) + 1,
      sharpeRatio: (Math.random() * 4) - 1, // -1 to 3
      sortinoRatio: (Math.random() * 4) - 1,
      maxDrawdown: Math.random() * 0.3, // 0-30%
      winRate: 0.4 + Math.random() * 0.3, // 40-70%
      profitFactor: 0.8 + Math.random() * 1.5, // 0.8-2.3
      totalTrades: Math.floor(Math.random() * 1000) + 100,
      riskLevel: Math.random(),
      timeHorizon: Math.random(),
      trendBias: Math.random(),
      volatilityAffinity: Math.random(),
      entanglementScore: Math.random(),
      lastSentiment: (Math.random() * 2) - 1, // -1 to 1
      isActive: i === 0,
      isSurvivalDna: false,
      fitnessRank: i + 1,
    };
    population.push(dna);
  }
  
  // Sort by Sharpe ratio
  population.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
  population.forEach((dna, idx) => {
    dna.fitnessRank = idx + 1;
  });
  
  return population;
}

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
          
          // Generate mock population for GSM visualization
          const mockPopulation = generateMockPopulation(50);
          actions.updatePopulation(mockPopulation);
          actions.setActiveGenome(mockPopulation[0]);
          
          actions.addLog('info', 'GA', `Loaded ${mockPopulation.length} genome population`);
          actions.addLog('success', 'GSM', '🌌 Generative Strategy Matrix ready');
          
          // Set status to active
          setTimeout(() => {
            actions.setStatus('active');
            actions.addLog('info', 'CORE', '🚀 Oracle now ACTIVE - Ready for trading');
          }, 1000);
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
          if (state.status !== 'initializing') {
            actions.setMode('flow');
            actions.addLog('info', 'UI', 'Switched to Flow Mode (Audit Logbook)');
          }
          break;
        case 'n':
          if (state.status !== 'initializing') {
            actions.setMode('nexus');
            actions.addLog('info', 'UI', 'Switched to Nexus Mode (GSM 3D)');
          }
          break;
        case 'escape':
          if (state.status !== 'initializing') {
            actions.toggleMode();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleKeydown));
  });
  
  // Simulate periodic log entries
  onMount(() => {
    const logInterval = setInterval(() => {
      if (state.status === 'active' && Math.random() > 0.7) {
        const logTypes = [
          { level: 'info' as const, source: 'MARKET', messages: [
            'BTC/USDT price update: $42,150.00',
            'ETH/USDT volume spike detected',
            'Funding rate normalized',
          ]},
          { level: 'quantum' as const, source: 'QUANTUM', messages: [
            'Entanglement score: 0.847',
            'Correlation matrix updated',
            'Quantum state synchronized',
          ]},
          { level: 'info' as const, source: 'GA', messages: [
            'Evolution cycle completed',
            'Best genome fitness: 0.892',
            'Population diversity: 0.73',
          ]},
        ];
        
        const type = logTypes[Math.floor(Math.random() * logTypes.length)];
        const message = type.messages[Math.floor(Math.random() * type.messages.length)];
        actions.addLog(type.level, type.source, message);
      }
    }, 3000);
    
    onCleanup(() => clearInterval(logInterval));
  });
  
  return (
    <div class="app-container">
      {/* Loading Screen */}
      <Show when={state.status === 'initializing'}>
        <LoadingScreen />
      </Show>
      
      {/* Main Content */}
      <Show when={state.status !== 'initializing'}>
        <Suspense fallback={<ModeLoadingFallback />}>
          <Show when={state.mode === 'flow'}>
            <FlowMode />
          </Show>
          
          <Show when={state.mode === 'nexus'}>
            <NexusMode />
          </Show>
        </Suspense>
        
        <HotkeyHints />
      </Show>
      
      {/* Overlays */}
      <ModeTransition />
      <CrisisOverlay />
      
      {/* Mode Loading Style */}
      <style>{`
        .mode-loading {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--void-black);
          color: var(--text-secondary);
        }
        
        .mode-loading-spinner {
          width: 40px;
          height: 40px;
          border: 2px solid transparent;
          border-top-color: var(--neon-cyan);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-md);
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
