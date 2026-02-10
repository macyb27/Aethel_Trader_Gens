import type { ViewMode, OracleStatus, LogEntry, Phenotype, StrategyDNA } from '../store';

export type AssistantSeverity = 'info' | 'warn' | 'critical';

export type AssistantSuggestion = {
  id: string;
  title: string;
  description: string;
  severity: AssistantSeverity;
  ctaLabel?: string;
  ctaEvent?: 'aether:open-settings' | 'aether:open-auth' | 'aether:show-guide' | 'aether:activate-oracle';
};

export type AssistantOutput = {
  headline: string;
  summary: string;
  suggestions: AssistantSuggestion[];
  lastEventExplanation: string | null;
};

export type AssistantInput = {
  status: OracleStatus;
  mode: ViewMode;
  crisisActive: boolean;
  logs: LogEntry[];
  phenotype: Phenotype;
  activeGenome: StrategyDNA | null;
  populationSize: number;
  selectedNodeId: string | null;
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  apiKeys: Array<{ provider: string; isActive: boolean }>;
};

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function formatPct(x: number): string {
  return `${Math.round(clamp01(x) * 100)}%`;
}

function hasActiveProvider(apiKeys: AssistantInput['apiKeys'], providers: string[]): boolean {
  return apiKeys.some((k) => k.isActive && providers.includes(k.provider));
}

function summarizeStatus(input: AssistantInput): string {
  const mode = input.mode === 'flow' ? 'Logbook' : 'GSM 3D';
  const shield = input.crisisActive ? 'Shield aktiv' : 'Shield ruhig';
  const pop = input.populationSize > 0 ? `${input.populationSize} Genome` : 'keine Genome geladen';
  return `${input.status.toUpperCase()} · ${mode} · ${shield} · ${pop}`;
}

function explainLogEntry(log: LogEntry): string {
  const base = `${log.source}: ${log.message}`;
  if (log.level === 'error') return `Fehler erkannt. ${base} — prüfe Konfiguration/Netzwerk und versuche es erneut.`;
  if (log.level === 'warn') return `Warnung. ${base} — das System läuft weiter, aber ein Teil ist eingeschränkt.`;
  if (log.level === 'success') return `Erfolg. ${base} — dieser Schritt ist abgeschlossen.`;
  if (log.level === 'quantum') return `Quantum-Event. ${base} — betrifft Strategieauswahl/Matrix-Zustand.`;
  return `Info. ${base}`;
}

export function generateAssistant(input: AssistantInput): AssistantOutput {
  const suggestions: AssistantSuggestion[] = [];

  const hasExchangeKey = hasActiveProvider(input.apiKeys, ['BYBIT', 'BINANCE']);
  const hasLlmKey = hasActiveProvider(input.apiKeys, ['OPENAI', 'DEEPSEEK']);
  const hasNewsKey = hasActiveProvider(input.apiKeys, ['NEWS_API']);

  if (!input.isSupabaseConfigured) {
    suggestions.push({
      id: 'demo-mode',
      title: 'Demo-Modus aktiv',
      description:
        'Keine Supabase-Umgebungsvariablen gefunden. Sign-In, Realtime und API-Keys sind lokal deaktiviert – Visuals & Simulation laufen weiter.',
      severity: 'warn',
      ctaLabel: 'Kurzanleitung öffnen',
      ctaEvent: 'aether:show-guide',
    });
  }

  if (input.isAuthenticated && input.apiKeys.length === 0) {
    suggestions.push({
      id: 'add-keys',
      title: 'API Keys hinzufügen',
      description: 'Für Live-Trading/News/LLM: in Settings mindestens Bybit/Binance + optional News/LLM aktivieren.',
      severity: 'info',
      ctaLabel: 'Settings öffnen',
      ctaEvent: 'aether:open-settings',
    });
  }

  if (input.isAuthenticated && !hasExchangeKey) {
    suggestions.push({
      id: 'missing-exchange',
      title: 'Kein aktiver Exchange-Key',
      description: 'Aktiviere einen Bybit/Binance Key, sonst bleibt der Order-Router im Paper/Demo-Verhalten.',
      severity: 'warn',
      ctaLabel: 'Exchange Keys konfigurieren',
      ctaEvent: 'aether:open-settings',
    });
  }

  if (input.isAuthenticated && hasExchangeKey && input.status === 'ready') {
    suggestions.push({
      id: 'activate',
      title: 'Oracle aktivieren',
      description: 'Der Core ist bereit. Starte die Evolution/Order-Routing-Sequenz über „ACTIVATE ORACLE“.',
      severity: 'info',
      ctaLabel: 'Aktivieren',
      ctaEvent: 'aether:activate-oracle',
    });
  }

  if (input.crisisActive) {
    suggestions.push({
      id: 'shield',
      title: 'Shield aktiv – Risiko reduzieren',
      description: `Aktuell wurden Krisen-Indikatoren erkannt. Senke „Risk“ und „Volatility“ (Bias) temporär.`,
      severity: 'critical',
    });
  }

  if (input.activeGenome) {
    const g = input.activeGenome;
    if (g.maxDrawdown > 0.2) {
      suggestions.push({
        id: 'dd',
        title: 'Hoher Drawdown im aktiven Genom',
        description: `Max Drawdown liegt bei ${(g.maxDrawdown * 100).toFixed(1)}%. Erwäge Risk-Bias ↓ und stärkere Selektion.`,
        severity: 'warn',
      });
    }
    if (g.sharpeRatio < 0) {
      suggestions.push({
        id: 'sharpe',
        title: 'Negativer Sharpe',
        description: 'Aktives Genom liefert risikobereinigt negative Performance. Prüfe Fitness/Selektion oder wechsle Genom.',
        severity: 'warn',
      });
    }
  }

  if (hasLlmKey && !hasNewsKey) {
    suggestions.push({
      id: 'news-key',
      title: 'LLM-Key vorhanden, aber News-Key fehlt',
      description: 'Für echte Nachrichtenfeeds: NewsAPI Key hinzufügen. LLM kann dann realen News-Input klassifizieren.',
      severity: 'info',
      ctaLabel: 'Settings öffnen',
      ctaEvent: 'aether:open-settings',
    });
  }

  const lastLog = input.logs.length > 0 ? input.logs[0] : null;
  const lastEventExplanation = lastLog ? explainLogEntry(lastLog) : null;

  const phenotypeLine = `Bias · Risk ${formatPct(input.phenotype.riskLevel)} · Horizon ${formatPct(input.phenotype.timeHorizon)} · Trend ${formatPct(input.phenotype.trendBias)} · Volatility ${formatPct(input.phenotype.volatilityAffinity)}`;

  const headline =
    input.status === 'initializing'
      ? 'Oracle bootet…'
      : input.crisisActive
        ? 'Shield-Phase: defensiv bleiben'
        : input.status === 'active'
          ? 'Oracle aktiv: beobachte Logs & Matrix'
          : 'Oracle bereit: nächster Schritt';

  const summary = `${summarizeStatus(input)}\n${phenotypeLine}`;

  return {
    headline,
    summary,
    suggestions: suggestions.slice(0, 5),
    lastEventExplanation,
  };
}

