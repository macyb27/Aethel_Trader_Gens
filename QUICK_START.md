# 🚀 ÆTHER-TRADER Ω v4.0 - Sofort-Deployment

## ⚡ 30-Sekunden-Start

```bash
./deploy.sh
```

**Das war's!** Zugriff auf **http://localhost:8080**

---

## 📋 Vor dem ersten Start

### 1. API-Keys konfigurieren

```bash
# .env Datei editieren
nano .env
```

**Minimum-Konfiguration für Paper Trading:**
```env
ALPACA_API_KEY=pk_xxx...
ALPACA_API_SECRET=xxx...
ALPACA_BASE_URL=https://paper-api.alpaca.markets
FINNHUB_API_KEY=xxx...
```

### 2. Deployen

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Fertig!

- **Web App**: http://localhost:8080
- **API**: http://localhost:3000
- **Health**: http://localhost/health

---

## 🎯 Deployment-Methoden

### Methode 1: Lokales Docker (Empfohlen)

```bash
./deploy.sh          # Vollautomatisch
```

**Befehle:**
- `./deploy.sh` - Deploy
- `./deploy.sh logs` - Logs anzeigen
- `./deploy.sh status` - Status prüfen
- `./deploy.sh stop` - Stoppen
- `./deploy.sh restart` - Neustart
- `./deploy.sh clean` - Cleanup

### Methode 2: Docker Compose Manuell

```bash
docker-compose up -d
docker-compose logs -f
```

### Methode 3: GitHub Actions (Automatisch)

```bash
git push origin main
# Deployment erfolgt automatisch!
```

- **Docker Image**: `ghcr.io/macyb27/aethel_trader_gens:latest`
- **Cloudflare Pages**: Automatisch deployed

### Methode 4: Cloud Provider

**AWS ECS:**
```bash
# Siehe DEPLOYMENT.md für Details
aws ecr create-repository --repository-name aether-trader
docker build -t aether-trader .
# ... (siehe Doku)
```

**Google Cloud Run:**
```bash
gcloud builds submit --tag gcr.io/PROJECT/aether-trader
gcloud run deploy --image gcr.io/PROJECT/aether-trader
```

**Azure Container Instances:**
```bash
az container create --resource-group rg --name aether-trader --image ...
```

---

## 📊 Nach dem Deployment

### Zugriff prüfen

```bash
# Web Interface öffnen
open http://localhost:8080

# Health Check
curl http://localhost/health

# API testen
curl http://localhost:3000/api/health
```

### Logs überwachen

```bash
./deploy.sh logs
# oder
docker-compose logs -f aether-trader
```

### Status prüfen

```bash
./deploy.sh status
# oder
docker-compose ps
```

---

## ⚙️ Optionale Features

### Monitoring aktivieren

```bash
docker-compose --profile monitoring up -d
```

Zugriff:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### Datenbank-Zugriff

```bash
docker exec -it aether-postgres psql -U aether_admin -d aether_trader
```

### Redis-Zugriff

```bash
docker exec -it aether-redis redis-cli
```

---

## 🔒 Sicherheit

### API-Keys sicher speichern

```bash
# NIEMALS committen!
echo ".env" >> .gitignore

# Secrets in GitHub Actions:
# Settings > Secrets > New repository secret
```

### Firewall (Production)

```bash
# Nur nötige Ports öffnen
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🐛 Probleme?

### Container startet nicht

```bash
# Logs prüfen
./deploy.sh logs

# Neu starten
./deploy.sh clean
./deploy.sh deploy
```

### Port bereits belegt

```bash
# docker-compose.yml editieren
nano docker-compose.yml
# Ändere ports: "8081:80" statt "8080:80"
```

### Deployment fehlgeschlagen

```bash
# Cleanup und Neuversuch
./deploy.sh clean
docker system prune -a
./deploy.sh deploy
```

---

## 📚 Weitere Dokumentation

| Datei | Inhalt |
|-------|--------|
| `README_DEPLOYMENT.md` | Übersicht aller Deployment-Optionen |
| `DEPLOYMENT.md` | Detaillierte Anleitungen |
| `PRODUCTION_SETUP.md` | Produktions-Konfiguration |
| `README.md` | Projekt-Übersicht |
| `.github/workflows/` | CI/CD Pipelines |

---

## ✅ Deployment-Checkliste

- [ ] Repository geklont
- [ ] `.env` Datei konfiguriert (API-Keys)
- [ ] Docker installiert
- [ ] `./deploy.sh` ausgeführt
- [ ] http://localhost:8080 funktioniert
- [ ] Logs geprüft
- [ ] Paper Trading gestartet
- [ ] QA Bot Alerts überwacht

---

## ⚠️ WICHTIG

1. **Paper Trading zuerst!**
   - Minimum 14 Tage testen
   - Sharpe Ratio ≥ 1.5 erforderlich
   - Max Drawdown < 20%

2. **Niemals mehr investieren als Sie verlieren können**

3. **QA Bot Alerts ernst nehmen**

4. **Regelmäßige Backups erstellen**

---

## 🆘 Support

- **GitHub Issues**: [Issues](https://github.com/macyb27/Aethel_Trader_Gens/issues)
- **Logs**: `./deploy.sh logs`
- **Community**: r/algotrading

---

**Status:** ✅ PRODUCTION READY  
**Deployment-Zeit:** ~2 Minuten  
**Erste Trades:** Sofort nach API-Key-Konfiguration

🚀 **Los geht's!** `./deploy.sh`
