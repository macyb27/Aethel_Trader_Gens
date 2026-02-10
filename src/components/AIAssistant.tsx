/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω - AI ASSISTANT
 * Intelligent in-app assistant for trading insights and platform guidance
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { state } from '../store';
import { authState } from '../store/auth';
import { analyzeSentiment } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  'Was ist der aktuelle Status?',
  'Erkläre den Sharpe Ratio',
  'Wie funktioniert Nexus Mode?',
  'Markt-Sentiment analysieren',
  'Was bedeutet Flow Mode?',
];

const LOCAL_RESPONSES: Record<string, string> = {
  'status': `**Aktueller System-Status:**\n\n• **Oracle:** ${state.status.toUpperCase()}\n• **Agents:** ${state.agentsSpawned}/${state.totalAgents}\n• **Modus:** ${state.mode === 'flow' ? 'Flow (Logbuch)' : 'Nexus (3D-Matrix)'}\n\n${state.activeGenome ? `**Aktives Genom:** ${state.activeGenome.genomeId.slice(0, 20)}...\nSharpe: ${state.activeGenome.sharpeRatio.toFixed(2)} | Win Rate: ${(state.activeGenome.winRate * 100).toFixed(1)}%` : 'Kein aktives Genom – Drücke ACTIVATE ORACLE'}`,
  'sharpe': '**Sharpe Ratio** misst die risikoadjustierte Rendite einer Strategie. Ein Wert > 1 gilt als gut, > 2 als exzellent. Er zeigt, wie viel Überschussrendite du pro Einheit Risiko erhältst. Der ÆTHER-Oracle optimiert Strategien automatisch für höhere Sharpe Ratios.',
  'nexus': '**Nexus Mode** (Taste N) zeigt dir die Generative Strategy Matrix in 3D. Jeder Punkt = eine evolutionäre Trading-Strategie. Farben = Sharpe Ratio (Cyan = gut, Rot = schlecht). Z-Achse = Quantum Entanglement Score. Klicke auf Knoten, um Strategien zu vergleichen.',
  'flow': '**Flow Mode** (Taste F) ist dein Echtzeit-Audit-Logbuch. Hier siehst du alle Marktaktivitäten, Agenten-Logs, News-Sentiment und System-Events. Die Sidebar zeigt Metriken, Portfolio und Phenotype-Bias.',
  'help': '**ÆTHER-TRADER Ω Hilfe:**\n\n• **F** – Flow Mode (Logbuch)\n• **N** – Nexus Mode (3D)\n• **ESC** – Modus wechseln\n• **ACTIVATE ORACLE** – Startet die Evolution\n\nVerbinde in den Settings deine API-Keys (Bybit, Binance, OpenAI) für Echtzeit-Trading.',
};

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

const AIAssistant: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal('');
  const [isThinking, setIsThinking] = createSignal(false);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: Date.now(),
    }]);
  };

  const getLocalResponse = (question: string): string | null => {
    const q = question.toLowerCase();
    if (q.includes('status') || q.includes('aktuell') || q.includes('stand')) return LOCAL_RESPONSES.status;
    if (q.includes('sharpe') || q.includes('ratio')) return LOCAL_RESPONSES.sharpe;
    if (q.includes('nexus') || q.includes('3d')) return LOCAL_RESPONSES.nexus;
    if (q.includes('flow') || q.includes('logbuch')) return LOCAL_RESPONSES.flow;
    if (q.includes('hilfe') || q.includes('help') || q.includes('tasten')) return LOCAL_RESPONSES.help;
    return null;
  };

  const handleSend = async () => {
    const text = input().trim();
    if (!text || isThinking()) return;

    setInput('');
    addMessage('user', text);
    setIsThinking(true);

    try {
      // 1. Check for sentiment analysis request
      if (text.toLowerCase().includes('sentiment') || (text.toLowerCase().includes('markt') && text.toLowerCase().includes('analys'))) {
        if (authState.isAuthenticated) {
          try {
            const headlines = ['Bitcoin ETF institutional adoption', 'Cryptocurrency market volatility', 'Crypto regulatory news'];
            const result = await analyzeSentiment(headlines, 'OPENAI');
            const r = result.results?.[0];
            if (r) {
              const sentiment = r.score > 0.2 ? 'bullish' : r.score < -0.2 ? 'bearish' : 'neutral';
              addMessage('assistant', `**Sentiment-Analyse (${result.provider}):** ${sentiment.toUpperCase()}\n\nDurchschnitt Score: ${r.score.toFixed(2)}\nConfidence: ${(r.confidence * 100).toFixed(0)}%\nImpact: ${r.impact}\n\n${(r as { reasoning?: string }).reasoning || 'Analyse abgeschlossen.'}`);
            } else {
              addMessage('assistant', 'Keine Sentiment-Daten erhalten. Prüfe deine API-Keys.');
            }
          } catch {
            addMessage('assistant', 'Sentiment-API nicht verfügbar. Füge einen OpenAI- oder DeepSeek-Key in den Settings hinzu.');
          }
        } else {
          addMessage('assistant', 'Melde dich an und füge einen OpenAI-Key in den Settings hinzu, um KI-Sentiment-Analyse zu nutzen.');
        }
        setIsThinking(false);
        return;
      }

      // 2. Local pattern matching
      const localRes = getLocalResponse(text);
      if (localRes) {
        await new Promise(r => setTimeout(r, 500));
        addMessage('assistant', localRes);
        setIsThinking(false);
        return;
      }

      // 3. Fallback - generic helpful response
      await new Promise(r => setTimeout(r, 800));
      addMessage('assistant', `Ich bin der ÆTHER-Oracle-Assistent. Du kannst mich fragen nach:\n\n• **Aktueller Status** – \"Was ist der Status?\"\n• **Sharpe Ratio** – \"Erkläre Sharpe\"\n• **Nexus Mode** – \"Wie funktioniert Nexus?\"\n• **Flow Mode** – \"Was ist Flow Mode?\"\n• **Hilfe** – \"Hilfe\" oder \"Tasten\"\n• **Sentiment** – \"Markt-Sentiment analysieren\"\n\nBei weiteren Fragen: Verbinde OpenAI/DeepSeek in den Settings für erweiterte KI-Antworten.`);
    } catch (err) {
      addMessage('assistant', 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      <button
        class="ai-assistant-fab"
        classList={{ open: isOpen() }}
        onClick={() => setIsOpen(!isOpen())}
        title="KI-Assistent öffnen"
      >
        <span class="fab-icon">{isOpen() ? '✕' : '🤖'}</span>
      </button>

      <Show when={isOpen()}>
        <div class="ai-assistant-panel">
          <div class="ai-assistant-header">
            <span class="ai-assistant-title">🤖 Oracle Assistant</span>
            <p class="ai-assistant-subtitle">Frage mich zu Strategien, Status oder Markt</p>
          </div>

          <div class="ai-assistant-messages">
            <Show when={messages().length === 0}>
              <div class="ai-assistant-welcome">
                <p>Hallo! Ich bin dein ÆTHER-Assistent.</p>
                <p>Klicke auf eine Quick-Action oder stelle eine Frage:</p>
                <div class="ai-quick-actions">
                  <For each={QUICK_ACTIONS}>
                    {(action) => (
                      <button
                        class="ai-quick-btn"
                        onClick={() => {
                          setInput(action);
                          setTimeout(() => handleSend(), 100);
                        }}
                      >
                        {action}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <For each={messages()}>
              {(msg) => (
                <div class={`ai-message ai-message-${msg.role}`}>
                  <div class="ai-message-content" innerHTML={parseMarkdown(msg.content)} />
                </div>
              )}
            </For>
            <Show when={isThinking()}>
              <div class="ai-message ai-message-assistant">
                <div class="ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </Show>
          </div>

          <div class="ai-assistant-input">
            <input
              type="text"
              placeholder="Frage stellen..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isThinking()}
            />
            <button class="ai-send-btn" onClick={handleSend} disabled={isThinking() || !input().trim()}>
              Senden
            </button>
          </div>
        </div>
      </Show>

      <style>{`
        .ai-assistant-fab {
          position: fixed;
          bottom: 80px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--neon-cyan), var(--plasma-purple));
          border: none;
          cursor: pointer;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 243, 255, 0.4);
          transition: all 0.3s ease;
        }

        .ai-assistant-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(0, 243, 255, 0.5);
        }

        .fab-icon {
          font-size: 1.5rem;
        }

        .ai-assistant-panel {
          position: fixed;
          bottom: 150px;
          right: 24px;
          width: 380px;
          max-height: 500px;
          background: rgba(5, 5, 5, 0.98);
          border: 1px solid rgba(0, 243, 255, 0.3);
          border-radius: 16px;
          z-index: 199;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 243, 255, 0.1);
          overflow: hidden;
        }

        .ai-assistant-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 243, 255, 0.2);
        }

        .ai-assistant-title {
          font-family: var(--font-display);
          font-size: 1rem;
          color: var(--neon-cyan);
          font-weight: 600;
        }

        .ai-assistant-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .ai-assistant-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          min-height: 200px;
          max-height: 320px;
        }

        .ai-assistant-welcome {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .ai-assistant-welcome p {
          margin-bottom: 12px;
        }

        .ai-quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }

        .ai-quick-btn {
          padding: 10px 14px;
          background: rgba(0, 243, 255, 0.08);
          border: 1px solid rgba(0, 243, 255, 0.2);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-quick-btn:hover {
          background: rgba(0, 243, 255, 0.15);
          border-color: var(--neon-cyan);
        }

        .ai-message {
          margin-bottom: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .ai-message-user {
          background: rgba(0, 243, 255, 0.1);
          border: 1px solid rgba(0, 243, 255, 0.2);
          margin-left: 24px;
        }

        .ai-message-assistant {
          background: rgba(188, 19, 254, 0.08);
          border: 1px solid rgba(188, 19, 254, 0.2);
          margin-right: 24px;
        }

        .ai-message-content strong {
          color: var(--neon-cyan);
        }

        .ai-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .ai-typing span {
          width: 8px;
          height: 8px;
          background: var(--plasma-purple);
          border-radius: 50%;
          animation: ai-bounce 1.4s ease-in-out infinite;
        }

        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes ai-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .ai-assistant-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid rgba(0, 243, 255, 0.2);
        }

        .ai-assistant-input input {
          flex: 1;
          padding: 12px 16px;
          background: var(--deep-space);
          border: 1px solid rgba(0, 243, 255, 0.2);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 0.9rem;
        }

        .ai-assistant-input input:focus {
          outline: none;
          border-color: var(--neon-cyan);
        }

        .ai-send-btn {
          padding: 12px 20px;
          background: var(--neon-cyan);
          color: var(--void-black);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-send-btn:hover:not(:disabled) {
          box-shadow: 0 0 20px var(--neon-cyan);
        }

        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
