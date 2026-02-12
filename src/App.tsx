/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - MAIN APPLICATION
 * Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence
 * Full-Stack Version with Real API Support
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, Show, onMount, onCleanup, lazy, Suspense, createSignal, createEffect } from 'solid-js';
import { state, actions, StrategyDNA } from './store';
import { authState, authActions } from './store/auth';
import { subscribeToAllChannels, unsubscribeAll } from './services/realtime';
import { exchangeManager } from './logic/exchangeConnector';
import { startNewsFeedSimulation, startRealNewsFeed, newsOracle } from './logic/newsOracle';
import './index.css';
import './styles/flow-mode.css';
import './styles/nexus-mode.css';
import './styles/dna-panel.css';
import './styles/modals.css';
import './styles/settings.css';

const FlowMode = lazy(() => import('./components/FlowMode'));
const NexusMode = lazy(() => import('./components/NexusMode'));
const DNAControlPanel = lazy(() => import('./components/DNAControlPanel'));
const AwakeningButton = lazy(() => import('./components/AwakeningButton'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const LandingExperience = lazy(() => import('./components/LandingExperience'));

const LoadingScreen: Component = () => {
  return (
    <div class="oracle-loading">
      <div class="oracle-spinner">
        <div class="oracle-spinner-core" />
      </div>
      <h1 class="oracle-title">ÆTHER-TRADER</h1>
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

const ModeTransition: Component = () => {
  return (
    <div
      class="mode-transition"
      classList={{ active: state.isTransitioning }}
    />
  );
};

const CrisisOverlay: Component = () => {
  return (
    <div
      class="crisis-overlay"
      classList={{ active: state.crisis.isActive }}
    />
  );
};

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

const ModeLoadingFallback: Component = () => {
  return (
    <div class="mode-loading">
      <div class="mode-loading-spinner" />
      <p>Loading view...</p>
    </div>
  );
};

interface TopBarProps {
  onAuthClick: () => void;
  onSettingsClick: () => void;
  onLogoClick: () => void;
}

const TopBar: Component<TopBarProps> = (props) => {
  const hasApiKeys = () => authState.apiKeys.length > 0;
  const isRealMode = () => hasApiKeys() && authState.isAuthenticated;

  return (
    <div class="top-bar">
      <div class="top-bar-left">
        <button class="app-logo" onClick={props.onLogoClick} title="Back to landing page">
          ÆTHER
        </button>
        <Show when={isRealMode()}>
          <span class="mode-badge real">LIVE</span>
        </Show>
        <Show when={!isRealMode()}>
          <span class="mode-badge sim">DEMO</span>
        </Show>
      </div>
      <div class="top-bar-right">
        <Show when={authState.isAuthenticated}>
          <div class="user-info">
            <span class="user-email">{authState.user?.email}</span>
            <button class="btn btn-small" onClick={props.onSettingsClick}>
              Settings
            </button>
            <button class="btn btn-small" onClick={() => authActions.signOut()}>
              Sign Out
            </button>
          </div>
        </Show>
        <Show when={!authState.isAuthenticated && !authState.isLoading}>
          <button class="btn btn-primary btn-small" onClick={props.onAuthClick}>
            Sign In
          </button>
        </Show>
      </div>
    </div>
  );
};

function generateMockPopulation(count: number): StrategyDNA[] {
  const population: StrategyDNA[] = [];

  for (let i = 0; i < count; i++) {
    const dna: StrategyDNA = {
      genomeId: `GENOME-${i.toString().padStart(4, '0')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      genomeString: btoa(`R${Math.random().toFixed(4)}H${Math.random().toFixed(4)}`),
      generation: Math.floor(Math.random() * 50) + 1,
      sharpeRatio: (Math.random() * 4) - 1,
      sortinoRatio: (Math.random() * 4) - 1,
      maxDrawdown: Math.random() * 0.3,
      winRate: 0.4 + Math.random() * 0.3,
      profitFactor: 0.8 + Math.random() * 1.5,
      totalTrades: Math.floor(Math.random() * 1000) + 100,
      riskLevel: Math.random(),
      timeHorizon: Math.random(),
      trendBias: Math.random(),
      volatilityAffinity: Math.random(),
      entanglementScore: Math.random(),
      lastSentiment: (Math.random() * 2) - 1,
      isActive: i === 0,
      isSurvivalDna: false,
      fitnessRank: i + 1,
    };
    population.push(dna);
  }

  population.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
  population.forEach((dna, idx) => {
    dna.fitnessRank = idx + 1;
  });

  return population;
}

const SETTINGS_AUTO_OPEN_KEY = 'aether.settingsAutoOpened';
const LANDING_DISMISSED_KEY = 'aether.landingDismissed';

const getSettingsAutoOpenFlag = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SETTINGS_AUTO_OPEN_KEY) === 'true';
};

const setSettingsAutoOpenFlag = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_AUTO_OPEN_KEY, 'true');
};

const getLandingDismissedFlag = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LANDING_DISMISSED_KEY) === 'true';
};

const setLandingDismissedFlag = (dismissed: boolean) => {
  if (typeof window === 'undefined') return;
  if (dismissed) {
    window.localStorage.setItem(LANDING_DISMISSED_KEY, 'true');
  } else {
    window.localStorage.removeItem(LANDING_DISMISSED_KEY);
  }
};

const App: Component = () => {
  const [showAuthModal, setShowAuthModal] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [showLanding, setShowLanding] = createSignal(!getLandingDismissedFlag());
  const [didAutoOpenSettings, setDidAutoOpenSettings] = createSignal(getSettingsAutoOpenFlag());
  let newsFeedCleanup: (() => void) | null = null;
  let realtimeCleanup: (() => void) | null = null;

  const enterWorkspace = () => {
    setShowLanding(false);
    setLandingDismissedFlag(true);
  };

  const openLanding = () => {
    setShowLanding(true);
    setLandingDismissedFlag(false);
  };

  onMount(() => {
    authActions.initialize();
  });

  createEffect(() => {
    if (didAutoOpenSettings()) return;
    if (authState.isLoading || !authState.isAuthenticated) return;
    if (!authState.settings) return;
    if (authState.apiKeys.length > 0) return;

    setShowSettings(true);
    setDidAutoOpenSettings(true);
    setSettingsAutoOpenFlag();
  });

  onMount(() => {
    let agents = 0;
    const interval = setInterval(() => {
      agents += Math.floor(Math.random() * 15) + 5;
      if (agents >= state.totalAgents) {
        agents = state.totalAgents;
        clearInterval(interval);

        setTimeout(async () => {
          actions.setStatus('ready');
          actions.addLog('success', 'CORE', 'Oracle initialization complete');
          actions.addLog('info', 'CORE', `Spawned ${state.totalAgents} trading agents`);
          actions.addLog('quantum', 'QUANTUM', 'Entanglement detector online');
          actions.addLog('info', 'SHIELD', 'Oracle Shield armed and monitoring');

          const mockPopulation = generateMockPopulation(50);
          actions.updatePopulation(mockPopulation);
          actions.setActiveGenome(mockPopulation[0]);

          actions.addLog('info', 'GA', `Loaded ${mockPopulation.length} genome population`);
          actions.addLog('success', 'GSM', 'Generative Strategy Matrix ready');

          if (authState.isAuthenticated && authState.apiKeys.length > 0) {
            const hasExchangeKey = authState.apiKeys.some(
              k => (k.provider === 'BYBIT' || k.provider === 'BINANCE') && k.isActive
            );
            if (hasExchangeKey) {
              const exchange = authState.apiKeys.find(
                k => (k.provider === 'BYBIT' || k.provider === 'BINANCE') && k.isActive
              );
              if (exchange) {
                const connector = exchangeManager.getConnector(exchange.provider as 'BYBIT' | 'BINANCE');
                if (connector) {
                  connector.setRealMode(true);
                }
                await exchangeManager.connectExchange(exchange.provider as 'BYBIT' | 'BINANCE');
                actions.addLog('success', 'EXCHANGE', `Connected to ${exchange.provider} with real API`);
              }
            }

            if (newsOracle.hasRealApiKeys()) {
              newsOracle.setRealMode(true);
              newsFeedCleanup = await startRealNewsFeed();
              actions.addLog('success', 'NEWS', 'Real news feed active');
            } else {
              newsFeedCleanup = startNewsFeedSimulation();
            }

            realtimeCleanup = subscribeToAllChannels(authState.user!.id);
            actions.addLog('info', 'REALTIME', 'Subscribed to live data channels');
          } else {
            newsFeedCleanup = startNewsFeedSimulation();
            await exchangeManager.connectExchange('BYBIT');
          }

          actions.addLog('info', 'CORE', 'Press ACTIVATE ORACLE to begin');
        }, 500);
      }

      actions.updateLoadingProgress(agents, (agents / state.totalAgents) * 100);
    }, 50);

    return () => clearInterval(interval);
  });

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
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

  onCleanup(() => {
    if (newsFeedCleanup) newsFeedCleanup();
    if (realtimeCleanup) realtimeCleanup();
    unsubscribeAll();
    exchangeManager.disconnectAll();
  });

  return (
    <div class="app-container">
      <Show when={state.status === 'initializing'}>
        <LoadingScreen />
      </Show>

      <Show when={state.status !== 'initializing'}>
        <Show
          when={showLanding()}
          fallback={
            <>
              <TopBar
                onAuthClick={() => setShowAuthModal(true)}
                onSettingsClick={() => setShowSettings(true)}
                onLogoClick={openLanding}
              />

              <Suspense fallback={<ModeLoadingFallback />}>
                <Show when={state.mode === 'flow'}>
                  <FlowMode />
                </Show>

                <Show when={state.mode === 'nexus'}>
                  <NexusMode />
                </Show>

                <Show when={state.status === 'active'}>
                  <DNAControlPanel />
                </Show>

                <AwakeningButton />

                <AuthModal
                  isOpen={showAuthModal()}
                  onClose={() => setShowAuthModal(false)}
                />

                <SettingsPanel
                  isOpen={showSettings()}
                  onClose={() => setShowSettings(false)}
                />
              </Suspense>

              <HotkeyHints />
            </>
          }
        >
          <Suspense fallback={<ModeLoadingFallback />}>
            <LandingExperience
              onEnterWorkspace={enterWorkspace}
              onOpenAuth={() => setShowAuthModal(true)}
              onOpenSettings={() => setShowSettings(true)}
              isAuthenticated={authState.isAuthenticated}
              hasApiKeys={authState.apiKeys.length > 0}
            />
          </Suspense>

          <AuthModal
            isOpen={showAuthModal()}
            onClose={() => setShowAuthModal(false)}
          />

          <SettingsPanel
            isOpen={showSettings()}
            onClose={() => setShowSettings(false)}
          />
        </Show>
      </Show>

      <ModeTransition />
      <CrisisOverlay />

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

        .top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 48px;
          background: rgba(5, 5, 5, 0.95);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-lg);
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .app-logo {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--neon-cyan);
          letter-spacing: 2px;
        }

        .app-logo:hover {
          text-shadow: var(--glow-cyan);
        }

        .mode-badge {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mode-badge.real {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.4);
        }

        .mode-badge.sim {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
          border: 1px solid rgba(255, 170, 0, 0.4);
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .user-email {
          color: var(--text-secondary);
          font-size: 0.8rem;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .flow-mode,
        .nexus-mode {
          padding-top: 48px;
        }
      `}</style>
    </div>
  );
};

export default App;
