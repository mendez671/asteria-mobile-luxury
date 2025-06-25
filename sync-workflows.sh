#!/bin/bash

# ================================================================
# ASTERIA n8n WORKFLOW SYNC MANAGER
# ================================================================
# Created: December 9, 2024
# Purpose: Sync workflows between local n8n and cloud n8n
# Author: Asteria Development Team
# ================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_DIR="$SCRIPT_DIR"
LOCAL_N8N_URL="http://localhost:5678"
CLOUD_N8N_URL="https://app.n8n.cloud"  # Update with your subdomain
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/sync.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

info() {
    log "${BLUE}INFO: $1${NC}"
}

warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Create necessary directories
setup_directories() {
    info "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$WORKFLOW_DIR/local"
    mkdir -p "$WORKFLOW_DIR/cloud"
    mkdir -p "$WORKFLOW_DIR/exports"
    success "Directories created"
}

# Check if local n8n is running
check_local_n8n() {
    info "Checking local n8n connection..."
    if curl -s -f "$LOCAL_N8N_URL/healthz" > /dev/null 2>&1; then
        success "Local n8n is running"
        return 0
    else
        warning "Local n8n is not accessible at $LOCAL_N8N_URL"
        return 1
    fi
}

# Export workflows from local n8n
export_local_workflows() {
    info "Exporting workflows from local n8n..."
    
    if ! check_local_n8n; then
        error "Cannot export - local n8n is not running"
    fi
    
    # Create backup timestamp
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    EXPORT_DIR="$WORKFLOW_DIR/exports/local_$TIMESTAMP"
    mkdir -p "$EXPORT_DIR"
    
    # Export using docker exec (since we're using Docker n8n)
    docker exec asteria-n8n n8n export:workflow --all --output="$EXPORT_DIR" || {
        # Fallback: manual export via API if available
        warning "Docker export failed, attempting manual backup..."
        docker exec asteria-n8n cp -r /home/node/.n8n/workflows "$EXPORT_DIR/" 2>/dev/null || {
            warning "Manual workflow export not available - using database backup"
            # Create database backup instead
            docker exec asteria-n8n cp /home/node/.n8n/database.sqlite "$EXPORT_DIR/"
        }
    }
    
    success "Local workflows exported to $EXPORT_DIR"
    echo "$EXPORT_DIR"
}

# Import workflows to local n8n
import_to_local() {
    local WORKFLOW_FILE="$1"
    
    if [[ ! -f "$WORKFLOW_FILE" ]]; then
        error "Workflow file not found: $WORKFLOW_FILE"
    fi
    
    info "Importing workflow to local n8n: $(basename "$WORKFLOW_FILE")"
    
    # Method 1: Direct file copy (for JSON workflows)
    if [[ "$WORKFLOW_FILE" == *.json ]]; then
        info "Importing JSON workflow via curl..."
        
        # Read the JSON file and import via API
        WORKFLOW_DATA=$(cat "$WORKFLOW_FILE")
        IMPORT_RESPONSE=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$WORKFLOW_DATA" \
            "$LOCAL_N8N_URL/api/v1/workflows/import" 2>/dev/null || echo "")
        
        if [[ -n "$IMPORT_RESPONSE" ]]; then
            success "Workflow imported successfully"
        else
            warning "API import failed, trying manual method..."
            # Fallback: Copy to docker container
            docker cp "$WORKFLOW_FILE" asteria-n8n:/tmp/workflow.json
            docker exec asteria-n8n n8n import:workflow --input=/tmp/workflow.json
        fi
    fi
}

# Upload workflows to cloud n8n
upload_to_cloud() {
    local WORKFLOW_FILE="$1"
    
    info "Manual cloud upload required for: $(basename "$WORKFLOW_FILE")"
    warning "Automated cloud upload requires n8n Cloud API access"
    warning "Please manually import this workflow to your cloud instance:"
    warning "1. Open $CLOUD_N8N_URL"
    warning "2. Go to Workflows > Import"
    warning "3. Upload: $WORKFLOW_FILE"
    
    # Future enhancement: Add n8n Cloud API integration
    # This would require:
    # - n8n Cloud API key
    # - Cloud instance URL
    # - API endpoints for workflow import
}

# Backup current state
create_backup() {
    info "Creating backup..."
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BACKUP_FILE="$BACKUP_DIR/n8n_backup_$TIMESTAMP.tar.gz"
    
    # Backup local n8n data
    docker exec asteria-n8n tar -czf /tmp/backup.tar.gz -C /home/node/.n8n . 2>/dev/null
    docker cp asteria-n8n:/tmp/backup.tar.gz "$BACKUP_FILE"
    
    success "Backup created: $BACKUP_FILE"
    echo "$BACKUP_FILE"
}

# Sync specific workflow
sync_workflow() {
    local WORKFLOW_FILE="$1"
    local DIRECTION="$2"  # local-to-cloud or cloud-to-local
    
    case "$DIRECTION" in
        "local-to-cloud")
            info "Syncing workflow from local to cloud..."
            upload_to_cloud "$WORKFLOW_FILE"
            ;;
        "cloud-to-local")
            info "Syncing workflow from cloud to local..."
            import_to_local "$WORKFLOW_FILE"
            ;;
        *)
            error "Invalid sync direction. Use 'local-to-cloud' or 'cloud-to-local'"
            ;;
    esac
}

# Deploy all workflows
deploy_all() {
    info "Deploying all workflows from local to cloud..."
    
    # First, export everything from local
    EXPORT_DIR=$(export_local_workflows)
    
    # Then prepare for cloud upload
    warning "Ready for cloud deployment!"
    warning "Please manually upload these workflows to your cloud instance:"
    
    find "$EXPORT_DIR" -name "*.json" -type f | while read -r workflow; do
        warning "📁 $workflow"
    done
    
    warning "Upload instructions:"
    warning "1. Visit $CLOUD_N8N_URL"
    warning "2. Go to Workflows > Import"
    warning "3. Upload each JSON file above"
}

# Initialize git repository for version control
init_git() {
    info "Initializing git repository for workflow version control..."
    
    if [[ ! -d "$WORKFLOW_DIR/.git" ]]; then
        cd "$WORKFLOW_DIR"
        git init
        
        # Create .gitignore
        cat > .gitignore << 'EOF'
# Logs
*.log
sync.log

# Temporary files
*.tmp
*.temp

# Backup files
backups/
.DS_Store

# Environment files
.env
.env.local
EOF
        
        git add .gitignore
        git commit -m "Initial commit: n8n workflow repository"
        success "Git repository initialized"
    else
        info "Git repository already exists"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                     - Setup directories and initialize"
    echo "  backup                    - Create backup of current state"
    echo "  export                    - Export workflows from local n8n"
    echo "  import <file>             - Import workflow to local n8n"
    echo "  sync <file> <direction>   - Sync workflow (local-to-cloud|cloud-to-local)"
    echo "  deploy                    - Deploy all workflows to cloud"
    echo "  status                    - Show sync status"
    echo "  init-git                  - Initialize git repository"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 backup"
    echo "  $0 import asteria-main-orchestrator-v2.json"
    echo "  $0 sync workflow.json local-to-cloud"
    echo "  $0 deploy"
}

# Show status
show_status() {
    info "N8N Workflow Sync Status"
    echo "=========================="
    echo "📁 Workflow Directory: $WORKFLOW_DIR"
    echo "🔗 Local n8n: $LOCAL_N8N_URL"
    echo "☁️  Cloud n8n: $CLOUD_N8N_URL"
    echo ""
    
    # Check local n8n
    if check_local_n8n; then
        echo "✅ Local n8n: Running"
    else
        echo "❌ Local n8n: Not accessible"
    fi
    
    # Count workflows
    WORKFLOW_COUNT=$(find "$WORKFLOW_DIR" -name "*.json" -type f | wc -l)
    echo "📊 Workflow files: $WORKFLOW_COUNT"
    
    # Recent backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f 2>/dev/null | wc -l)
    echo "💾 Backups available: $BACKUP_COUNT"
    
    # Git status
    if [[ -d "$WORKFLOW_DIR/.git" ]]; then
        echo "📝 Git repository: Initialized"
    else
        echo "📝 Git repository: Not initialized"
    fi
}

# Main command handler
main() {
    case "${1:-}" in
        "setup")
            setup_directories
            init_git
            success "Setup complete!"
            ;;
        "backup")
            create_backup
            ;;
        "export")
            export_local_workflows
            ;;
        "import")
            [[ -z "$2" ]] && error "Please specify workflow file to import"
            import_to_local "$2"
            ;;
        "sync")
            [[ -z "$2" ]] && error "Please specify workflow file to sync"
            [[ -z "$3" ]] && error "Please specify sync direction"
            sync_workflow "$2" "$3"
            ;;
        "deploy")
            deploy_all
            ;;
        "status")
            show_status
            ;;
        "init-git")
            init_git
            ;;
        "help"|"--help"|"-h")
            usage
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# Initialize on first run
if [[ ! -d "$BACKUP_DIR" ]]; then
    info "First run detected - setting up..."
    setup_directories
fi

# Run main function
main "$@" 