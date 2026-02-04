# ÆTHER-TRADER Ω v4.0

## Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence

![Version](https://img.shields.io/badge/version-4.0.0-cyan)
![Status](https://img.shields.io/badge/status-GOLD-gold)
![Tech](https://img.shields.io/badge/tech-Solid.js%20%2B%20Three.js%20%2B%20Tauri-purple)

---

## 🔮 Project Overview

**ÆTHER-TRADER Ω** is a next-generation trading intelligence system featuring:
- **Generative Strategy Matrix (GSM)** - 3D visualization of evolving strategy genomes
- **Quantum-Inspired Algorithms** - Entanglement scoring for market correlation detection
- **Self-Evolving Strategies** - Genetic algorithm with user phenotype bias control
- **Dark Nebula Theme** - Immersive cyberpunk UI design

## 🌐 Live Demo

**Production URL**: [To be deployed on Cloudflare Pages]

## 🎨 Features

### ✅ Implemented Features

#### Phase 1: Genesis & Data Architecture
- Tauri 2.0 + Rust backend structure
- Solid.js reactive frontend
- SQLite schema for historical data and strategy DNA
- Dark Nebula theme system

#### Phase 2: Dual Mode Visualization
- **FlowMode**: Secure audit logbook with real-time metrics
- **NexusMode**: Full-screen 3D GSM with Three.js
- Hotkey switching (F/N/ESC)
- Plasma warp transition effects

#### Phase 3: Multi-Exchange Integration
- Bybit & Binance WebSocket connectors
- Yjs CRDT for conflict-free state management
- Normalized data structures

#### Phase 4: DNA Control Panel
- Fixed bottom bar with animated sliders
- Phenotype parameters: Risk, Time Horizon, Trend, Volatility
- Real-time genome statistics

#### Phase 5: Quantum Edge Detector
- Orderflow-based entanglement scoring
- Quantum state simulation (QuTiP placeholder)
- Coherence and correlation metrics

#### Phase 6: News Oracle
- LLM-based sentiment classification (stub)
- Sentiment firehose with impact levels
- Environmental pressure for GA

#### Phase 7: Genetic Algorithm Core
- **`phenotypeToGenotype(x, y)`** - GOLD STATUS feature
- Crossover, mutation, selection operations
- User bias integration for selection pressure

#### Phase 8: Oracle Shield
- Crisis detection (VIX, Funding, Liquidations, Flash Crash)
- Survival DNA v9 loading
- Blinking red/purple overlay

#### Phase 9: Awakening Sequence
- "ACTIVATE ORACLE" button
- 500 agent spawn animation
- Final report with GSM snapshot
- "I UNDERSTAND THE MARKET NOW" modal

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Solid.js, Three.js, TypeScript |
| State | Solid.js Signals, Yjs CRDT |
| Visualization | WebGL/Three.js |
| Desktop | Tauri 2.0, Rust |
| Build | Vite |
| Deploy | Cloudflare Pages |

## 🎯 API Endpoints (Simulated)

| Endpoint | Description |
|----------|-------------|
| `/api/market/:symbol` | Market data stream |
| `/api/genome/:id` | Strategy genome CRUD |
| `/api/evolution/start` | Start evolution cycle |
| `/api/shield/activate` | Activate Oracle Shield |

## 🎮 Controls

| Key | Action |
|-----|--------|
| `F` | Switch to Flow Mode |
| `N` | Switch to Nexus Mode |
| `ESC` | Toggle modes |

## 📊 Data Models

### StrategyDNA
```typescript
interface StrategyDNA {
  genomeId: string;
  genomeString: string;
  generation: number;
  sharpeRatio: number;
  maxDrawdown: number;
  riskLevel: number;      // Phenotype
  timeHorizon: number;    // Phenotype
  trendBias: number;      // Phenotype
  volatilityAffinity: number; // Phenotype
  entanglementScore: number;  // Quantum feature
  lastSentiment: number;      // News feature
}
```

### GSM Node
```typescript
interface GSMNode {
  x: number;  // riskLevel mapped
  y: number;  // timeHorizon mapped
  z: number;  // entanglementScore (depth)
  color: string;  // Based on Sharpe Ratio
}
```

## 🚀 Deployment

### Local Development
```bash
npm install
npm run dev
```

### Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy dist
```

## 📁 Project Structure
```
webapp/
├── src/
│   ├── components/
│   │   ├── FlowMode.tsx      # Audit Logbook
│   │   ├── NexusMode.tsx     # 3D GSM
│   │   ├── DNAControlPanel.tsx
│   │   └── AwakeningButton.tsx
│   ├── logic/
│   │   ├── evolutionEngine.ts  # GA Core + phenotypeToGenotype
│   │   ├── quantumEdge.ts      # Entanglement Detector
│   │   ├── newsOracle.ts       # Sentiment Analysis
│   │   ├── crdt_store.ts       # Yjs State
│   │   └── exchangeConnector.ts
│   ├── interfaces/
│   │   └── IStrategy.ts
│   ├── store/
│   │   └── index.ts            # Solid.js Store
│   ├── styles/
│   │   ├── flow-mode.css
│   │   ├── nexus-mode.css
│   │   ├── dna-panel.css
│   │   └── modals.css
│   ├── db/
│   │   └── schema.sql
│   ├── App.tsx
│   └── index.tsx
├── src-tauri/                   # Rust backend (Desktop)
│   └── src/
│       ├── main.rs
│       ├── commands.rs
│       ├── dna_model.rs
│       └── shield_logic.rs
├── public/
├── package.json
├── vite.config.ts
└── wrangler.jsonc
```

## 🎨 Color Palette (Dark Nebula)

| Name | Hex | Usage |
|------|-----|-------|
| Void Black | `#050505` | Background |
| Deep Space | `#0a0a0a` | Panels |
| Neon Cyan | `#00f3ff` | Primary accent |
| Plasma Purple | `#bc13fe` | Secondary accent |
| Warning Red | `#ff0040` | Errors, Crisis |
| Success Green | `#00ff88` | Positive values |

## 👤 Author

**Macyb** - AI Engineering Specialist & Independent Developer

---

*"The Oracle sees all. The Oracle trades all."* 🔮
