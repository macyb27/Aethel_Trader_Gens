/**
 * AETHER-TRADER - LANDING PAGE
 * A stunning, self-explaining landing page with AI-powered features
 * Designed for aether.codewithmr.de
 */

import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT ASSISTANT
// ─────────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const AI_RESPONSES: Record<string, string> = {
  'what': 'AETHER-TRADER is a self-aware AI trading oracle that uses genetic algorithms, quantum-inspired analytics, and real-time sentiment analysis to discover optimal trading strategies. It evolves 500+ agents simultaneously to find the best market approach.',
  'how': 'The system works in three stages: First, it spawns 500 trading agents with unique DNA (strategy parameters). Then, these agents compete through simulated backtests. Finally, the genetic algorithm evolves the population -- keeping the best performers and mutating the rest. You can influence the evolution by selecting points in the 3D Strategy Matrix.',
  'risk': 'AETHER-TRADER includes a multi-layered risk management system: The Oracle Shield monitors for market crises and automatically reduces exposure. Each strategy DNA encodes risk parameters. The system also tracks max drawdown, Sharpe ratio, and position sizing limits. Demo mode lets you test without real capital.',
  'start': 'To get started: 1) Create a free account, 2) Explore the demo mode to see the AI in action, 3) Optionally connect your exchange API keys (Bybit/Binance) for live trading, 4) Press "Activate Oracle" to begin the evolution cycle. The AI will do the rest!',
  'safe': 'Your security is our priority. All API keys are encrypted with AES-256 before storage. We never have access to withdraw funds -- only trading permissions. The system runs with testnet by default, and you can use demo mode without any API keys at all.',
  'price': 'AETHER-TRADER is currently free during the beta phase! You can use all features including the AI evolution engine, 3D strategy matrix, and sentiment analysis. Premium features with higher limits and priority support are planned for the future.',
  'exchange': 'We currently support Bybit and Binance for live trading, with more exchanges planned. For sentiment analysis, we integrate with OpenAI, DeepSeek, and NewsAPI. You can add API keys for any of these services in the Settings panel.',
  'quantum': 'The Quantum Edge Detector is our proprietary orderflow analysis system. It uses quantum-inspired state evolution to detect hidden correlations in buy/sell pressure. The "entanglement score" measures how predictable market movements are based on orderflow patterns. Higher scores = better trading opportunities.',
  'dna': 'Strategy DNA encodes all parameters of a trading strategy: risk level, time horizon, trend bias, volatility affinity, and quantum entanglement weight. The genetic algorithm mutates and crosses these parameters across generations to find optimal combinations. Think of it as natural selection for trading strategies.',
  'default': 'I am the AETHER AI Assistant. I can help you understand how our trading oracle works. Try asking about: features, how it works, risk management, getting started, security, pricing, supported exchanges, quantum analysis, or strategy DNA. What would you like to know?'
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('what') || lower.includes('about') || lower.includes('feature')) return AI_RESPONSES['what'];
  if (lower.includes('how') || lower.includes('work') || lower.includes('explain')) return AI_RESPONSES['how'];
  if (lower.includes('risk') || lower.includes('loss') || lower.includes('protect')) return AI_RESPONSES['risk'];
  if (lower.includes('start') || lower.includes('begin') || lower.includes('setup') || lower.includes('get')) return AI_RESPONSES['start'];
  if (lower.includes('safe') || lower.includes('secur') || lower.includes('key') || lower.includes('encrypt')) return AI_RESPONSES['safe'];
  if (lower.includes('price') || lower.includes('cost') || lower.includes('free') || lower.includes('pay')) return AI_RESPONSES['price'];
  if (lower.includes('exchange') || lower.includes('bybit') || lower.includes('binance')) return AI_RESPONSES['exchange'];
  if (lower.includes('quantum') || lower.includes('entangle')) return AI_RESPONSES['quantum'];
  if (lower.includes('dna') || lower.includes('genome') || lower.includes('strateg') || lower.includes('evolv')) return AI_RESPONSES['dna'];
  return AI_RESPONSES['default'];
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED STATS
// ─────────────────────────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration: number = 2000) {
  const [value, setValue] = createSignal(0);

  onMount(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  });

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

const ParticleCanvas: Component = () => {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const count = 80;

    const resize = () => {
      canvasRef!.width = window.innerWidth;
      canvasRef!.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvasRef.width,
        y: Math.random() * canvasRef.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 1 + Math.random() * 2,
        o: 0.2 + Math.random() * 0.4,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvasRef!.width, canvasRef!.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvasRef!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvasRef!.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${p.o})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    onCleanup(() => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    });
  });

  return <canvas ref={canvasRef} class="landing-particles" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE CARDS
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🧬',
    title: 'Genetic Evolution',
    desc: '500+ trading agents evolve through natural selection. Only the strongest strategies survive.',
    color: '#00f3ff',
  },
  {
    icon: '🌌',
    title: '3D Strategy Matrix',
    desc: 'Visualize the entire strategy space in real-time 3D. Click to steer evolution.',
    color: '#bc13fe',
  },
  {
    icon: '🛡️',
    title: 'Oracle Shield',
    desc: 'AI-powered risk management detects market crises and auto-reduces exposure.',
    color: '#ff0040',
  },
  {
    icon: '📰',
    title: 'Sentiment AI',
    desc: 'Real-time news analysis with LLM-powered sentiment scoring drives strategy adaptation.',
    color: '#00ff88',
  },
  {
    icon: '⚛️',
    title: 'Quantum Edge',
    desc: 'Quantum-inspired orderflow analysis detects hidden market correlations.',
    color: '#00f3ff',
  },
  {
    icon: '🔄',
    title: 'Multi-Exchange',
    desc: 'Connect Bybit, Binance, and more. Paper trading included for risk-free testing.',
    color: '#ffaa00',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: Component<LandingPageProps> = (props) => {
  const [chatOpen, setChatOpen] = createSignal(false);
  const [chatInput, setChatInput] = createSignal('');
  const [chatMessages, setChatMessages] = createSignal<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to AETHER-TRADER! I am your AI assistant. Ask me anything about our quantum trading oracle -- how it works, features, security, or how to get started.',
      timestamp: Date.now(),
    },
  ]);
  const [typingEffect, setTypingEffect] = createSignal(false);
  const [scrollY, setScrollY] = createSignal(0);

  const agentCount = useAnimatedNumber(500);
  const strategyCount = useAnimatedNumber(2847);
  const uptimePercent = useAnimatedNumber(99);

  let chatContainerRef: HTMLDivElement | undefined;

  onMount(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    onCleanup(() => window.removeEventListener('scroll', handleScroll));
  });

  const sendMessage = () => {
    const text = chatInput().trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setTypingEffect(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setTypingEffect(false);

      // Auto scroll chat
      setTimeout(() => {
        if (chatContainerRef) {
          chatContainerRef.scrollTop = chatContainerRef.scrollHeight;
        }
      }, 50);
    }, 800 + Math.random() * 700);

    // Auto scroll chat
    setTimeout(() => {
      if (chatContainerRef) {
        chatContainerRef.scrollTop = chatContainerRef.scrollHeight;
      }
    }, 50);
  };

  const handleChatKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div class="landing-root">
      <ParticleCanvas />

      {/* ── NAVBAR ── */}
      <nav class="landing-nav" classList={{ scrolled: scrollY() > 50 }}>
        <div class="landing-nav-inner">
          <div class="landing-logo">
            <span class="logo-symbol">&#926;</span>
            <span class="logo-text">AETHER</span>
            <span class="logo-version">v4.0</span>
          </div>
          <div class="landing-nav-links">
            <a href="#features" class="nav-link">Features</a>
            <a href="#how-it-works" class="nav-link">How It Works</a>
            <a href="#stats" class="nav-link">Stats</a>
            <button class="nav-cta" onClick={props.onEnterApp}>
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section class="landing-hero">
        <div class="hero-glow" />
        <div class="hero-content">
          <div class="hero-badge">BETA &middot; QUANTUM TRADING ORACLE</div>
          <h1 class="hero-title">
            <span class="hero-line1">Self-Evolving</span>
            <span class="hero-line2">Trading Intelligence</span>
          </h1>
          <p class="hero-subtitle">
            500 AI agents compete, evolve, and adapt in real-time.
            Quantum-inspired analytics. Genetic strategy optimization.
            The market oracle that learns.
          </p>
          <div class="hero-actions">
            <button class="hero-btn-primary" onClick={props.onEnterApp}>
              <span class="btn-icon">&#9889;</span>
              Enter the Oracle
            </button>
            <button class="hero-btn-secondary" onClick={() => setChatOpen(true)}>
              <span class="btn-icon">&#129302;</span>
              Ask the AI
            </button>
          </div>
          <div class="hero-trust">
            <div class="trust-item">
              <span class="trust-icon">&#128274;</span>
              <span>AES-256 Encrypted</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">&#128640;</span>
              <span>Free Beta Access</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">&#9989;</span>
              <span>No Card Required</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="orbit-container">
            <div class="orbit orbit-1"><div class="orbit-node n1" /></div>
            <div class="orbit orbit-2"><div class="orbit-node n2" /></div>
            <div class="orbit orbit-3"><div class="orbit-node n3" /></div>
            <div class="orbit-core">
              <span class="core-symbol">&#926;</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" class="landing-features">
        <div class="section-header">
          <h2 class="section-title">Intelligent Features</h2>
          <p class="section-subtitle">
            Every component is designed to give you an unfair advantage
          </p>
        </div>
        <div class="features-grid">
          <For each={features}>
            {(feat) => (
              <div class="feature-card" style={{ '--accent': feat.color }}>
                <div class="feature-icon">{feat.icon}</div>
                <h3 class="feature-title">{feat.title}</h3>
                <p class="feature-desc">{feat.desc}</p>
                <div class="feature-glow" />
              </div>
            )}
          </For>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" class="landing-how">
        <div class="section-header">
          <h2 class="section-title">How It Works</h2>
          <p class="section-subtitle">Three steps to autonomous trading intelligence</p>
        </div>
        <div class="how-steps">
          <div class="how-step">
            <div class="step-number">01</div>
            <div class="step-content">
              <h3>Spawn Agents</h3>
              <p>
                500 unique trading agents are initialized, each with randomized DNA encoding
                risk preferences, time horizons, and market biases. This forms the initial
                population for evolution.
              </p>
            </div>
            <div class="step-visual">
              <div class="dna-helix">
                <div class="helix-strand s1" />
                <div class="helix-strand s2" />
              </div>
            </div>
          </div>

          <div class="how-step">
            <div class="step-number">02</div>
            <div class="step-content">
              <h3>Evolve &amp; Compete</h3>
              <p>
                The genetic algorithm runs simulated backtests, selecting top performers for
                crossover and mutation. Sentiment AI and quantum edge analysis feed real-time
                market data into the evolution cycle.
              </p>
            </div>
            <div class="step-visual">
              <div class="evolution-ring">
                <div class="evo-dot d1" />
                <div class="evo-dot d2" />
                <div class="evo-dot d3" />
                <div class="evo-dot d4" />
              </div>
            </div>
          </div>

          <div class="how-step">
            <div class="step-number">03</div>
            <div class="step-content">
              <h3>Trade &amp; Adapt</h3>
              <p>
                The winning strategy is deployed -- monitored by the Oracle Shield for
                risk management. The system continuously adapts to changing market conditions,
                re-evolving strategies as needed.
              </p>
            </div>
            <div class="step-visual">
              <div class="shield-pulse">
                <div class="shield-ring r1" />
                <div class="shield-ring r2" />
                <div class="shield-core" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS ── */}
      <section id="stats" class="landing-stats">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{agentCount()}</div>
            <div class="stat-label">AI Agents</div>
            <div class="stat-sub">Trading simultaneously</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{strategyCount()}</div>
            <div class="stat-label">Strategies Evolved</div>
            <div class="stat-sub">Across all generations</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{uptimePercent()}%</div>
            <div class="stat-label">Uptime</div>
            <div class="stat-sub">Always watching the market</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">&lt;50ms</div>
            <div class="stat-label">Latency</div>
            <div class="stat-sub">Real-time data processing</div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section class="landing-cta">
        <div class="cta-glow" />
        <h2 class="cta-title">Ready to Evolve Your Trading?</h2>
        <p class="cta-subtitle">
          Join the beta and let AI discover your optimal strategy.
        </p>
        <button class="hero-btn-primary cta-btn" onClick={props.onEnterApp}>
          <span class="btn-icon">&#9889;</span>
          Launch AETHER-TRADER
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <span class="logo-symbol">&#926;</span>
            <span>AETHER-TRADER v4.0</span>
          </div>
          <div class="footer-links">
            <span>aether.codewithmr.de</span>
            <span>&middot;</span>
            <span>Built with Solid.js + Three.js</span>
          </div>
          <div class="footer-copy">
            &copy; {new Date().getFullYear()} AETHER-TRADER. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── AI CHAT WIDGET ── */}
      <Show when={!chatOpen()}>
        <button class="chat-fab" onClick={() => setChatOpen(true)} title="Ask the AI">
          <span class="chat-fab-icon">&#129302;</span>
          <span class="chat-fab-pulse" />
        </button>
      </Show>

      <Show when={chatOpen()}>
        <div class="chat-widget">
          <div class="chat-header">
            <div class="chat-header-info">
              <span class="chat-avatar">&#926;</span>
              <div>
                <div class="chat-title">AETHER AI Assistant</div>
                <div class="chat-status">Online &middot; Ready to help</div>
              </div>
            </div>
            <button class="chat-close" onClick={() => setChatOpen(false)}>
              &times;
            </button>
          </div>

          <div ref={chatContainerRef} class="chat-messages">
            <For each={chatMessages()}>
              {(msg) => (
                <div class={`chat-msg ${msg.role}`}>
                  <div class="msg-bubble">{msg.content}</div>
                </div>
              )}
            </For>
            <Show when={typingEffect()}>
              <div class="chat-msg assistant">
                <div class="msg-bubble typing">
                  <span class="typing-dot" />
                  <span class="typing-dot" />
                  <span class="typing-dot" />
                </div>
              </div>
            </Show>
          </div>

          <div class="chat-suggestions">
            <button onClick={() => { setChatInput('How does it work?'); sendMessage(); }}>
              How does it work?
            </button>
            <button onClick={() => { setChatInput('Is it safe?'); sendMessage(); }}>
              Is it safe?
            </button>
            <button onClick={() => { setChatInput('How do I start?'); sendMessage(); }}>
              Get started
            </button>
          </div>

          <div class="chat-input-area">
            <input
              type="text"
              class="chat-input"
              placeholder="Ask me anything..."
              value={chatInput()}
              onInput={(e) => setChatInput(e.currentTarget.value)}
              onKeyDown={handleChatKeydown}
            />
            <button class="chat-send" onClick={sendMessage}>
              &#10148;
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default LandingPage;
