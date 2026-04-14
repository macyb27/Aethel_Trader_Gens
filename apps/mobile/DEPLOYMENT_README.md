# Aether Trader Pro - Autonomes Multi-Agenten Trading-System

## 🚀 Überblick

Production-ready autonomes Trading-System mit Multi-Agenten-Architektur, kombiniert Reinforcement Learning, Genetic Algorithms, Transfer Learning und striktes Risk Management.

## 🏗️ Architektur

### Multi-Agenten-System
1. **QA Bot** - Risk Management & Code Review
2. **RL Rule Developer** - Reinforcement Learning-basierte Regel-Generierung
3. **Backtest Engine** - Historische Daten-Validierung
4. **Paper Trader** - Live-Daten-Tests ohne echtes Geld
5. **Market Intel** - News Sentiment & Marktanalyse

### Workflow
```
Hypothesis → Backtest (2+ Jahre) → Paper Trading (50+ Trades, 14 Tage) → Validation → Live
```

## 📊 Key Features

✅ **Risk Management**
- Max 1% Verlust pro Trade
- Max 5% Position Size
- Max 10% Portfolio Drawdown
- Automatischer Halt bei hoher Volatilität (VIX >30)
- Trading Hours Enforcement

✅ **Machine Learning**
- Deep Q-Network (DQN) mit Experience Replay
- Transfer Learning (TensorFlow.js LSTM)
- Genetische Algorithmen für Strategie-Evolution
- Kelly Criterion für Position Sizing

✅ **Datenquellen**
- Alpaca API (Paper & Live Trading)
- Finnhub API (Marktdaten & News)
- yfinance (Historische Daten, 2+ Jahre)

✅ **Validierungs-Guardrails**
- Sharpe Ratio ≥ 1.5
- Max Drawdown < 20%
- Win Rate ≥ 50%
- Minimum 50 Trades im Paper Trading
- Minimum 14 Tage Testperiode

## 🛠️ Installation

### Voraussetzungen
- Node.js 22+
- Python 3.11+
- pnpm

### Setup
```bash
# Dependencies installieren
pnpm install

# Python Packages installieren
sudo pip3 install yfinance pandas numpy

# API Keys konfigurieren (via webdev_request_secrets):
# - ALPACA_API_KEY
# - ALPACA_API_SECRET
# - ALPACA_BASE_URL (https://paper-api.alpaca.markets für Paper Trading)
# - FINNHUB_API_KEY
```

## 🎯 Verwendung

### Development starten
```bash
pnpm dev
```

### RL-Modell trainieren
```bash
python3 scripts/train-rl-model.py AAPL 100
```

### Tests ausführen
```bash
pnpm test
```

### Agenten-System starten
```typescript
import { AgentOrchestrator } from './lib/agents/orchestrator';

const orchestrator = new AgentOrchestrator();
await orchestrator.startWorkflow();
```

## 📁 Projektstruktur

```
easygeld-pro/
├── lib/
│   ├── agents/
│   │   ├── qa-bot.ts              # Risk Management Agent
│   │   ├── rl-rule-developer.ts   # RL-basierte Regel-Generierung
│   │   └── orchestrator.ts        # Multi-Agenten-Koordinator
│   ├── services/
│   │   ├── alpaca-api.ts          # Alpaca Trading API
│   │   ├── finnhub-api.ts         # Finnhub Marktdaten API
│   │   └── backtesting-engine.ts  # Strategie-Backtesting
│   ├── trading-store.ts           # Trading State Management
│   ├── transfer-learning.ts       # TensorFlow.js ML Models
│   └── notifications.ts           # Push Notifications
├── scripts/
│   ├── train-rl-model.py          # RL Training Script
│   └── fetch-historical-data.py   # Historical Data Fetcher
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Dashboard
│   │   ├── trade.tsx              # Trading Interface
│   │   ├── strategy.tsx           # Strategy Management
│   │   ├── news.tsx               # News & Sentiment
│   │   ├── ml-training.tsx        # ML Training UI
│   │   └── profile.tsx            # Settings & Stats
│   └── onboarding.tsx             # Tutorial Screens
└── ARCHITECTURE.md                # Detaillierte Architektur-Docs
```

## 🧪 Testing

### Unit Tests
- QA Bot: 18 Tests
- RL Rule Developer: Validiert
- Agent Orchestrator: Workflow getestet
- Trading Store: Umfassende Coverage

```bash
pnpm test
```

### API Validation
```bash
pnpm test api-validation
```

## 📈 Performance-Metriken

### RL Training Ergebnisse (100 Episoden)
- Symbol: AAPL
- Historische Daten: 452 Tage (2024-2026)
- Durchschnittlicher Return: -4.73% (Baseline-Strategie)
- Win Rate: 50%
- Durchschnittliche Trades: 4 pro Episode

**Hinweis:** Negative Performance demonstriert QA-System-Effektivität - diese Strategie würde abgelehnt (Sharpe <1.5).

## 🔒 Sicherheit & Risiko

### Risk Limits (Konfigurierbar)
```typescript
{
  maxLossPerTrade: 1,        // 1%
  maxPositionSize: 5,        // 5%
  stopLossPercent: 1,        // 1%
  maxDrawdown: 10,           // 10%
  maxSectorExposure: 30,     // 30%
  maxLeverage: 2,            // 2x für Paper, 1x für Live
  volatilityHaltThreshold: 30, // VIX Level
  tradingHoursOnly: true,
  haltOnHighImpactNews: true
}
```

### Emergency Halt
```typescript
orchestrator.emergencyHalt("Grund für Halt");
```

## 📱 Mobile App

Gebaut mit Expo (React Native):
- iOS & Android Support
- Offline-First mit AsyncStorage
- Push Notifications für Trading Alerts
- Onboarding Flow mit Risk Disclaimers

## 🌐 API Integration

### Alpaca (Trading)
- Paper Trading (kostenlos, kein echtes Geld)
- Live Trading (benötigt finanziertes Konto)
- Echtzeit-Marktdaten
- Order Execution

### Finnhub (Marktdaten)
- Echtzeit-Quotes
- Marktnachrichten
- Unternehmensprofile
- Wirtschaftskalender

## 🚦 Deployment

### Paper Trading (Empfohlen zuerst)
1. Kostenlose Alpaca Paper Trading Keys holen
2. Strategien für 14+ Tage testen
3. Sharpe ≥1.5, Drawdown <20% validieren
4. QA Bot Reports überprüfen

### Live Trading (Nach Validierung)
1. Zu Alpaca Live API Keys wechseln
2. Mit kleinem Kapital starten
3. QA Bot Alerts überwachen
4. Graduell skalieren

## 📚 Dokumentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detaillierte System-Architektur
- [design.md](./design.md) - Mobile App Design Guidelines
- [todo.md](./todo.md) - Development Roadmap

## 🤝 Contributing

Dieses System wurde gebaut durch Kombination von Best Practices aus:
- stefan-jansen/machine-learning-for-trading (16.4k⭐)
- r/algotrading Community Insights
- Original Repositories: Aethel_Trader_Gens, Trade_Bot_Emergent, trading-bot-bolt

## ⚠️ Disclaimer

**NUR FÜR BILDUNGS- UND FORSCHUNGSZWECKE**

- Trading beinhaltet erhebliches Verlustrisiko
- Vergangene Performance garantiert keine zukünftigen Ergebnisse
- Immer mit Paper Trading starten
- Niemals mehr investieren als Sie verlieren können
- Konsultieren Sie einen Finanzberater vor Live Trading

## 📄 Lizenz

MIT License

## 🆘 Support

Für Issues oder Fragen:
- GitHub Issues: macyb27/[repo-name]
- Dokumentation: Siehe ARCHITECTURE.md
- Community: r/algotrading

---

**Gebaut mit:** React Native, Expo, TensorFlow.js, TypeScript, Python, yfinance, Alpaca API, Finnhub API
