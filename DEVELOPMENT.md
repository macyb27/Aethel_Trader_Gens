# Entwicklungsrichtlinien – Aether Trader

Dieses Dokument bindet alle Beiträge an gemeinsame Regeln für **quanten-inspirierte Strategie-Entwicklung (QIGA)**, **Paper-Testing** und **Safety**. Es ergänzt Code-Reviews und CI; bei Widerspruch hat der **Safety Layer** Vorrang vor Performance und Feature-Vollständigkeit.

---

## 1. QIGA und quanten-inspirierter Stack

### 1.1 Begriffe

- **QIGA**: Evolutive Optimierung von Strategie-Genomen (Parameter, Regelmengen, Meta-Hyperparameter). Fitness ist **mehrzielig** (Return, Drawdown, Turnover, Stabilität über Fenster).  
- **QAOA-inspiriert**: Kombinatorische Teilprobleme (z. B. Bucket-Allokation, diskrete Moduswahl) – Implementierungen müssen **klassisch** sein, sofern keine echte QC-Hardware angebunden ist; der Name bezeichnet die **algorithmische Idee**, nicht einen Hardware-Anspruch.  
- **QI-MARL**: Mehrere Agenten mit klar definierten Rollen, Observation-Spaces und **begrenzter** Kommunikation; Exploration soll quanten-inspirierte Heuristiken nutzen dürfen, muss aber **reproduzierbar** konfigurierbar sein (Seeds, Budgets).

### 1.2 Entwicklungsregeln

1. **Keine stillen Live-Orders** – jede Änderung an Entscheidungslogik im Repo muss über Paper/Simulation oder Stub-Connectors testbar sein.  
2. **Versionierte Experimente** – Hyperparameter, Datenfenster und Seeds in Config (YAML/JSON/TOML) oder Code mit klarem `experiment_id`; keine „nur auf meiner Maschine“-Optimierung ohne Dokumentation.  
3. **Fitness-Transparenz** – jede Fitnesskomponente, die in Selection/Crossover eingeht, muss im Code oder in `docs/` benannt und **monoton interpretierbar** dokumentiert sein (höher besser vs. niedriger besser).  
4. **Genom-Serialisierung** – Genome müssen stabil serialisierbar sein (JSON/MessagePack o. Ä.), damit `strategy_memory/` und Audits konsistent bleiben.  
5. **Kein direkter Zugriff auf Secrets aus QI-Modulen** – API-Keys und Tokens nur über injizierte Clients oder Umgebungskonfiguration der Execution-Schicht.

### 1.3 Code-Qualität im QI-Bereich

- Reine Funktionen wo möglich; Seiteneffekte (IO, Logging) kapseln.  
- Unit-Tests für Operatoren (Mutation, Crossover, Constraint-Projektion).  
- Numerische Stabilität: dokumentierte Bounds für Parameter, keine unbeschränkten exponentiellen Skalierungen ohne Clamp.

---

## 2. Paper-Testing

### 2.1 Pflichten

1. **Paper vor jedem Merge**, der Execution-, Risk- oder Connector-Logik berührt – mindestens deterministischer Backtest oder Recorded-Feed, sofern in CI verfügbar.  
2. **Keine Vermischung von Live- und Paper-State** – getrennte Konfigurationsschlüssel und getrennte Datenpfade (siehe `.env.example`: `*_PAPER` vs. Live).  
3. **Slippage und Latenz** – Paper-Simulationen sollen konservative Annahmen dokumentieren; „perfekte“ Fills nur mit explizitem `IDEAL_FILL`-Flag in Entwicklung.  
4. **Walk-Forward** – bei Änderungen an QIGA-Fitness: mindestens ein einfaches Out-of-Sample-Fenster oder zeitliche Holdout-Periode in der Dokumentation des PRs beschreiben.

### 2.2 Anti-Patterns

- Backtest nur auf dem gleichen Segment, das zur Optimierung diente, ohne Holdout.  
- Überanpassung an eine einzelne Symbolklasse ohne dokumentierte Generalisierungsstrategie.  
- Deaktivieren von Risk-Checks „nur zum Testen“ ohne Feature-Flag und Zeitlimit.

---

## 3. Safety-Guidelines und Oracle Shield

### 3.1 Prinzipien

1. **Defense in Depth** – Limits auf Order-, Positions-, Portfolio- und Systemebene; Oracle Shield kann global eingreifen (z. B. Handel stoppen, nur Flatten erlauben).  
2. **Fail-safe** – bei fehlenden Marktdaten, Timeout oder Widerspruch in Agenten-Signalen: **keine** aggressive Positionserhöhung; Default ist konservativ.  
3. **Menschliche Override-Pfade** – Not-Aus und „Kill switch“ müssen in Architektur und Doku vorgesehen sein (auch wenn UI noch WIP ist).  
4. **Auditierbarkeit** – Safety-Entscheidungen loggen (Zeit, Regel-ID, Snapshot der Metriken); keine Logs mit Klartext-Secrets.

### 3.2 Änderungen am Safety-Code

- Änderungen an Oracle-Shield- oder Policy-Logik erfordern **Review durch zweite Person** oder explizite Checkliste im PR (welche Szenarien manuell getestet wurden).  
- Keine Verschleierung von Safety-Checks hinter generischen Flags ohne Semantik (`dangerMode` ohne Spezifikation ist unzulässig).  
- Regressionstests für bekannte Krisenszenarien (Flash-Crash-Synthese, Connector-Ausfall) nachziehen, sobald Test-Infrastruktur steht.

### 3.3 LLM- und externe KI

- LLM-Ausgaben **nie** ungeparst als Order-JSON ausführen; immer Validierungsschema und Limits.  
- Prompt-Injection: keine Roh-Markt- oder Chat-Feeds direkt in Systemprompts ohne Sanitization/Length-Limits.

---

## 4. Allgemeine Repo-Regeln

- **Monorepo**: Änderungen an gemeinsamen Typen bevorzugt in `packages/` ablegen, sobald Pakete existieren.  
- **Commits**: eine inhaltliche Aussage pro Commit; Breaking Changes im PR-Body beschreiben.  
- **.env**: niemals committen; nur `.env.example` pflegen.  
- **Dependencies**: begründete Updates; Security-Patches zeitnah.

---

## 5. Python Quantum-Pipeline (QIGA)

- Vom Repository-Root: ``PYTHONPATH=. python3 -m agents.orchestrator``  
- Konfiguration: Umgebungsvariablen mit Präfix ``AETHER_`` (siehe ``quantum_inspired/settings.py``).  
- Abhängigkeiten: ``pip install -e ".[quantum]"`` für PyTorch (QLSTM), optional ``[vectors]`` für Chroma/FAISS.

---

## 6. Kontakt und Eskalation

Bei Unsicherheit, ob eine Änderung die Safety-Grenzen berührt: im PR explizit markieren und **konservatives** Default-Verhalten wählen. Für organisatorische Fragen zur Konsolidierung der fünf Repos siehe Root-`README.md` (Roadmap / WIP).
