#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# ÆTHER-TRADER Ω v4.0 - Deployment Script
# Quick deployment script for production
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  ÆTHER-TRADER Ω v4.0 - Deployment Script"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "docker-compose not found, trying docker compose..."
        if ! docker compose version &> /dev/null; then
            print_error "Neither docker-compose nor 'docker compose' is available."
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    print_success "All dependencies found"
}

check_env_file() {
    print_info "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_info "Please edit .env file and add your API keys"
            print_warning "IMPORTANT: Configure at least ALPACA_API_KEY and FINNHUB_API_KEY"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success "Environment file found"
    fi
}

build_docker_image() {
    print_info "Building Docker image..."
    
    docker build -t aether-trader:latest . || {
        print_error "Docker build failed"
        exit 1
    }
    
    print_success "Docker image built successfully"
}

start_services() {
    print_info "Starting services with Docker Compose..."
    
    $COMPOSE_CMD up -d || {
        print_error "Failed to start services"
        exit 1
    }
    
    print_success "Services started successfully"
}

show_status() {
    print_info "Checking service status..."
    echo ""
    $COMPOSE_CMD ps
    echo ""
}

wait_for_health() {
    print_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost/health &> /dev/null; then
            print_success "Application is healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_warning "Health check timeout. Services might still be starting..."
    print_info "Check logs with: $COMPOSE_CMD logs"
}

show_deployment_info() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🚀 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📊 Access Points:${NC}"
    echo "  • Web Interface:  http://localhost:8080"
    echo "  • API Server:     http://localhost:3000"
    echo "  • Health Check:   http://localhost/health"
    echo ""
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo "  • View logs:      $COMPOSE_CMD logs -f"
    echo "  • Stop services:  $COMPOSE_CMD down"
    echo "  • Restart:        $COMPOSE_CMD restart"
    echo "  • Shell access:   docker exec -it aether-trader-app sh"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
    echo "  • Start with Paper Trading (ALPACA_BASE_URL=https://paper-api.alpaca.markets)"
    echo "  • Test for at least 14 days before going live"
    echo "  • Monitor QA Bot alerts regularly"
    echo "  • Never invest more than you can afford to lose"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "  • Deployment Guide:  DEPLOYMENT.md"
    echo "  • Production Setup:  PRODUCTION_SETUP.md"
    echo "  • Project README:    README.md"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
}

cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    $COMPOSE_CMD down 2>/dev/null || true
    exit 1
}

# Main deployment flow
main() {
    print_header
    
    # Set trap for cleanup on error
    trap cleanup_on_error ERR
    
    # Deployment steps
    check_dependencies
    check_env_file
    build_docker_image
    start_services
    show_status
    wait_for_health
    show_deployment_info
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    stop)
        print_info "Stopping services..."
        $COMPOSE_CMD down
        print_success "Services stopped"
        ;;
    restart)
        print_info "Restarting services..."
        $COMPOSE_CMD restart
        print_success "Services restarted"
        ;;
    logs)
        $COMPOSE_CMD logs -f
        ;;
    status)
        show_status
        ;;
    clean)
        print_warning "This will remove all containers and volumes!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            $COMPOSE_CMD down -v
            docker rmi aether-trader:latest 2>/dev/null || true
            print_success "Cleanup complete"
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and deploy the application (default)"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show and follow logs"
        echo "  status   - Show service status"
        echo "  clean    - Remove all containers and images"
        exit 1
        ;;
esac
