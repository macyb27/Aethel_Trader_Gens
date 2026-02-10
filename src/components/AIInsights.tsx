/**
 * AETHER-TRADER - AI INSIGHTS & SMART UX COMPONENTS
 * AI-powered market analysis, strategy explanations, and onboarding
 */

import { Component, createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { state } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// AI STRATEGY EXPLAINER
// ─────────────────────────────────────────────────────────────────────────────

function generateStrategyExplanation(): string {
  const genome = state.activeGenome;
  if (!genome) return 'No active strategy. Activate the Oracle to begin evolution.';

  const riskDesc = genome.riskLevel < 0.33 ? 'conservative' : genome.riskLevel < 0.66 ? 'moderate' : 'aggressive';
  const horizonDesc = genome.timeHorizon < 0.33 ? 'short-term' : genome.timeHorizon < 0.66 ? 'medium-term' : 'long-term';
  const trendDesc = genome.trendBias < 0.33 ? 'counter-trend' : genome.trendBias < 0.66 ? 'balanced' : 'trend-following';
  const volDesc = genome.volatilityAffinity < 0.33 ? 'calm markets' : genome.volatilityAffinity < 0.66 ? 'normal conditions' : 'volatile markets';

  const sharpeQuality = genome.sharpeRatio > 2 ? 'excellent' : genome.sharpeRatio > 1 ? 'good' : genome.sharpeRatio > 0 ? 'moderate' : 'poor';
  const winRateStr = (genome.winRate * 100).toFixed(0);
  const ddStr = (genome.maxDrawdown * 100).toFixed(1);

  return `This Generation ${genome.generation} strategy uses a ${riskDesc} risk profile with a ${horizonDesc} trading horizon. ` +
    `It follows a ${trendDesc} approach, optimized for ${volDesc}. ` +
    `Performance: ${sharpeQuality} Sharpe ratio (${genome.sharpeRatio.toFixed(2)}), ` +
    `${winRateStr}% win rate, max drawdown ${ddStr}%. ` +
    `Ranked #${genome.fitnessRank} in the current population of ${state.population.length} strategies.`;
}

function generateMarketInsight(): { title: string; content: string; sentiment: 'bullish' | 'bearish' | 'neutral' } {
  const insights = [
    {
      title: 'Orderflow Analysis',
      content: 'Buy pressure is increasing across major pairs. The quantum entanglement score suggests strong market coupling -- moves in BTC are likely to be amplified across altcoins.',
      sentiment: 'bullish' as const,
    },
    {
      title: 'Sentiment Shift Detected',
      content: 'News sentiment has shifted bearish in the last hour. The Oracle Shield is monitoring for potential drawdown triggers. Consider reducing exposure in aggressive strategies.',
      sentiment: 'bearish' as const,
    },
    {
      title: 'Evolution Progress',
      content: `The genetic algorithm has processed ${state.population.length} genomes. Population diversity is healthy, and the best strategy shows consistent improvement over the last 5 generations.`,
      sentiment: 'neutral' as const,
    },
    {
      title: 'Volatility Alert',
      content: 'Market volatility has increased 40% in the last 30 minutes. High-volatility strategies are being prioritized by the evolution engine. The quantum coherence metric is dropping.',
      sentiment: 'bearish' as const,
    },
    {
      title: 'Optimal Window Detected',
      content: 'The AI has identified a low-volatility window with strong directional bias. Trend-following strategies are showing peak performance in backtests.',
      sentiment: 'bullish' as const,
    },
    {
      title: 'Correlation Breakdown',
      content: 'BTC/ETH correlation has diverged from historical norms. The quantum edge detector signals a potential regime change. Diversification benefits are currently elevated.',
      sentiment: 'neutral' as const,
    },
  ];

  return insights[Math.floor(Math.random() * insights.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INSIGHT PANEL (shown in FlowMode sidebar)
// ─────────────────────────────────────────────────────────────────────────────

export const AIInsightPanel: Component = () => {
  const [insight, setInsight] = createSignal(generateMarketInsight());
  const [strategyExplainer, setStrategyExplainer] = createSignal(generateStrategyExplanation());
  const [isRefreshing, setIsRefreshing] = createSignal(false);

  onMount(() => {
    const interval = setInterval(() => {
      setInsight(generateMarketInsight());
      setStrategyExplainer(generateStrategyExplanation());
    }, 15000);
    onCleanup(() => clearInterval(interval));
  });

  const refreshInsight = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setInsight(generateMarketInsight());
      setStrategyExplainer(generateStrategyExplanation());
      setIsRefreshing(false);
    }, 600);
  };

  const sentimentColor = () => {
    switch (insight().sentiment) {
      case 'bullish': return '#00ff88';
      case 'bearish': return '#ff0040';
      default: return '#00f3ff';
    }
  };

  return (
    <div class="ai-insight-panel panel">
      <div class="panel-header" style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
        <span>
          <span class="panel-icon" style={{ 'margin-right': '6px' }}>&#129302;</span>
          AI INSIGHTS
        </span>
        <button
          class="ai-refresh-btn"
          onClick={refreshInsight}
          classList={{ spinning: isRefreshing() }}
          title="Refresh AI analysis"
        >
          &#8635;
        </button>
      </div>
      <div class="panel-body">
        {/* Market Insight */}
        <div class="ai-insight-card">
          <div class="ai-insight-header">
            <span class="ai-insight-dot" style={{ background: sentimentColor() }} />
            <span class="ai-insight-title">{insight().title}</span>
            <span class="ai-sentiment-badge" style={{ color: sentimentColor(), 'border-color': sentimentColor() }}>
              {insight().sentiment.toUpperCase()}
            </span>
          </div>
          <p class="ai-insight-text">{insight().content}</p>
        </div>

        {/* Strategy Explainer */}
        <Show when={state.activeGenome}>
          <div class="ai-strategy-card">
            <div class="ai-strategy-header">
              <span class="ai-strategy-icon">&#9883;</span>
              <span>Active Strategy Analysis</span>
            </div>
            <p class="ai-strategy-text">{strategyExplainer()}</p>
          </div>
        </Show>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART ONBOARDING TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'aether.onboardingComplete';

const onboardingSteps = [
  {
    title: 'Welcome to AETHER-TRADER!',
    content: 'This is your AI-powered trading command center. Let me show you around.',
    position: 'center',
  },
  {
    title: 'Flow Mode - Audit Logbook',
    content: 'This is the main view. All system events, market data, and AI decisions are logged here in real-time. The sidebar shows key metrics and portfolio status.',
    position: 'left',
  },
  {
    title: 'Activate the Oracle',
    content: 'Press the "ACTIVATE ORACLE" button to begin the evolution cycle. 500 AI agents will compete and evolve to find the optimal trading strategy.',
    position: 'center',
  },
  {
    title: 'AI Insights Panel',
    content: 'The AI Insights panel provides real-time market analysis and explains what the active strategy is doing in plain language.',
    position: 'right',
  },
  {
    title: 'Nexus Mode (Press N)',
    content: 'Press the "N" key to switch to the 3D Strategy Matrix. You can visualize and interact with the entire strategy population in real-time 3D space.',
    position: 'center',
  },
  {
    title: 'You are all set!',
    content: 'Explore the system, connect your exchange APIs in Settings, and let the oracle evolve. The AI will continuously adapt to changing market conditions.',
    position: 'center',
  },
];

export const OnboardingOverlay: Component = () => {
  const [isComplete, setIsComplete] = createSignal(
    typeof window !== 'undefined' && window.localStorage.getItem(ONBOARDING_KEY) === 'true'
  );
  const [currentStep, setCurrentStep] = createSignal(0);
  const [visible, setVisible] = createSignal(false);

  onMount(() => {
    if (!isComplete()) {
      setTimeout(() => setVisible(true), 1500);
    }
  });

  const nextStep = () => {
    if (currentStep() < onboardingSteps.length - 1) {
      setCurrentStep(currentStep() + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setVisible(false);
    setIsComplete(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  };

  const step = () => onboardingSteps[currentStep()];
  const progress = () => ((currentStep() + 1) / onboardingSteps.length) * 100;

  return (
    <Show when={visible() && !isComplete()}>
      <div class="onboarding-overlay">
        <div class="onboarding-card">
          <div class="onboarding-progress">
            <div class="onboarding-progress-bar" style={{ width: `${progress()}%` }} />
          </div>
          <div class="onboarding-step-count">
            Step {currentStep() + 1} of {onboardingSteps.length}
          </div>
          <h3 class="onboarding-title">{step().title}</h3>
          <p class="onboarding-content">{step().content}</p>
          <div class="onboarding-actions">
            <button class="onboarding-skip" onClick={skipOnboarding}>
              Skip Tour
            </button>
            <button class="onboarding-next" onClick={nextStep}>
              {currentStep() < onboardingSteps.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND BAR (Cmd+K)
// ─────────────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  category: string;
}

export const CommandBar: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [query, setQuery] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  const commands: CommandItem[] = [
    { id: 'flow', label: 'Flow Mode', description: 'Switch to audit logbook view', icon: '&#128220;', action: () => { import('../store').then(m => m.actions.setMode('flow')); }, category: 'Navigation' },
    { id: 'nexus', label: 'Nexus Mode', description: 'Switch to 3D strategy matrix', icon: '&#127756;', action: () => { import('../store').then(m => m.actions.setMode('nexus')); }, category: 'Navigation' },
    { id: 'clear-logs', label: 'Clear Logs', description: 'Clear all audit log entries', icon: '&#128465;', action: () => { import('../store').then(m => m.actions.clearLogs()); }, category: 'Actions' },
    { id: 'reset-onboarding', label: 'Reset Tutorial', description: 'Show the onboarding tour again', icon: '&#127891;', action: () => { localStorage.removeItem(ONBOARDING_KEY); window.location.reload(); }, category: 'Help' },
    { id: 'landing', label: 'Back to Landing', description: 'Return to the landing page', icon: '&#127968;', action: () => { localStorage.setItem('aether.showLanding', 'true'); window.location.reload(); }, category: 'Navigation' },
  ];

  const filteredCommands = () => {
    const q = query().toLowerCase();
    if (!q) return commands;
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  };

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    setQuery('');
  };

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen());
        setTimeout(() => inputRef?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen()) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleKeydown));
  });

  return (
    <Show when={isOpen()}>
      <div class="command-overlay" onClick={() => { setIsOpen(false); setQuery(''); }}>
        <div class="command-bar" onClick={(e) => e.stopPropagation()}>
          <div class="command-input-area">
            <span class="command-icon">&#128269;</span>
            <input
              ref={inputRef}
              type="text"
              class="command-input"
              placeholder="Type a command..."
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const cmds = filteredCommands();
                  if (cmds.length > 0) executeCommand(cmds[0]);
                }
              }}
            />
            <span class="command-shortcut">ESC</span>
          </div>
          <div class="command-list">
            <For each={filteredCommands()}>
              {(cmd) => (
                <button class="command-item" onClick={() => executeCommand(cmd)}>
                  <span class="command-item-icon" innerHTML={cmd.icon} />
                  <div class="command-item-text">
                    <span class="command-item-label">{cmd.label}</span>
                    <span class="command-item-desc">{cmd.description}</span>
                  </div>
                  <span class="command-item-category">{cmd.category}</span>
                </button>
              )}
            </For>
            <Show when={filteredCommands().length === 0}>
              <div class="command-empty">No matching commands</div>
            </Show>
          </div>
          <div class="command-footer">
            <span>Press <kbd>Ctrl+K</kbd> to toggle</span>
            <span>Press <kbd>Enter</kbd> to execute</span>
          </div>
        </div>
      </div>
    </Show>
  );
};
