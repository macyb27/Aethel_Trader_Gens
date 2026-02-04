# ÆTHER-TRADER Ω v4.0 - Deployment-Anleitung

## 🚀 Schnellstart

### Option 1: Docker Compose (Empfohlen)

```bash
# 1. Repository klonen
git clone https://github.com/macyb27/Aethel_Trader_Gens.git
cd Aethel_Trader_Gens

# 2. Environment-Variablen konfigurieren
cp .env.example .env
nano .env  # API-Keys eintragen

# 3. Starten
docker-compose up -d

# 4. Zugriff
# Web Interface: http://localhost:8080
# API Server: http://localhost:3000
```

### Option 2: Standalone Docker

```bash
# Build
docker build -t aether-trader .

# Run
docker run -d \
  -p 8080:80 \
  -p 3000:3000 \
  --env-file .env \
  --name aether-trader \
  aether-trader
```

### Option 3: Lokale Entwicklung

```bash
# Web App
npm install
npm run dev

# Mobile API (separates Terminal)
cd mobile
pnpm install
pnpm run dev
```

## 📦 Docker Hub Deployment

### Image veröffentlichen

```bash
# Login
docker login

# Build und Push
docker build -t yourusername/aether-trader:latest .
docker push yourusername/aether-trader:latest
```

### Image verwenden

```bash
docker pull yourusername/aether-trader:latest
docker run -d -p 8080:80 -p 3000:3000 --env-file .env yourusername/aether-trader:latest
```

## 🌐 Cloudflare Pages Deployment

### Automatisches Deployment (GitHub Actions)

1. **GitHub Secrets konfigurieren:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **Push zu main branch:**
```bash
git push origin main
```

3. **Deployment wird automatisch gestartet**

### Manuelles Deployment

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
npm run build
wrangler pages deploy dist --project-name aether-trader-omega
```

## ☁️ Cloud Provider Deployment

### AWS ECS

```bash
# 1. ECR Repository erstellen
aws ecr create-repository --repository-name aether-trader

# 2. Image bauen und pushen
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1.amazonaws.com
docker build -t aether-trader .
docker tag aether-trader:latest <account-id>.dkr.ecr.eu-central-1.amazonaws.com/aether-trader:latest
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/aether-trader:latest

# 3. ECS Task Definition und Service erstellen (via AWS Console oder CLI)
```

### Google Cloud Run

```bash
# 1. Projekt einrichten
gcloud config set project YOUR_PROJECT_ID

# 2. Container bauen und deployen
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/aether-trader
gcloud run deploy aether-trader \
  --image gcr.io/YOUR_PROJECT_ID/aether-trader \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# 1. Container Registry
az acr create --resource-group myResourceGroup --name aethertrader --sku Basic
az acr login --name aethertrader

# 2. Build und Push
docker build -t aethertrader.azurecr.io/aether-trader:latest .
docker push aethertrader.azurecr.io/aether-trader:latest

# 3. Deploy
az container create \
  --resource-group myResourceGroup \
  --name aether-trader \
  --image aethertrader.azurecr.io/aether-trader:latest \
  --dns-name-label aether-trader \
  --ports 80 3000
```

## 🔧 Production Konfiguration

### Umgebungsvariablen

Minimale Konfiguration:
```env
NODE_ENV=production
ALPACA_API_KEY=your_key
ALPACA_API_SECRET=your_secret
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

Vollständige Konfiguration siehe `.env.example`

### SSL/HTTPS mit Let's Encrypt

```bash
# Nginx Reverse Proxy mit SSL
docker run -d \
  -p 80:80 -p 443:443 \
  --name nginx-proxy \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  -v certs:/etc/nginx/certs \
  nginxproxy/nginx-proxy

docker run -d \
  --name letsencrypt \
  --volumes-from nginx-proxy \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  nginxproxy/acme-companion
```

### Monitoring Setup

```bash
# Mit Prometheus und Grafana
docker-compose --profile monitoring up -d

# Zugriff:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

## 🔒 Sicherheit

### Firewall-Regeln

```bash
# Nur notwendige Ports öffnen
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH
ufw enable
```

### API-Keys Rotation

```bash
# API-Keys regelmäßig erneuern
# 1. Neue Keys in Exchange-Dashboard generieren
# 2. .env aktualisieren
# 3. Container neu starten
docker-compose restart
```

## 📊 Health Checks

```bash
# Application Health
curl http://localhost/health

# API Server Health
curl http://localhost:3000/api/health

# Docker Container Status
docker ps
docker logs aether-trader-app
```

## 🔄 Updates und Rollbacks

### Update auf neue Version

```bash
# Pull neuste Version
git pull origin main

# Rebuild und restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Rollback

```bash
# Zu vorheriger Version zurück
docker-compose down
git checkout <previous-commit-hash>
docker-compose up -d
```

## 📈 Skalierung

### Horizontal Scaling (mehrere Instanzen)

```yaml
# docker-compose.yml
services:
  aether-trader:
    deploy:
      replicas: 3
```

### Load Balancer (Nginx)

```nginx
upstream aether_backend {
    least_conn;
    server aether-trader-1:80;
    server aether-trader-2:80;
    server aether-trader-3:80;
}

server {
    listen 80;
    location / {
        proxy_pass http://aether_backend;
    }
}
```

## 🐛 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs aether-trader

# Detaillierte Logs
docker logs -f aether-trader-app

# Container Shell
docker exec -it aether-trader-app sh
```

### Port bereits belegt

```bash
# Ports in docker-compose.yml ändern
ports:
  - "8081:80"   # statt 8080
  - "3001:3000" # statt 3000
```

### Datenbank-Verbindungsprobleme

```bash
# PostgreSQL Status prüfen
docker exec aether-postgres pg_isready

# Verbindung testen
docker exec -it aether-postgres psql -U aether_admin -d aether_trader
```

## 📚 Weitere Ressourcen

- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Detaillierte Setup-Anleitung
- [README.md](./README.md) - Projekt-Übersicht
- [GitHub Actions](./.github/workflows/) - CI/CD Pipelines

## 🆘 Support

Bei Problemen:
1. [GitHub Issues](https://github.com/macyb27/Aethel_Trader_Gens/issues)
2. Logs prüfen: `docker-compose logs`
3. Health Checks durchführen
4. Community: r/algotrading

---

**Status:** ✅ Production Ready
**Version:** 4.0.0
**Letzte Aktualisierung:** 2026-02-04
