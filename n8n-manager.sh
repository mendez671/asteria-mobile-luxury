#!/bin/bash
# n8n Docker Management Script for Asteria Integration
# Created: December 8, 2024

CONTAINER_NAME="asteria-n8n"
IMAGE_NAME="n8nio/n8n"
PORT="5678"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

start_n8n() {
    print_status "Starting n8n container..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_warning "Container $CONTAINER_NAME is already running"
        return 0
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Starting existing container..."
        docker start $CONTAINER_NAME
    else
        print_status "Creating new container..."
        docker run -d --name $CONTAINER_NAME \
            -p $PORT:$PORT \
            -v ~/.n8n:/home/node/.n8n \
            --env-file n8n-docker-config.env \
            $IMAGE_NAME
    fi
    
    if [ $? -eq 0 ]; then
        print_success "n8n container started successfully"
        print_status "n8n is accessible at: http://localhost:$PORT"
        print_status "Username: asteria"
        print_status "Password: asteria2024!"
    else
        print_error "Failed to start n8n container"
        return 1
    fi
}

stop_n8n() {
    print_status "Stopping n8n container..."
    docker stop $CONTAINER_NAME
    if [ $? -eq 0 ]; then
        print_success "n8n container stopped successfully"
    else
        print_error "Failed to stop n8n container"
        return 1
    fi
}

restart_n8n() {
    print_status "Restarting n8n container..."
    stop_n8n
    sleep 2
    start_n8n
}

status_n8n() {
    print_status "Checking n8n container status..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_success "Container $CONTAINER_NAME is running"
        docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo
        print_status "Testing connectivity..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
            print_success "n8n is accessible at: http://localhost:$PORT"
        else
            print_warning "n8n container is running but not responding on port $PORT"
        fi
    else
        print_warning "Container $CONTAINER_NAME is not running"
    fi
}

logs_n8n() {
    print_status "Showing n8n container logs..."
    docker logs -f $CONTAINER_NAME
}

remove_n8n() {
    print_warning "This will permanently remove the n8n container (data will be preserved)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop $CONTAINER_NAME 2>/dev/null
        docker rm $CONTAINER_NAME
        print_success "n8n container removed"
    else
        print_status "Operation cancelled"
    fi
}

backup_n8n() {
    print_status "Creating backup of n8n data..."
    BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="n8n_backup_$BACKUP_DATE.tar.gz"
    
    tar -czf $BACKUP_FILE -C ~/.n8n .
    if [ $? -eq 0 ]; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_error "Failed to create backup"
        return 1
    fi
}

show_help() {
    echo "n8n Docker Management Script for Asteria Integration"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start     Start n8n container"
    echo "  stop      Stop n8n container"
    echo "  restart   Restart n8n container"
    echo "  status    Show container status and connectivity"
    echo "  logs      Show container logs (follow mode)"
    echo "  backup    Create backup of n8n data"
    echo "  remove    Remove n8n container (keeps data)"
    echo "  help      Show this help message"
    echo
    echo "Access n8n at: http://localhost:$PORT"
    echo "Username: asteria"
    echo "Password: asteria2024!"
}

# Main script logic
case "$1" in
    start)
        start_n8n
        ;;
    stop)
        stop_n8n
        ;;
    restart)
        restart_n8n
        ;;
    status)
        status_n8n
        ;;
    logs)
        logs_n8n
        ;;
    backup)
        backup_n8n
        ;;
    remove)
        remove_n8n
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac 