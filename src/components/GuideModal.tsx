import { Component, Show, createMemo, createSignal } from 'solid-js';
import '../styles/assistant.css';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function emit(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}

const steps = [
  {
    title: 'Modi verstehen',
    body: [
      'Flow Mode = Audit-Logbook (stabil & erklärbar)',
      'Nexus Mode = 3D Strategy Matrix (GSM)',
      'Hotkeys: F (Flow), N (Nexus), ESC (Toggle)',
    ],
  },
  {
    title: 'Demo vs Live',
    body: [
      'Ohne Login/API Keys läuft alles als Demo/Simulation.',
      'Mit Bybit/Binance Keys kann der Router echte Live-Daten/Orders nutzen.',
      'News/LLM Keys verbessern die Sentiment-Qualität.',
    ],
  },
  {
    title: 'Nächster sinnvoller Schritt',
    body: [
      'Öffne Settings und hinterlege (optional) deine Keys.',
      'Starte dann „ACTIVATE ORACLE“ und beobachte das Logbook.',
    ],
    ctaLabel: 'Settings öffnen',
    ctaEvent: 'aether:open-settings' as const,
  },
];

const GuideModal: Component<GuideModalProps> = (props) => {
  const [idx, setIdx] = createSignal(0);
  const step = createMemo(() => steps[idx()]);

  const next = () => setIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay" onClick={() => props.onClose()}>
        <div class="modal-container guide-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Kurzanleitung</h2>
            <button class="modal-close" onClick={() => props.onClose()}>
              &times;
            </button>
          </div>

          <div class="guide-steps">
            {steps.map((_, i) => (
              <div class="guide-dot" classList={{ active: i === idx() }} />
            ))}
          </div>

          <div class="guide-body">
            <h3 class="guide-title">{step().title}</h3>
            <ul class="guide-list">
              {step().body.map((line) => (
                <li>{line}</li>
              ))}
            </ul>
          </div>

          <div class="guide-actions">
            <button class="btn" onClick={prev} disabled={idx() === 0}>
              Zurück
            </button>

            <Show when={step().ctaLabel && step().ctaEvent}>
              <button class="btn btn-primary" onClick={() => emit(step().ctaEvent!)}>
                {step().ctaLabel}
              </button>
            </Show>

            <button
              class="btn btn-primary"
              onClick={() => (idx() === steps.length - 1 ? props.onClose() : next())}
            >
              {idx() === steps.length - 1 ? 'Fertig' : 'Weiter'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default GuideModal;

