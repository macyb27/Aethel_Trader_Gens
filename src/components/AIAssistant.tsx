/**
 * ÆTHER-TRADER Ω v4.0 - AI TRADING ASSISTANT
 * Intelligent assistant that provides market insights, strategy recommendations,
 * and contextual help to create a wonderful user experience.
 */

import { Component, createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { state } from '../store';
import { authState } from '../store/auth';
import { newsOracle } from '../logic/newsOracle';
import { quantumEdge } from '../logic/quantumEdge';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AIMessage {
  id: string;
  type: 'insight' | 'recommendation' | 'warning' | 'help' | 'user';
  content: string;
  timestamp: number;
  icon: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INTELLIGENCE ENGINE (local, no API needed)
// ─────────────────────────────────────────────────────────────────────────────

function generateMarketInsight(): AIMessage {
  const sentiment = newsOracle.getAggregatedSentiment();
  const momentum = newsOracle.getSentimentMomentum();
  const entanglement = quantumEdge.getEntanglementScore();

  const insights = [
    {
      condition: sentiment > 0.3,
      content: `Bullish sentiment detected (${(sentiment * 100).toFixed(0)}%). The market mood is positive — consider trend-following strategies with moderate risk exposure.`,
      icon: '📈',
    },
    {
      condition: sentiment < -0.3,
      content: `Bearish sentiment detected (${(sentiment * 100).toFixed(0)}%). Market is cautious — consider defensive positions or hedging strategies.`,
      icon: '📉',
    },
    {
      condition: Math.abs(momentum) > 0.2,
      content: `Sentiment momentum ${momentum > 0 ? 'rising' : 'falling'} rapidly (${(momentum * 100).toFixed(1)}%). This often precedes significant price movements.`,
      icon: '⚡',
    },
    {
      condition: entanglement > 0.7,
      content: `High quantum entanglement (${(entanglement * 100).toFixed(0)}%) — market correlations are strong. Cross-asset strategies may be particularly effective now.`,
      icon: '◈',
    },
    {
      condition: entanglement < 0.3,
      content: `Low entanglement detected (${(entanglement * 100).toFixed(0)}%). Markets are decoupled — focus on individual asset analysis rather than correlation plays.`,
      icon: '🔮',
    },
  ];

  const applicable = insights.filter(i => i.condition);
  if (applicable.length > 0) {
    const insight = applicable[Math.floor(Math.random() * applicable.length)];
    return {
      id: `ai-${Date.now()}`,
      type: 'insight',
      content: insight.content,
      timestamp: Date.now(),
      icon: insight.icon,
    };
  }

  const general = [
    'Markets are currently in a neutral state. The Oracle is monitoring for emerging patterns and will alert you when opportunities arise.',
    'All systems operating normally. The evolution engine is optimizing strategy genomes in the background to find the best-performing configurations.',
    'Quantum detectors are calibrated and monitoring cross-asset correlations. No significant anomalies detected at this time.',
    'The sentiment analysis engine is processing news feeds. Current market conditions favor a balanced approach to risk management.',
  ];

  return {
    id: `ai-${Date.now()}`,
    type: 'insight',
    content: general[Math.floor(Math.random() * general.length)],
    timestamp: Date.now(),
    icon: '🧠',
  };
}

function generateStrategyRecommendation(): AIMessage {
  const genome = state.activeGenome;
  const phenotype = state.currentPhenotype;

  if (!genome) {
    return {
      id: `ai-${Date.now()}`,
      type: 'recommendation',
      content: 'Activate the Oracle to begin strategy optimization. The evolution engine will find optimal genome configurations based on your risk preferences.',
      timestamp: Date.now(),
      icon: '🧬',
    };
  }

  const recommendations = [
    {
      condition: genome.sharpeRatio > 2,
      content: `Excellent genome performance (Sharpe: ${genome.sharpeRatio.toFixed(2)}). This strategy is well-calibrated. Consider locking the current phenotype settings to maintain stability.`,
    },
    {
      condition: genome.sharpeRatio < 0.5 && genome.sharpeRatio > 0,
      content: `Moderate performance (Sharpe: ${genome.sharpeRatio.toFixed(2)}). Try adjusting risk level to ${phenotype.riskLevel > 0.5 ? 'lower' : 'higher'} values, or shift the time horizon for better results.`,
    },
    {
      condition: genome.maxDrawdown > 0.15,
      content: `Warning: High drawdown detected (${(genome.maxDrawdown * 100).toFixed(1)}%). Consider reducing risk exposure or enabling the Oracle Shield for automatic risk management.`,
    },
    {
      condition: genome.winRate > 0.6,
      content: `Strong win rate of ${(genome.winRate * 100).toFixed(0)}%. The current strategy is performing well on trade selection. Focus on optimizing position sizing for maximum returns.`,
    },
    {
      condition: phenotype.riskLevel > 0.8,
      content: `Risk level is high (${(phenotype.riskLevel * 100).toFixed(0)}%). While this can yield higher returns, ensure you have proper stop-loss mechanisms in place. The Oracle Shield can help.`,
    },
  ];

  const applicable = recommendations.filter(r => r.condition);
  const rec = applicable.length > 0
    ? applicable[Math.floor(Math.random() * applicable.length)]
    : { content: `Current genome (Gen #${genome.generation}) is performing at Sharpe ${genome.sharpeRatio.toFixed(2)}. The evolution engine is continuously searching for improvements.` };

  return {
    id: `ai-${Date.now()}`,
    type: 'recommendation',
    content: rec.content,
    timestamp: Date.now(),
    icon: '💡',
  };
}

function generateContextualHelp(context: string): string {
  const helpTopics: Record<string, string> = {
    'flow-mode': 'Flow Mode is your secure audit logbook. It displays all system events in real-time, including trades, strategy changes, and market alerts. Use the sidebar to monitor Oracle metrics and portfolio status.',
    'nexus-mode': 'Nexus Mode visualizes the Generative Strategy Matrix in 3D. Each node represents a strategy genome — color indicates Sharpe ratio performance (red=poor, cyan=excellent). Click nodes to select strategies.',
    'dna-panel': 'The DNA Control Panel lets you influence the evolution engine by adjusting phenotype biases. Risk Level, Time Horizon, Trend Bias, and Volatility Affinity shape which strategy genomes the engine favors.',
    'awakening': 'The Oracle Activation sequence initializes all trading agents, calibrates quantum detectors, and runs the first evolution cycle. After activation, the system continuously optimizes strategies.',
    'settings': 'Configure API keys for live trading (Bybit/Binance), AI sentiment analysis (OpenAI/DeepSeek), and market data feeds (NewsAPI/Alpha Vantage). All keys are encrypted and stored securely.',
    'portfolio': 'The portfolio panel shows your total value, unrealized P&L, and open positions. In demo mode, values are simulated. Connect exchange API keys for real portfolio tracking.',
    'default': 'ÆTHER-TRADER is a quantum-inspired algorithmic trading platform. It uses genetic algorithms to evolve trading strategies, quantum-inspired metrics for market analysis, and AI for sentiment processing.',
  };

  return helpTopics[context] || helpTopics['default'];
}

// ─────────────────────────────────────────────────────────────────────────────
// AI ASSISTANT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: Component<AIAssistantProps> = (props) => {
  const [messages, setMessages] = createSignal<AIMessage[]>([]);
  const [inputText, setInputText] = createSignal('');
  const [isThinking, setIsThinking] = createSignal(false);
  let messagesEndRef: HTMLDivElement | undefined;
  let insightInterval: ReturnType<typeof setInterval> | null = null;

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addMessage = (msg: AIMessage) => {
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  };

  // Initial greeting
  onMount(() => {
    const isRealMode = authState.isAuthenticated && authState.apiKeys.length > 0;

    addMessage({
      id: 'welcome',
      type: 'help',
      content: `Welcome to ÆTHER-TRADER AI Assistant! I'm here to help you understand the market and make better trading decisions.${isRealMode ? ' You\'re connected with real API keys — live data is active.' : ' Running in demo mode — connect API keys in Settings for live data.'}`,
      timestamp: Date.now(),
      icon: '🤖',
    });

    // Periodic AI insights
    insightInterval = setInterval(() => {
      if (state.status === 'active' && props.isOpen && Math.random() > 0.5) {
        const insight = Math.random() > 0.5 ? generateMarketInsight() : generateStrategyRecommendation();
        addMessage(insight);
      }
    }, 15000);
  });

  onCleanup(() => {
    if (insightInterval) clearInterval(insightInterval);
  });

  const handleUserInput = async () => {
    const text = inputText().trim();
    if (!text) return;

    addMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: Date.now(),
      icon: '👤',
    });

    setInputText('');
    setIsThinking(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const lower = text.toLowerCase();

    let response: AIMessage;

    if (lower.includes('help') || lower.includes('how') || lower.includes('what')) {
      let context = 'default';
      if (lower.includes('flow') || lower.includes('log')) context = 'flow-mode';
      else if (lower.includes('nexus') || lower.includes('3d') || lower.includes('matrix')) context = 'nexus-mode';
      else if (lower.includes('dna') || lower.includes('slider') || lower.includes('phenotype')) context = 'dna-panel';
      else if (lower.includes('oracle') || lower.includes('activate') || lower.includes('awaken')) context = 'awakening';
      else if (lower.includes('setting') || lower.includes('api') || lower.includes('key')) context = 'settings';
      else if (lower.includes('portfolio') || lower.includes('balance') || lower.includes('money')) context = 'portfolio';

      response = {
        id: `ai-${Date.now()}`,
        type: 'help',
        content: generateContextualHelp(context),
        timestamp: Date.now(),
        icon: '📖',
      };
    } else if (lower.includes('market') || lower.includes('price') || lower.includes('bitcoin') || lower.includes('btc')) {
      response = generateMarketInsight();
    } else if (lower.includes('strategy') || lower.includes('genome') || lower.includes('recommend') || lower.includes('suggest')) {
      response = generateStrategyRecommendation();
    } else if (lower.includes('risk') || lower.includes('safe') || lower.includes('danger')) {
      const genome = state.activeGenome;
      const dd = genome ? (genome.maxDrawdown * 100).toFixed(1) : '0';
      response = {
        id: `ai-${Date.now()}`,
        type: 'warning',
        content: `Current risk assessment: Max drawdown at ${dd}%. ${state.crisis.isActive ? 'CAUTION: Oracle Shield is active — market conditions are volatile.' : 'Risk levels are within acceptable parameters.'} Use the DNA Control Panel to adjust your risk tolerance.`,
        timestamp: Date.now(),
        icon: '🛡️',
      };
    } else if (lower.includes('status') || lower.includes('system')) {
      response = {
        id: `ai-${Date.now()}`,
        type: 'insight',
        content: `System Status: ${state.status.toUpperCase()} | Agents: ${state.agentsSpawned}/${state.totalAgents} | Population: ${state.population.length} genomes | Mode: ${state.mode} | ${authState.isAuthenticated ? 'Authenticated' : 'Demo Mode'}`,
        timestamp: Date.now(),
        icon: '📊',
      };
    } else {
      response = {
        id: `ai-${Date.now()}`,
        type: 'help',
        content: `I can help you with: market analysis, strategy recommendations, risk assessment, system status, and explaining features. Try asking about the market, your strategy, or how a specific feature works!`,
        timestamp: Date.now(),
        icon: '🤖',
      };
    }

    setIsThinking(false);
    addMessage(response);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  };

  const quickActions = [
    { label: 'Market Analysis', action: () => { addMessage(generateMarketInsight()); } },
    { label: 'Strategy Tips', action: () => { addMessage(generateStrategyRecommendation()); } },
    { label: 'System Status', action: () => {
      addMessage({
        id: `ai-${Date.now()}`,
        type: 'insight',
        content: `System: ${state.status.toUpperCase()} | ${state.agentsSpawned} agents | ${state.population.length} genomes | ${state.logs.length} log entries | Sentiment: ${(newsOracle.getAggregatedSentiment() * 100).toFixed(0)}%`,
        timestamp: Date.now(),
        icon: '📊',
      });
    }},
    { label: 'What is this?', action: () => {
      addMessage({
        id: `ai-${Date.now()}`,
        type: 'help',
        content: generateContextualHelp(state.mode === 'flow' ? 'flow-mode' : 'nexus-mode'),
        timestamp: Date.now(),
        icon: '📖',
      });
    }},
  ];

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageClass = (type: AIMessage['type']) => {
    switch (type) {
      case 'insight': return 'ai-msg-insight';
      case 'recommendation': return 'ai-msg-recommendation';
      case 'warning': return 'ai-msg-warning';
      case 'help': return 'ai-msg-help';
      case 'user': return 'ai-msg-user';
      default: return '';
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="ai-assistant">
        <div class="ai-header">
          <div class="ai-header-left">
            <span class="ai-header-icon">🤖</span>
            <div class="ai-header-text">
              <span class="ai-header-title">AI ASSISTANT</span>
              <span class="ai-header-status">
                {state.status === 'active' ? 'Monitoring Markets' : 'Ready'}
              </span>
            </div>
          </div>
          <button class="ai-close-btn" onClick={props.onClose} title="Close Assistant">
            &times;
          </button>
        </div>

        <div class="ai-quick-actions">
          <For each={quickActions}>
            {(action) => (
              <button class="ai-quick-btn" onClick={action.action}>
                {action.label}
              </button>
            )}
          </For>
        </div>

        <div class="ai-messages">
          <For each={messages()}>
            {(msg) => (
              <div class={`ai-message ${getMessageClass(msg.type)}`}>
                <div class="ai-msg-header">
                  <span class="ai-msg-icon">{msg.icon}</span>
                  <span class="ai-msg-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div class="ai-msg-content">{msg.content}</div>
              </div>
            )}
          </For>

          <Show when={isThinking()}>
            <div class="ai-message ai-msg-thinking">
              <div class="ai-thinking-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </Show>

          <div ref={messagesEndRef} />
        </div>

        <div class="ai-input-area">
          <input
            type="text"
            class="ai-input"
            placeholder="Ask about markets, strategies, or features..."
            value={inputText()}
            onInput={(e) => setInputText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking()}
          />
          <button
            class="ai-send-btn"
            onClick={handleUserInput}
            disabled={isThinking() || !inputText().trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </Show>
  );
};

export default AIAssistant;
