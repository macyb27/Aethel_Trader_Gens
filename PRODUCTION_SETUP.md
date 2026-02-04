# ÆTHER-TRADER Ω v4.0 - Production Setup Guide

## 🚀 Production Deployment Checklist

### 1. Environment Variables Setup

#### Required API Keys
1. **Alpaca** (Stock Trading)
   - Sign up at https://alpaca.markets/
   - Get API Key and Secret
   - Set `ALPACA_BASE_URL` to paper-api for testing, api.alpaca.markets for live

2. **Finnhub** (Market Data & News)
   - Sign up at https://finnhub.io/
   - Get free API key
   - Rate limit: 60 calls/minute on free tier

3. **Coinbase Advanced Trade** (Cryptocurrency)
   - Sign up at https://www.coinbase.com/
   - Create API key with trade permissions
   - Whitelist IP addresses if needed

4. **Kraken** (Cryptocurrency)
   - Sign up at https://www.kraken.com/
   - Generate API key with trade permissions
   - Set appropriate rate limits

5. **Bybit** (Crypto Derivatives)
   - Sign up at https://www.bybit.com/
   - Generate API key
   - Start with testnet for paper trading

6. **Supabase** (Database)
   - Sign up at https://supabase.com/
   - Create new project
   - Get URL and anon key

#### Setup Steps
```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env  # or use your preferred editor
```

### 2. Risk Management Configuration

⚠️ **CRITICAL**: Always start with paper trading!

#### Default Risk Limits (Configurable via .env)
- `MAX_LOSS_PER_TRADE=1.0` (1% max loss per trade)
- `MAX_POSITION_SIZE=5.0` (5% max position size)
- `MAX_DRAWDOWN=10.0` (10% max portfolio drawdown)
- `STOP_LOSS_PERCENT=1.0` (1% stop loss)

### 3. Installation

#### Root Project (Tauri Desktop App)
```bash
npm install
npm run typecheck  # Check for TypeScript errors
npm run build      # Build for production
```

#### Mobile App
```bash
cd mobile
pnpm install
pnpm run typecheck
pnpm run build
```

### 4. Testing Strategy

#### Phase 1: Paper Trading (Minimum 14 days)
```bash
# Set environment to paper trading
export ALPACA_BASE_URL=https://paper-api.alpaca.markets
export NODE_ENV=development

# Run the app
npm run dev
```

#### Phase 2: Validation Requirements
- ✅ Sharpe Ratio ≥ 1.5
- ✅ Max Drawdown < 20%
- ✅ Win Rate ≥ 50%
- ✅ Minimum 50 trades
- ✅ Minimum 14 days of trading

#### Phase 3: Live Trading (After Validation)
```bash
# Switch to live API
export ALPACA_BASE_URL=https://api.alpaca.markets
export NODE_ENV=production

# Start with minimal capital
npm run build
npm run preview
```

### 5. Deployment Options

#### Option A: Cloudflare Pages (Web App)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run deploy
```

#### Option B: Tauri Desktop App
```bash
# Build desktop app
npm run tauri:build

# Outputs to src-tauri/target/release/
```

#### Option C: Docker (Self-Hosted)
```bash
# Build Docker image
docker build -t aether-trader .

# Run container
docker run -p 3000:3000 --env-file .env aether-trader
```

### 6. Mobile App Deployment

#### iOS
```bash
cd mobile
eas build --platform ios
eas submit --platform ios
```

#### Android
```bash
cd mobile
eas build --platform android
eas submit --platform android
```

### 7. Monitoring & Alerts

#### QA Bot Alerts
The QA Bot automatically monitors:
- Risk violations
- High volatility (VIX > 30)
- Market hours compliance
- Position size limits
- Drawdown thresholds

#### Emergency Halt
```typescript
import { orchestrator } from './lib/agents/orchestrator';

// Manual emergency stop
orchestrator.emergencyHalt("Market conditions unsafe");
```

### 8. Security Checklist

- [ ] All API keys stored in environment variables (never in code)
- [ ] `.env` file added to `.gitignore`
- [ ] HTTPS enabled for all connections
- [ ] Rate limiting configured
- [ ] IP whitelisting enabled (where supported)
- [ ] Two-factor authentication enabled on exchange accounts
- [ ] API keys have minimal permissions (read + trade only, no withdrawals)
- [ ] Secrets stored in Cursor Cloud Agent Dashboard
- [ ] Regular security audits scheduled

### 9. Performance Optimization

#### Web App
- Vite build with code splitting
- Three.js chunks loaded separately
- Service worker for offline functionality
- CDN caching via Cloudflare

#### Desktop App
- Rust backend for high performance
- SQLite for local data storage
- WebSocket connections for real-time data
- Hardware acceleration for 3D rendering

### 10. Backup & Recovery

#### Database Backups
```bash
# Automated daily backups via Supabase
# Manual backup
supabase db dump > backup-$(date +%Y%m%d).sql
```

#### Strategy DNA Backups
```bash
# Export strategy genomes
curl https://your-api.com/api/genome/export > strategies-backup.json
```

### 11. Legal & Compliance

⚠️ **DISCLAIMER**: This software is for educational and research purposes only.

- Trading involves substantial risk of loss
- Past performance does not guarantee future results
- Always start with paper trading
- Never invest more than you can afford to lose
- Consult with a financial advisor before live trading
- Ensure compliance with local securities regulations

### 12. Support & Resources

- **Documentation**: See README.md and ARCHITECTURE.md
- **Issues**: GitHub Issues
- **Community**: r/algotrading
- **Updates**: Check for latest releases

## 🎯 Quick Start Commands

```bash
# Development
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Deploy to Cloudflare
npm run deploy

# Desktop app
npm run tauri:dev
npm run tauri:build

# Mobile app
cd mobile && pnpm dev

# Run tests
cd mobile && pnpm test
```

## 📊 System Status Dashboard

Monitor your trading system at:
- **Web App**: https://your-domain.com
- **API Health**: https://your-domain.com/api/health
- **Metrics**: View in Supabase Dashboard

## 🔥 Emergency Contacts

In case of critical issues:
1. Stop all trading immediately via emergency halt
2. Check QA Bot logs for violations
3. Review recent trades and positions
4. Contact your exchange support if needed

---

**Built with**: Solid.js, Tauri, React Native, TypeScript, Rust, Python
**Version**: 4.0.0
**Last Updated**: 2026-02-04
