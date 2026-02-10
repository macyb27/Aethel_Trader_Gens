import { Component, Show, createMemo, createSignal } from 'solid-js';
import { state } from '../store';
import { authState } from '../store/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { generateAssistant } from '../logic/oracleAssistant';
import '../styles/assistant.css';

function emit(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}

const OracleAssistPanel: Component = () => {
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const assistant = createMemo(() =>
    generateAssistant({
      status: state.status,
      mode: state.mode,
      crisisActive: state.crisis.isActive,
      logs: state.logs.slice().reverse().slice(0, 50),
      phenotype: state.currentPhenotype,
      activeGenome: state.activeGenome,
      populationSize: state.population.length,
      selectedNodeId: state.selectedNodeId,
      isSupabaseConfigured,
      isAuthenticated: authState.isAuthenticated,
      apiKeys: authState.apiKeys.map((k) => ({ provider: k.provider, isActive: k.isActive })),
    }),
  );

  return (
    <div class="assistant-panel panel" classList={{ collapsed: isCollapsed() }}>
      <div class="panel-header assistant-header">
        <div class="assistant-header-left">
          <span class="panel-icon">🤖</span>
          ORACLE ASSIST
        </div>
        <button
          class="btn btn-small assistant-collapse"
          onClick={() => setIsCollapsed(!isCollapsed())}
          title={isCollapsed() ? 'Expand' : 'Collapse'}
        >
          {isCollapsed() ? '▸' : '▾'}
        </button>
      </div>

      <Show when={!isCollapsed()}>
        <div class="panel-body assistant-body">
          <div class="assistant-headline">{assistant().headline}</div>
          <pre class="assistant-summary">{assistant().summary}</pre>

          <Show when={assistant().lastEventExplanation}>
            <div class="assistant-section">
              <div class="assistant-section-title">Letztes Event (erklärt)</div>
              <div class="assistant-last-event">{assistant().lastEventExplanation}</div>
            </div>
          </Show>

          <Show when={assistant().suggestions.length > 0}>
            <div class="assistant-section">
              <div class="assistant-section-title">Empfehlungen</div>
              <div class="assistant-suggestions">
                {assistant().suggestions.map((s) => (
                  <div class={`assistant-suggestion ${s.severity}`}>
                    <div class="assistant-suggestion-main">
                      <div class="assistant-suggestion-title">{s.title}</div>
                      <div class="assistant-suggestion-desc">{s.description}</div>
                    </div>
                    <Show when={s.ctaLabel && s.ctaEvent}>
                      <button
                        class="btn btn-small btn-primary"
                        onClick={() => emit(s.ctaEvent!)}
                      >
                        {s.ctaLabel}
                      </button>
                    </Show>
                  </div>
                ))}
              </div>
            </div>
          </Show>

          <div class="assistant-footer">
            <button class="btn btn-small" onClick={() => emit('aether:show-guide')}>
              Guide
            </button>
            <button class="btn btn-small" onClick={() => emit('aether:open-settings')}>
              Settings
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default OracleAssistPanel;

