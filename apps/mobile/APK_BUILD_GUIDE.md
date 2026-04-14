# Aether Trader Pro - APK Build Anleitung

Vollständige Anleitung zum Erstellen einer Android APK für Aether Trader Pro ohne Sandbox-Funktionen.

---

## Voraussetzungen

### 1. System Requirements
- **Node.js** 18+ (empfohlen: 22.x)
- **pnpm** 9+ oder npm
- **Git**
- **Expo Account** (kostenlos auf expo.dev)

### 2. Expo CLI Installation
```bash
npm install -g eas-cli
eas login
```

---

## Schritt 1: Repository Klonen

```bash
# Option A: Standalone Repository
git clone https://github.com/macyb27/Aether-Trader-Mobile.git
cd Aether-Trader-Mobile

# Option B: Aus Aethel_Trader_Gens
git clone https://github.com/macyb27/Aethel_Trader_Gens.git
cd Aethel_Trader_Gens/mobile
```

---

## Schritt 2: Dependencies Installieren

```bash
pnpm install
# oder
npm install
```

---

## Schritt 3: Sandbox-Funktionen Entfernen

Die App verwendet einige Sandbox-spezifische Features, die für Production entfernt werden müssen:

### 3.1 Python Scripts Entfernen/Ersetzen

**Dateien zu entfernen:**
- `scripts/fetch-historical-data.py`
- `scripts/train-rl-model.py`

**Alternative:** Historische Daten via JavaScript/TypeScript laden:

```typescript
// lib/services/historical-data.ts
export async function fetchHistoricalData(symbol: string, days: number) {
  // Option 1: Alpaca API
  const response = await fetch(
    `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=${days}`,
    {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET,
      },
    }
  );
  
  // Option 2: Yahoo Finance via API
  // Option 3: Finnhub Historical Data
  
  return response.json();
}
```

### 3.2 Command-Line Utilities Entfernen

Die folgenden Utilities sind nur in der Sandbox verfügbar und müssen ersetzt werden:

**Entfernen:**
- Alle `manus-*` CLI-Aufrufe
- Shell-basierte Operationen in `lib/`

**Ersetzen durch:**
- Native JavaScript/TypeScript Implementierungen
- React Native kompatible Packages

### 3.3 Environment Variables Konfigurieren

Erstelle `.env` Datei im Root:

```bash
# .env
ALPACA_API_KEY=your_alpaca_key_here
ALPACA_API_SECRET=your_alpaca_secret_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets/v2
FINNHUB_API_KEY=your_finnhub_key_here
```

**Wichtig:** Für Production sollten diese Keys über Expo Secrets verwaltet werden:

```bash
eas secret:create --scope project --name ALPACA_API_KEY --value "your_key"
eas secret:create --scope project --name ALPACA_API_SECRET --value "your_secret"
eas secret:create --scope project --name FINNHUB_API_KEY --value "your_key"
```

---

## Schritt 4: App-Konfiguration Anpassen

### 4.1 `app.config.ts` Prüfen

```typescript
// app.config.ts
const env = {
  appName: "Aether Trader Pro",
  appSlug: "aether-trader-pro",
  logoUrl: "", // Optional: S3 URL für Logo
  // ... rest bleibt gleich
};
```

### 4.2 Bundle Identifier Anpassen (Optional)

Wenn du eine eigene Bundle ID möchtest:

```typescript
// app.config.ts
const env = {
  // ...
  iosBundleId: "com.yourcompany.aethertrader",
  androidPackage: "com.yourcompany.aethertrader",
};
```

---

## Schritt 5: EAS Build Konfiguration

### 5.1 EAS Projekt Initialisieren

```bash
eas build:configure
```

Dies erstellt `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5.2 Build Profile Anpassen

Für APK (nicht AAB):

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

---

## Schritt 6: APK Bauen

### Option A: Cloud Build (Empfohlen)

```bash
# Preview Build (schneller, für Testing)
eas build --platform android --profile preview

# Production Build
eas build --platform android --profile production
```

**Vorteile:**
- Keine lokale Android SDK Installation nötig
- Automatische Code Signing
- Build-Logs in der Cloud

**Nach dem Build:**
- APK wird auf Expo Servers gehostet
- Download-Link wird in Terminal angezeigt
- APK kann direkt auf Android-Geräte installiert werden

### Option B: Lokaler Build

**Voraussetzungen:**
- Android Studio installiert
- Android SDK konfiguriert
- Java JDK 17+

```bash
# Lokalen Build starten
eas build --platform android --profile production --local
```

---

## Schritt 7: Code Signing (Production)

Für Production Builds benötigst du einen Keystore:

### 7.1 Keystore Erstellen

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore aether-trader.keystore \
  -alias aether-trader \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 7.2 Keystore zu EAS Hinzufügen

```bash
eas credentials
# Wähle: Android > Production > Keystore > Upload
```

Oder in `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

---

## Schritt 8: APK Testen

### 8.1 APK auf Gerät Installieren

```bash
# Via ADB
adb install path/to/aether-trader.apk

# Oder: APK direkt auf Gerät kopieren und öffnen
```

### 8.2 Testing Checklist

- [ ] App startet ohne Crashes
- [ ] Onboarding Flow funktioniert
- [ ] API-Verbindungen funktionieren (Alpaca, Finnhub)
- [ ] Trading-Features funktionieren
- [ ] Push-Benachrichtigungen funktionieren
- [ ] Daten werden lokal gespeichert (AsyncStorage)
- [ ] RL-Training funktioniert (falls implementiert)
- [ ] Keine Sandbox-Fehler in Logs

---

## Schritt 9: Optimierungen für Production

### 9.1 Bundle Size Reduzieren

```bash
# Analyze bundle
npx expo-doctor

# Remove unused dependencies
pnpm prune
```

### 9.2 Performance Optimierung

**In `app.config.ts`:**

```typescript
export default {
  // ...
  android: {
    // ...
    enableProguardInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
  },
};
```

### 9.3 Hermes Engine Aktivieren

Hermes verbessert Startup-Zeit und reduziert Memory Usage:

```json
// package.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

---

## Troubleshooting

### Problem: "Module not found" Fehler

**Lösung:**
```bash
rm -rf node_modules
pnpm install
```

### Problem: Build schlägt fehl mit "Gradle error"

**Lösung:**
```bash
# Gradle Cache löschen
cd android && ./gradlew clean
cd .. && eas build --platform android --clear-cache
```

### Problem: API Keys funktionieren nicht

**Lösung:**
1. Prüfe `.env` Datei
2. Prüfe Expo Secrets: `eas secret:list`
3. Stelle sicher, dass `dotenv` korrekt konfiguriert ist

### Problem: APK ist zu groß (>100MB)

**Lösung:**
1. Entferne ungenutzte Assets in `assets/`
2. Aktiviere Proguard (siehe Optimierungen)
3. Verwende AAB statt APK für Play Store

---

## Deployment Optionen

### Option 1: Direkter APK Download

- APK von EAS Build herunterladen
- Via Email/Link an Nutzer verteilen
- Installation erfordert "Unbekannte Quellen" aktiviert

### Option 2: Google Play Store (AAB)

```bash
# AAB statt APK bauen
eas build --platform android --profile production

# Zu Play Store hochladen
eas submit --platform android
```

### Option 3: Internal Testing (Firebase App Distribution)

```bash
# Firebase CLI installieren
npm install -g firebase-tools

# APK zu Firebase hochladen
firebase appdistribution:distribute \
  path/to/aether-trader.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

---

## Wichtige Hinweise

### Sandbox-Features die NICHT funktionieren:

❌ Python Scripts (`train-rl-model.py`, `fetch-historical-data.py`)
❌ Command-line Utilities (`manus-*`)
❌ Shell Commands in Code
❌ Server-seitige Features (wenn nicht deployed)

### Features die FUNKTIONIEREN:

✅ React Native/Expo App
✅ TensorFlow.js (ML im Browser/Mobile)
✅ Alpaca & Finnhub APIs
✅ AsyncStorage (lokale Daten)
✅ Push Notifications
✅ Genetic Algorithms (JavaScript)
✅ Transfer Learning (TensorFlow.js)

---

## Alternative: Web-Version Deployen

Falls APK-Build Probleme macht, kann die App auch als Progressive Web App (PWA) deployed werden:

```bash
# Web Build
npx expo export:web

# Deploy zu Vercel/Netlify
vercel deploy
# oder
netlify deploy
```

---

## Support & Dokumentation

- **Expo Docs:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **React Native:** https://reactnative.dev
- **TensorFlow.js:** https://www.tensorflow.org/js

---

## Zusammenfassung

1. Repository klonen
2. Dependencies installieren (`pnpm install`)
3. Sandbox-Features entfernen/ersetzen
4. Environment Variables konfigurieren
5. EAS Build konfigurieren (`eas build:configure`)
6. APK bauen (`eas build --platform android --profile production`)
7. APK herunterladen und auf Gerät installieren
8. Testen und optimieren

**Geschätzte Build-Zeit:** 15-30 Minuten (Cloud Build)

**Geschätzte APK-Größe:** 50-80 MB (optimiert)
