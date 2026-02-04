# ═══════════════════════════════════════════════════════════════════════════
# ÆTHER-TRADER Ω v4.0 - Production Dockerfile
# Multi-stage build for optimized production deployment
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build Web Application
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS web-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Build Mobile API Server
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS mobile-builder

WORKDIR /app/mobile

# Install pnpm
RUN npm install -g pnpm@9.12.0

# Copy mobile package files
COPY mobile/package.json mobile/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy mobile source
COPY mobile/ ./

# Build the server
RUN pnpm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Production Runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install production dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    python3 \
    py3-pip && \
    pip3 install --no-cache-dir yfinance pandas numpy

WORKDIR /app

# Copy web build artifacts
COPY --from=web-builder /app/dist /usr/share/nginx/html

# Copy mobile server build
COPY --from=mobile-builder /app/mobile/dist /app/mobile/dist
COPY --from=mobile-builder /app/mobile/node_modules /app/mobile/node_modules
COPY --from=mobile-builder /app/mobile/package.json /app/mobile/

# Copy Python scripts
COPY mobile/scripts/*.py /app/scripts/

# Copy services
COPY services /app/services

# Create nginx configuration
RUN mkdir -p /etc/nginx/conf.d
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    
    # Web App
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
    
    # API Proxy to Mobile Server
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:3000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create supervisor configuration
RUN mkdir -p /etc/supervisor/conf.d
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:mobile-api]
command=node /app/mobile/dist/index.js
directory=/app/mobile
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production"
EOF

# Create startup script
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting ÆTHER-TRADER Ω v4.0..."

# Check required environment variables
if [ -z "$ALPACA_API_KEY" ]; then
    echo "⚠️  Warning: ALPACA_API_KEY not set. Using simulated mode."
fi

if [ -z "$FINNHUB_API_KEY" ]; then
    echo "⚠️  Warning: FINNHUB_API_KEY not set. News features will be limited."
fi

# Start supervisor to manage all services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Start application
CMD ["/app/start.sh"]
