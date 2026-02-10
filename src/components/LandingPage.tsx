/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω - LANDING PAGE
 * Self-explaining GUI with clear value proposition and intuitive navigation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component } from 'solid-js';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: Component<LandingPageProps> = (props) => {
  return (
    <div class="landing-page">
      {/* Animated background */}
      <div class="landing-bg">
        <div class="landing-grid" />
        <div class="landing-glow landing-glow-1" />
        <div class="landing-glow landing-glow-2" />
        <div class="landing-glow landing-glow-3" />
      </div>

      {/* Hero Section */}
      <header class="landing-hero">
        <div class="landing-badge">AI-Powered Trading Intelligence</div>
        <h1 class="landing-title">
          <span class="landing-title-accent">ÆTHER</span>
          <span class="landing-title-main">TRADER</span>
          <span class="landing-title-omega">Ω</span>
        </h1>
        <p class="landing-subtitle">
          Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence.
          <br />
          <span class="landing-subtitle-hint">Evolutionäre Strategien • Echtzeit-Sentiment • KI-gestützte Entscheidungen</span>
        </p>
        <button class="landing-cta btn-awakening" onClick={props.onEnter}>
          <span class="cta-icon">🚀</span>
          Platform betreten
        </button>
      </header>

      {/* Feature Cards - Self-explaining */}
      <section class="landing-features">
        <h2 class="landing-section-title">Was du bekommst</h2>
        <div class="landing-feature-grid">
          <div class="landing-feature-card">
            <div class="feature-icon">📊</div>
            <h3>Flow Mode</h3>
            <p>Echtzeit-Audit-Logbuch mit allen Marktaktivitäten, Agenten-Status und System-Logs auf einen Blick.</p>
          </div>
          <div class="landing-feature-card">
            <div class="feature-icon">🌌</div>
            <h3>Nexus Mode</h3>
            <p>3D-Visualisierung der Strategie-Matrix. Jeder Punkt = eine evolutionäre Trading-Strategie.</p>
          </div>
          <div class="landing-feature-card">
            <div class="feature-icon">🧬</div>
            <h3>Genetischer Algorithmus</h3>
            <p>500 Trading-Agenten evolvieren automatisch die besten Strategien basierend auf Marktdaten.</p>
          </div>
          <div class="landing-feature-card">
            <div class="feature-icon">🤖</div>
            <h3>KI-Assistent</h3>
            <p>Stelle Fragen zu Strategien, Marktanalyse oder nutze den Oracle für intelligente Insights.</p>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section class="landing-guide">
        <h2 class="landing-section-title">Schnellstart</h2>
        <div class="landing-steps">
          <div class="landing-step">
            <span class="step-num">1</span>
            <span>Platform betreten</span>
          </div>
          <div class="landing-step-arrow">→</div>
          <div class="landing-step">
            <span class="step-num">2</span>
            <span>Oracle aktivieren</span>
          </div>
          <div class="landing-step-arrow">→</div>
          <div class="landing-step">
            <span class="step-num">3</span>
            <span>Flow (F) oder Nexus (N) wechseln</span>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer class="landing-footer">
        <button class="landing-cta-secondary" onClick={props.onEnter}>
          Jetzt starten
        </button>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .landing-bg {
          position: fixed;
          inset: 0;
          background: var(--void-black);
          z-index: 0;
        }

        .landing-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .landing-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: landing-pulse 8s ease-in-out infinite;
        }

        .landing-glow-1 {
          width: 400px;
          height: 400px;
          background: var(--neon-cyan);
          top: -100px;
          right: -100px;
        }

        .landing-glow-2 {
          width: 300px;
          height: 300px;
          background: var(--plasma-purple);
          bottom: 20%;
          left: -50px;
          animation-delay: -4s;
        }

        .landing-glow-3 {
          width: 200px;
          height: 200px;
          background: var(--success-green);
          bottom: -50px;
          right: 20%;
          animation-delay: -2s;
        }

        @keyframes landing-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }

        .landing-hero {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 120px 24px 80px;
          max-width: 800px;
          margin: 0 auto;
        }

        .landing-badge {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(0, 243, 255, 0.1);
          border: 1px solid rgba(0, 243, 255, 0.3);
          border-radius: 24px;
          font-size: 0.8rem;
          color: var(--neon-cyan);
          letter-spacing: 2px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }

        .landing-title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 800;
          letter-spacing: 8px;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .landing-title-accent {
          color: var(--neon-cyan);
          text-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
        }

        .landing-title-main {
          color: var(--text-primary);
          margin: 0 8px;
        }

        .landing-title-omega {
          color: var(--plasma-purple);
          text-shadow: 0 0 30px rgba(188, 19, 254, 0.5);
        }

        .landing-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          line-height: 1.7;
          margin-bottom: 40px;
        }

        .landing-subtitle-hint {
          font-size: 0.9rem;
          color: var(--neon-cyan);
          opacity: 0.8;
        }

        .landing-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 18px 40px;
          font-size: 1.1rem;
        }

        .cta-icon {
          font-size: 1.3rem;
        }

        .landing-features {
          position: relative;
          z-index: 1;
          padding: 60px 24px 80px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .landing-section-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--neon-cyan);
          text-align: center;
          margin-bottom: 40px;
          letter-spacing: 4px;
        }

        .landing-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .landing-feature-card {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(0, 243, 255, 0.2);
          border-radius: 12px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .landing-feature-card:hover {
          border-color: rgba(0, 243, 255, 0.5);
          box-shadow: 0 0 30px rgba(0, 243, 255, 0.1);
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .landing-feature-card h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--neon-cyan);
          margin-bottom: 8px;
          letter-spacing: 2px;
        }

        .landing-feature-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .landing-guide {
          position: relative;
          z-index: 1;
          padding: 40px 24px 60px;
          text-align: center;
        }

        .landing-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .landing-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 28px;
          background: rgba(0, 243, 255, 0.05);
          border: 1px solid rgba(0, 243, 255, 0.2);
          border-radius: 10px;
        }

        .step-num {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--neon-cyan);
          color: var(--void-black);
          border-radius: 50%;
          font-weight: 700;
          font-size: 1rem;
        }

        .landing-step span:last-child {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .landing-step-arrow {
          color: var(--plasma-purple);
          font-size: 1.2rem;
        }

        .landing-footer {
          position: relative;
          z-index: 1;
          padding: 40px 24px 60px;
          text-align: center;
        }

        .landing-cta-secondary {
          padding: 14px 32px;
          background: transparent;
          border: 2px solid var(--plasma-purple);
          color: var(--plasma-purple);
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .landing-cta-secondary:hover {
          background: var(--plasma-purple);
          color: white;
          box-shadow: 0 0 30px rgba(188, 19, 254, 0.4);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
