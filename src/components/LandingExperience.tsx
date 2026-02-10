import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { state, actions } from '../store';
import { authState } from '../store/auth';
import { analyzeSentiment, fetchNews, type SentimentResult } from '../services/api';

interface LandingExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onRequestActivate: () => void;
}

type PulseSummary = {
  provider: string;
  headlineCount: number;
  avgScore: number;
  topImpact: SentimentResult['impact'];
  keywords: string[];
  reasoning: string;
  fallback: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function impactRank(i: SentimentResult['impact']): number {
  switch (i) {
    case 'CRITICAL': return 4;
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
  }
}

function scoreLabel(score: number): { label: string; tone: 'good' | 'neutral' | 'bad' } {
  if (score >= 0.25) return { label: 'Bullish', tone: 'good' };
  if (score <= -0.25) return { label: 'Bearish', tone: 'bad' };
  return { label: 'Neutral', tone: 'neutral' };
}

const LandingExperience: Component<LandingExperienceProps> = (props) => {
  const [pulseLoading, setPulseLoading] = createSignal(false);
  const [pulse, setPulse] = createSignal<PulseSummary | null>(null);
  const [pulseError, setPulseError] = createSignal<string>('');

  const hasApiKeys = createMemo(() => authState.apiKeys.length > 0);
  const isLiveMode = createMemo(() => hasApiKeys() && authState.isAuthenticated);

  const nextStep = createMemo(() => {
    if (!authState.isAuthenticated) return { title: 'Sign in', detail: 'Connect your account to enable realtime + secure key storage.' };
    if (!hasApiKeys()) return { title: 'Add API keys', detail: 'Enable LIVE mode: exchange feed + AI sentiment via your keys.' };
    if (state.status !== 'active') return { title: 'Activate Oracle', detail: 'Run the awakening sequence and start the engine.' };
    return { title: 'Explore', detail: 'Switch views, inspect genomes, and tune phenotype sliders.' };
  });

  const runPulse = async () => {
    if (pulseLoading()) return;
    setPulseError('');
    setPulseLoading(true);
    try {
      const { articles, fallback } = await fetchNews();
      const headlines = articles.map(a => a.title).filter(Boolean).slice(0, 10);
      if (headlines.length === 0) {
        setPulse({
          provider: 'FALLBACK',
          headlineCount: 0,
          avgScore: 0,
          topImpact: 'LOW',
          keywords: [],
          reasoning: fallback ? 'News API unavailable' : 'No headlines found',
          fallback: true,
        });
        return;
      }

      const preferredProvider = authState.apiKeys.some(k => k.provider === 'DEEPSEEK' && k.isActive)
        ? 'DEEPSEEK'
        : (authState.apiKeys.some(k => k.provider === 'OPENAI' && k.isActive) ? 'OPENAI' : undefined);

      const result = await analyzeSentiment(headlines, preferredProvider);
      const scores = result.results.map(r => r.score);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const topImpact = result.results
        .map(r => r.impact)
        .sort((a, b) => impactRank(b) - impactRank(a))[0] ?? 'LOW';

      const keywordCounts = new Map<string, number>();
      for (const r of result.results) {
        for (const k of r.keywords ?? []) {
          const key = String(k).trim();
          if (!key) continue;
          keywordCounts.set(key, (keywordCounts.get(key) ?? 0) + 1);
        }
      }
      const keywords = [...keywordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k]) => k);

      setPulse({
        provider: result.provider,
        headlineCount: headlines.length,
        avgScore: clamp(avgScore, -1, 1),
        topImpact,
        keywords,
        reasoning: `Analyzed ${headlines.length} headlines via ${result.provider}`,
        fallback: result.provider === 'FALLBACK' || fallback,
      });
    } catch (e) {
      setPulseError(e instanceof Error ? e.message : 'Pulse failed');
    } finally {
      setPulseLoading(false);
    }
  };

  const openSettings = () => {
    props.onOpenSettings();
    actions.addLog('info', 'GUIDE', 'Opened Settings from Landing');
  };

  const switchToFlow = () => actions.setMode('flow');
  const switchToNexus = () => actions.setMode('nexus');

  return (
    <Show when={props.isOpen}>
      <div class="landing-overlay" onClick={() => props.onClose()}>
        <div class="landing" onClick={(e) => e.stopPropagation()}>
          <div class="landing-header">
            <div class="landing-brand">
              <div class="landing-title font-display">
                ÆTHER-TRADER <span class="text-purple">Ω</span>
              </div>
              <div class="landing-subtitle">A self-aware market oracle with a guided cockpit.</div>
            </div>

            <div class="landing-header-actions">
              <span class="landing-badge" classList={{ live: isLiveMode(), demo: !isLiveMode() }}>
                {isLiveMode() ? 'LIVE' : 'DEMO'}
              </span>
              <button class="btn btn-small" onClick={() => props.onClose()}>Close</button>
            </div>
          </div>

          <div class="landing-grid">
            <div class="landing-card hero">
              <div class="hero-kicker">Start here</div>
              <div class="hero-steps">
                <div class="hero-step">
                  <div class="hero-step-title">1) Choose a view</div>
                  <div class="hero-step-body">Flow = logbook. Nexus = 3D strategy space.</div>
                  <div class="hero-step-actions">
                    <button class="btn btn-primary" onClick={switchToFlow}>Open Flow</button>
                    <button class="btn" onClick={switchToNexus}>Open Nexus</button>
                  </div>
                </div>
                <div class="hero-step">
                  <div class="hero-step-title">2) Connect services (optional)</div>
                  <div class="hero-step-body">Add exchange + AI keys for LIVE feeds and sentiment.</div>
                  <div class="hero-step-actions">
                    <button class="btn" onClick={openSettings}>Open Settings</button>
                    <button class="btn" onClick={() => props.onOpenAuth()}>
                      {authState.isAuthenticated ? 'Signed In' : 'Sign In'}
                    </button>
                  </div>
                </div>
                <div class="hero-step">
                  <div class="hero-step-title">3) Activate the Oracle</div>
                  <div class="hero-step-body">Runs the awakening sequence and enables controls.</div>
                  <div class="hero-step-actions">
                    <button
                      class="btn-awakening"
                      onClick={() => {
                        props.onRequestActivate();
                        props.onClose();
                      }}
                      disabled={state.status !== 'ready'}
                      title={state.status !== 'ready' ? 'Wait until initialization completes' : 'Start activation'}
                    >
                      ACTIVATE ORACLE
                    </button>
                  </div>
                </div>
              </div>

              <div class="hero-footnote">
                Hotkeys: <span class="kbd">F</span> Flow, <span class="kbd">N</span> Nexus, <span class="kbd">ESC</span> Toggle
              </div>
            </div>

            <div class="landing-card">
              <div class="card-title">AI Pulse</div>
              <div class="card-subtitle">One-click market sentiment summary (uses your configured AI keys; falls back safely).</div>

              <div class="pulse-actions">
                <button class="btn btn-primary" onClick={runPulse} disabled={pulseLoading()}>
                  {pulseLoading() ? 'Generating…' : 'Generate Pulse'}
                </button>
                <Show when={pulse()}>
                  <button class="btn" onClick={() => setPulse(null)}>Reset</button>
                </Show>
              </div>

              <Show when={pulseError()}>
                <div class="card-error">{pulseError()}</div>
              </Show>

              <Show when={pulse()}>
                {(p) => {
                  const s = scoreLabel(p().avgScore);
                  return (
                    <div class="pulse-result">
                      <div class="pulse-row">
                        <span class="pulse-label">Sentiment</span>
                        <span class="pulse-value" classList={{ good: s.tone === 'good', bad: s.tone === 'bad', neutral: s.tone === 'neutral' }}>
                          {s.label} ({p().avgScore.toFixed(2)})
                        </span>
                      </div>
                      <div class="pulse-row">
                        <span class="pulse-label">Impact</span>
                        <span class="pulse-value">{p().topImpact}</span>
                      </div>
                      <div class="pulse-row">
                        <span class="pulse-label">Headlines</span>
                        <span class="pulse-value">{p().headlineCount}</span>
                      </div>
                      <div class="pulse-row">
                        <span class="pulse-label">Provider</span>
                        <span class="pulse-value">{p().provider}{p().fallback ? ' (fallback)' : ''}</span>
                      </div>

                      <Show when={p().keywords.length > 0}>
                        <div class="pulse-keywords">
                          <div class="pulse-label">Keywords</div>
                          <div class="pulse-chips">
                            <For each={p().keywords}>{(k) => <span class="chip">{k}</span>}</For>
                          </div>
                        </div>
                      </Show>

                      <div class="pulse-reasoning text-muted">{p().reasoning}</div>
                    </div>
                  );
                }}
              </Show>
            </div>

            <div class="landing-card">
              <div class="card-title">Recommended next step</div>
              <div class="next-step">
                <div class="next-step-title">{nextStep().title}</div>
                <div class="next-step-body text-muted">{nextStep().detail}</div>
                <div class="next-step-actions">
                  <button class="btn btn-primary" onClick={() => {
                    if (!authState.isAuthenticated) return props.onOpenAuth();
                    if (!hasApiKeys()) return openSettings();
                    props.onRequestActivate();
                    props.onClose();
                  }}>
                    Do it now
                  </button>
                  <button class="btn" onClick={() => props.onClose()}>Explore</button>
                </div>
              </div>
            </div>

            <div class="landing-card">
              <div class="card-title">What’s where?</div>
              <ul class="quick-faq">
                <li><strong>Flow</strong>: audit log, realtime metrics, event trail.</li>
                <li><strong>Nexus</strong>: 3D GSM — click nodes to select, hover for quick stats.</li>
                <li><strong>Settings</strong>: API keys, defaults, risk tolerance.</li>
                <li><strong>Activate</strong>: starts the awakening and enables the DNA panel.</li>
              </ul>
            </div>
          </div>

          <div class="landing-footer">
            <div class="landing-footer-left text-muted">
              Tip: You can always reopen this guide from the top bar.
            </div>
            <div class="landing-footer-right">
              <button class="btn" onClick={() => props.onClose()}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default LandingExperience;

