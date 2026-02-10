/**
 * ÆTHER-TRADER Ω v4.0 - ONBOARDING OVERLAY
 * First-time user experience with feature explanations
 */

import { Component, createSignal, Show } from 'solid-js';

const ONBOARDING_KEY = 'aether.onboarding.completed';

interface Step {
  title: string;
  description: string;
  icon: string;
  highlight: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to ÆTHER-TRADER',
    description: 'A quantum-inspired algorithmic trading platform that evolves trading strategies using genetic algorithms and AI-powered market analysis.',
    icon: '🔮',
    highlight: 'oracle',
  },
  {
    title: 'Flow Mode — Your Audit Logbook',
    description: 'Monitor all system events in real-time. Every trade, strategy change, and market alert is logged here. Press F to switch to Flow Mode.',
    icon: '📜',
    highlight: 'flow',
  },
  {
    title: 'Nexus Mode — 3D Strategy Matrix',
    description: 'Visualize your strategy population in 3D space. Each node is a genome — color shows performance. Click nodes to select strategies. Press N to enter.',
    icon: '🌌',
    highlight: 'nexus',
  },
  {
    title: 'DNA Control Panel',
    description: 'Shape the evolution by adjusting Risk, Time Horizon, Trend Bias, and Volatility sliders. The system prioritizes strategies matching your preferences.',
    icon: '🧬',
    highlight: 'dna',
  },
  {
    title: 'AI Assistant',
    description: 'Click the AI button in the top bar for market insights, strategy recommendations, and help with any feature. Ask it anything!',
    icon: '🤖',
    highlight: 'ai',
  },
  {
    title: 'Ready to Begin!',
    description: 'Click "ACTIVATE ORACLE" to start the evolution engine. The system will continuously optimize strategies and monitor markets for you. Good luck!',
    icon: '✨',
    highlight: 'activate',
  },
];

const OnboardingOverlay: Component = () => {
  const [isVisible, setIsVisible] = createSignal(!localStorage.getItem(ONBOARDING_KEY));
  const [currentStep, setCurrentStep] = createSignal(0);

  const handleNext = () => {
    if (currentStep() < STEPS.length - 1) {
      setCurrentStep(currentStep() + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep() > 0) {
      setCurrentStep(currentStep() - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  const step = () => STEPS[currentStep()];

  return (
    <Show when={isVisible()}>
      <div class="onboarding-overlay">
        <div class="onboarding-card">
          <button class="onboarding-skip" onClick={handleComplete}>
            Skip Tour
          </button>

          <div class="onboarding-icon">{step().icon}</div>
          <h2 class="onboarding-title">{step().title}</h2>
          <p class="onboarding-desc">{step().description}</p>

          <div class="onboarding-progress">
            {STEPS.map((_, i) => (
              <div
                class="onboarding-dot"
                classList={{ active: i === currentStep(), completed: i < currentStep() }}
              />
            ))}
          </div>

          <div class="onboarding-actions">
            <Show when={currentStep() > 0}>
              <button class="onboarding-btn onboarding-btn-back" onClick={handlePrev}>
                Back
              </button>
            </Show>
            <button class="onboarding-btn onboarding-btn-next" onClick={handleNext}>
              {currentStep() < STEPS.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default OnboardingOverlay;
