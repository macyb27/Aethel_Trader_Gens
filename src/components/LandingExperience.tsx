import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { state } from '../store';
import { newsOracle } from '../logic/newsOracle';
import '../styles/landing-experience.css';

type Horizon = 'SCALPING' | 'SWING' | 'POSITION';

interface AIBriefing {
  tone: 'Defensiv' | 'Balanciert' | 'Offensiv';
  confidence: number;
  summary: string;
  playbook: string[];
  safeguards: string[];
  signal: string;
}

interface LandingExperienceProps {
  onEnterWorkspace: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  isAuthenticated: boolean;
  hasApiKeys: boolean;
}

const QUICK_GOALS = [
  'Ich möchte mit kleinem Risiko starten und erst einmal den Markt verstehen.',
  'Ich möchte Swing-Setups mit klaren Regeln und automatischer Risikobegrenzung.',
  'Ich suche ein aggressiveres Setup mit engem Stop und hoher Frequenz.',
];

const HOW_IT_WORKS = [
  {
    title: '1. Verbinden',
    text: 'Melde dich an und hinterlege API-Keys sicher im Settings-Bereich.',
  },
  {
    title: '2. Verstehen',
    text: 'Die GUI erklärt jeden Schritt: Markt-Signal, Risiko und Ausführung.',
  },
  {
    title: '3. Optimieren',
    text: 'Der AI-Copilot erstellt einen Start-Plan und passt sich dem Sentiment an.',
  },
];

const PRODUCT_PILLARS = [
  {
    title: 'Selbsterklärende Oberfläche',
    text: 'Klare Schritt-für-Schritt-Struktur statt überladener Trading-Panels.',
  },
  {
    title: 'AI Start Copilot',
    text: 'Generiert konkrete, verständliche Handlungsempfehlungen in Sekunden.',
  },
  {
    title: 'Live-Readiness',
    text: 'Von Demo zu Live sauber skalieren, sobald APIs und Risiko-Regeln gesetzt sind.',
  },
];

function sentimentToSignal(sentiment: number): string {
  if (sentiment >= 0.35) return 'Bullish Bias';
  if (sentiment <= -0.35) return 'Bearish Bias';
  return 'Neutral / Range';
}

function sentimentToAction(sentiment: number): string {
  if (sentiment >= 0.35) return 'Trendfolge priorisieren';
  if (sentiment <= -0.35) return 'Absicherung und defensives Sizing priorisieren';
  return 'Mean-Reversion und selektive Entries';
}

function buildAIBriefing(
  goal: string,
  riskScore: number,
  horizon: Horizon,
  sentiment: number,
  isAuthenticated: boolean,
  hasApiKeys: boolean,
): AIBriefing {
  const tone: AIBriefing['tone'] =
    riskScore < 35 ? 'Defensiv' : riskScore > 70 ? 'Offensiv' : 'Balanciert';

  const confidenceBase = 52 + (hasApiKeys ? 14 : 0) + (isAuthenticated ? 8 : 0);
  const confidence = Math.min(95, Math.max(50, confidenceBase + Math.round(Math.abs(sentiment) * 10)));
  const horizonLabel =
    horizon === 'SCALPING' ? 'kurzen Zeiteinheiten' : horizon === 'SWING' ? 'mehrtägigen Bewegungen' : 'langfristigen Bewegungen';

  const summary = `Dein Ziel "${goal}" passt zu einem ${tone.toLowerCase()}en Setup mit Fokus auf ${horizonLabel}. Aktuelles News-Sentiment: ${sentimentToSignal(sentiment)}.`;

  const playbook = [
    `Primärer Modus: ${hasApiKeys ? 'LIVE-ready mit abgesicherter Ausführung' : 'DEMO mit simulierten Orders'} auf ${horizon}.`,
    `Risikoprofil: ${riskScore}% (Tonalität: ${tone}).`,
    `AI Bias: ${sentimentToAction(sentiment)}.`,
    'Start mit 1-2 Assets, danach über Performance-Logs iterativ erweitern.',
  ];

  const safeguards = [
    'Maximalen Tagesverlust und Positionsgröße im Settings-Panel definieren.',
    'Nur Strategien aktivieren, die mindestens einen stabilen Sharpe-Floor halten.',
    'Bei hohem Negativ-Sentiment Orderfrequenz reduzieren und Stops enger setzen.',
  ];

  return {
    tone,
    confidence,
    summary,
    playbook,
    safeguards,
    signal: sentimentToSignal(sentiment),
  };
}

const LandingExperience: Component<LandingExperienceProps> = (props) => {
  const [goal, setGoal] = createSignal(QUICK_GOALS[0]);
  const [riskScore, setRiskScore] = createSignal(45);
  const [horizon, setHorizon] = createSignal<Horizon>('SWING');
  const [briefing, setBriefing] = createSignal<AIBriefing | null>(null);

  const marketPulse = createMemo(() => {
    const sentiment = newsOracle.getAggregatedSentiment();
    const momentum = newsOracle.getSentimentMomentum();
    return {
      sentiment,
      momentum,
      signal: sentimentToSignal(sentiment),
    };
  });

  const handleGenerate = () => {
    const text = goal().trim() || QUICK_GOALS[0];
    setBriefing(
      buildAIBriefing(
        text,
        riskScore(),
        horizon(),
        marketPulse().sentiment,
        props.isAuthenticated,
        props.hasApiKeys,
      ),
    );
  };

  return (
    <section class="landing-shell">
      <div class="landing-hero">
        <div class="landing-copy">
          <p class="landing-kicker">Neues Landing Erlebnis</p>
          <h1>Trading Intelligence, die sich selbst erklärt.</h1>
          <p class="landing-subtext">
            Die neue AETHER Landing Page führt dich von Anmeldung über Setup bis zum
            ersten AI-generierten Plan. Kein Rätselraten, klare Aktionen.
          </p>

          <div class="landing-cta-row">
            <button class="btn btn-primary" onClick={props.onEnterWorkspace}>
              Workspace öffnen
            </button>
            <Show
              when={props.isAuthenticated}
              fallback={
                <button class="btn" onClick={props.onOpenAuth}>
                  Anmelden
                </button>
              }
            >
              <button class="btn" onClick={props.onOpenSettings}>
                API & Einstellungen
              </button>
            </Show>
          </div>

          <div class="landing-stats-grid">
            <div class="landing-stat-card">
              <span class="landing-stat-value">{state.population.length || 50}</span>
              <span class="landing-stat-label">Genome im Pool</span>
            </div>
            <div class="landing-stat-card">
              <span class="landing-stat-value">{Math.round((state.loadingProgress || 100))}%</span>
              <span class="landing-stat-label">System Ready</span>
            </div>
            <div class="landing-stat-card">
              <span class="landing-stat-value">{marketPulse().signal}</span>
              <span class="landing-stat-label">Live Market Pulse</span>
            </div>
          </div>
        </div>

        <div class="landing-ai-panel panel">
          <div class="panel-header">AI Start Copilot</div>
          <div class="panel-body">
            <label class="landing-field-label">Was ist dein Ziel?</label>
            <textarea
              class="landing-textarea"
              value={goal()}
              onInput={(e) => setGoal(e.currentTarget.value)}
              rows={4}
            />

            <div class="landing-quick-goals">
              <For each={QUICK_GOALS}>
                {(prompt) => (
                  <button
                    class="landing-chip"
                    onClick={() => setGoal(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                )}
              </For>
            </div>

            <div class="landing-field-grid">
              <div>
                <label class="landing-field-label">Risiko-Level: {riskScore()}%</label>
                <input
                  class="landing-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={riskScore()}
                  onInput={(e) => setRiskScore(parseInt(e.currentTarget.value, 10))}
                />
              </div>

              <div>
                <label class="landing-field-label">Zeithorizont</label>
                <select
                  class="landing-select"
                  value={horizon()}
                  onChange={(e) => setHorizon(e.currentTarget.value as Horizon)}
                >
                  <option value="SCALPING">Scalping</option>
                  <option value="SWING">Swing</option>
                  <option value="POSITION">Position</option>
                </select>
              </div>
            </div>

            <button class="btn btn-primary landing-generate-btn" onClick={handleGenerate}>
              AI Plan generieren
            </button>

            <Show when={briefing()}>
              {(plan) => (
                <div class="landing-briefing">
                  <div class="landing-briefing-top">
                    <strong>Signal: {plan().signal}</strong>
                    <span>Confidence {plan().confidence}%</span>
                  </div>
                  <p>{plan().summary}</p>
                  <ul>
                    <For each={plan().playbook}>{(step) => <li>{step}</li>}</For>
                  </ul>
                  <div class="landing-safeguards">
                    <h4>Safety Guards</h4>
                    <ul>
                      <For each={plan().safeguards}>{(guard) => <li>{guard}</li>}</For>
                    </ul>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>

      <div class="landing-explain-grid">
        <div class="panel">
          <div class="panel-header">So funktioniert die Oberfläche</div>
          <div class="panel-body landing-info-list">
            <For each={HOW_IT_WORKS}>
              {(item) => (
                <article>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              )}
            </For>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">Warum dieses Design?</div>
          <div class="panel-body landing-info-list">
            <For each={PRODUCT_PILLARS}>
              {(item) => (
                <article>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              )}
            </For>
            <div class="landing-momentum">
              <span>Sentiment Momentum:</span>
              <strong>{marketPulse().momentum.toFixed(3)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingExperience;
