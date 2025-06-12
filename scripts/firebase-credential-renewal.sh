#!/bin/bash

# ===============================
# FIREBASE CREDENTIAL RENEWAL SYSTEM
# Handles automatic Firebase authentication renewal
# ===============================

PROJECT_ID="tag-inner-circle-v01"
SERVICE_ACCOUNT_EMAIL="firebase-adminsdk-fbsvc@tag-inner-circle-v01.iam.gserviceaccount.com"
KEY_FILE_PATH="/Users/mndst/Documents/AI_and_Tools/tag-inner-circle-v01-firebase-adminsdk-fbsvc-99620828bd.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if gcloud is installed and authenticated
check_gcloud() {
    log "Checking gcloud configuration..."
    
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI not found. Please install Google Cloud SDK"
        return 1
    fi
    
    # Check current auth status
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
    
    if [ -z "$CURRENT_ACCOUNT" ]; then
        warn "No active gcloud account found"
        return 1
    fi
    
    success "gcloud authenticated as: $CURRENT_ACCOUNT"
    return 0
}

# Authenticate with gcloud
authenticate_gcloud() {
    log "Authenticating with Google Cloud..."
    
    # Try application default credentials first
    if gcloud auth application-default login --no-launch-browser 2>/dev/null; then
        success "Application default credentials refreshed"
        return 0
    fi
    
    # Fallback to regular auth
    if gcloud auth login --no-launch-browser; then
        success "gcloud authentication successful"
        
        # Set application default credentials
        if gcloud auth application-default login --no-launch-browser; then
            success "Application default credentials set"
            return 0
        fi
    fi
    
    error "Failed to authenticate with gcloud"
    return 1
}

# Generate new service account key
generate_new_key() {
    log "Generating new service account key..."
    
    # Set the project
    gcloud config set project "$PROJECT_ID"
    
    # Generate new key file
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    NEW_KEY_FILE="./firebase-service-account-${TIMESTAMP}.json"
    
    if gcloud iam service-accounts keys create "$NEW_KEY_FILE" --iam-account="$SERVICE_ACCOUNT_EMAIL"; then
        success "New service account key generated: $NEW_KEY_FILE"
        
        # Update environment variable
        update_env_credentials "$NEW_KEY_FILE"
        
        # Archive old key file
        if [ -f "$KEY_FILE_PATH" ]; then
            cp "$KEY_FILE_PATH" "${KEY_FILE_PATH}.backup.${TIMESTAMP}"
            log "Old key file backed up"
        fi
        
        # Replace old key file
        cp "$NEW_KEY_FILE" "$KEY_FILE_PATH"
        success "Service account key updated"
        
        return 0
    else
        error "Failed to generate new service account key"
        return 1
    fi
}

# Update environment credentials
update_env_credentials() {
    local new_file="$1"
    log "Updating environment credentials..."
    
    # Update .env.local
    if [ -f ".env.local" ]; then
        # Remove existing GOOGLE_APPLICATION_CREDENTIALS line
        grep -v "GOOGLE_APPLICATION_CREDENTIALS=" .env.local > .env.local.tmp
        mv .env.local.tmp .env.local
    fi
    
    # Add new credentials path
    echo "GOOGLE_APPLICATION_CREDENTIALS=\"$new_file\"" >> .env.local
    success "Environment credentials updated"
}

# Test Firebase connectivity
test_firebase_connection() {
    log "Testing Firebase connectivity..."
    
    # Use Node.js to test the connection
    node -e "
    const admin = require('firebase-admin');
    const fs = require('fs');
    
    async function testConnection() {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync('$KEY_FILE_PATH', 'utf8'));
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: '$PROJECT_ID'
            });
            
            const db = admin.firestore();
            await db.collection('_health_check').limit(1).get();
            
            console.log('✅ Firebase connection successful');
            process.exit(0);
        } catch (error) {
            console.error('❌ Firebase connection failed:', error.message);
            process.exit(1);
        }
    }
    
    testConnection();
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        success "Firebase connectivity test passed"
        return 0
    else
        error "Firebase connectivity test failed"
        return 1
    fi
}

# Set up automatic renewal cron job
setup_auto_renewal() {
    log "Setting up automatic credential renewal..."
    
    SCRIPT_PATH="$(realpath "$0")"
    CRON_JOB="0 */12 * * * $SCRIPT_PATH renew >> $(pwd)/firebase-credential.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
        warn "Cron job already exists"
    else
        # Add cron job
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        success "Automatic renewal cron job added (every 12 hours)"
    fi
    
    log "Current cron jobs:"
    crontab -l 2>/dev/null | grep -v "^#" || echo "No cron jobs found"
}

# Remove automatic renewal
remove_auto_renewal() {
    log "Removing automatic credential renewal..."
    
    SCRIPT_PATH="$(realpath "$0")"
    
    # Remove cron job
    crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
    success "Automatic renewal cron job removed"
}

# Full renewal process
renew_credentials() {
    log "Starting Firebase credential renewal process..."
    
    # Step 1: Check gcloud
    if ! check_gcloud; then
        log "Attempting to authenticate gcloud..."
        if ! authenticate_gcloud; then
            error "Failed to authenticate gcloud. Manual intervention required."
            return 1
        fi
    fi
    
    # Step 2: Generate new key
    if ! generate_new_key; then
        error "Failed to generate new service account key"
        return 1
    fi
    
    # Step 3: Test connection
    if ! test_firebase_connection; then
        error "New credentials failed connectivity test"
        return 1
    fi
    
    success "Firebase credential renewal completed successfully!"
    
    # Restart any Firebase-dependent services
    log "Restarting development server to apply new credentials..."
    if pgrep -f "next dev" > /dev/null; then
        pkill -f "next dev"
        warn "Development server stopped. Please restart with 'npm run dev'"
    fi
    
    return 0
}

# Monitor and auto-renew based on error patterns
monitor_and_renew() {
    log "Monitoring Firebase credentials for expiration..."
    
    # Check for recent auth errors in logs
    if [ -f "firebase-credential.log" ]; then
        RECENT_ERRORS=$(tail -n 100 firebase-credential.log | grep -c "invalid_grant\|reauth\|expired" || echo "0")
        
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            warn "Detected $RECENT_ERRORS recent authentication errors"
            log "Attempting automatic renewal..."
            
            if renew_credentials; then
                success "Automatic renewal successful"
                return 0
            else
                error "Automatic renewal failed"
                return 1
            fi
        fi
    fi
    
    # Test current credentials
    if ! test_firebase_connection; then
        warn "Current credentials failing, attempting renewal..."
        renew_credentials
    else
        success "Current credentials are working"
    fi
}

# Main script logic
case "${1:-help}" in
    renew)
        renew_credentials
        ;;
    test)
        test_firebase_connection
        ;;
    monitor)
        monitor_and_renew
        ;;
    setup-auto)
        setup_auto_renewal
        ;;
    remove-auto)
        remove_auto_renewal
        ;;
    auth)
        authenticate_gcloud
        ;;
    status)
        check_gcloud
        test_firebase_connection
        ;;
    help|*)
        echo "🔥 Firebase Credential Renewal System"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  renew      - Renew Firebase credentials"
        echo "  test       - Test current Firebase connectivity"
        echo "  monitor    - Monitor and auto-renew if needed"
        echo "  setup-auto - Set up automatic renewal (every 12 hours)"
        echo "  remove-auto- Remove automatic renewal"
        echo "  auth       - Authenticate with gcloud"
        echo "  status     - Show current status"
        echo "  help       - Show this help"
        echo ""
        echo "Configuration:"
        echo "  Project ID: $PROJECT_ID"
        echo "  Service Account: $SERVICE_ACCOUNT_EMAIL"
        echo "  Key File: $KEY_FILE_PATH"
        ;;
esac 