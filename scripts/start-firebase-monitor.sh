#!/bin/bash

# ===============================
# FIREBASE CREDENTIAL MONITOR DAEMON
# Start Firebase credential monitoring as background service
# ===============================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/.firebase-monitor.pid"
LOG_FILE="$PROJECT_DIR/firebase-monitor.log"

cd "$PROJECT_DIR"

# Function to check if monitor is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start the monitor
start_monitor() {
    if is_running; then
        echo "✅ Firebase monitor already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    echo "🔄 Starting Firebase credential monitor..."
    
    # Start the monitor in background
    nohup node scripts/firebase-auto-refresh.js start > "$LOG_FILE" 2>&1 &
    PID=$!
    
    # Save PID
    echo "$PID" > "$PID_FILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if is_running; then
        echo "✅ Firebase monitor started successfully (PID: $PID)"
        echo "📝 Logs: $LOG_FILE"
        echo "🔍 Status: Use 'npm run firebase:status' to check"
        return 0
    else
        echo "❌ Failed to start Firebase monitor"
        return 1
    fi
}

# Function to stop the monitor
stop_monitor() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo "🛑 Stopping Firebase monitor (PID: $PID)..."
        kill "$PID"
        rm -f "$PID_FILE"
        echo "✅ Firebase monitor stopped"
    else
        echo "⚠️ Firebase monitor not running"
    fi
}

# Function to show status
show_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo "✅ Firebase monitor is running (PID: $PID)"
        
        # Show recent logs
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "📝 Recent logs:"
            tail -n 10 "$LOG_FILE"
        fi
        
        # Show credential status if available
        if [ -f ".firebase-credential-status.json" ]; then
            echo ""
            echo "🔧 Credential status:"
            cat .firebase-credential-status.json | jq . 2>/dev/null || cat .firebase-credential-status.json
        fi
    else
        echo "❌ Firebase monitor not running"
    fi
}

# Function to restart the monitor
restart_monitor() {
    echo "🔄 Restarting Firebase monitor..."
    stop_monitor
    sleep 1
    start_monitor
}

# Main script logic
case "${1:-start}" in
    start)
        start_monitor
        ;;
    stop)
        stop_monitor
        ;;
    restart)
        restart_monitor
        ;;
    status)
        show_status
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "❌ Log file not found: $LOG_FILE"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start Firebase credential monitoring"
        echo "  stop    - Stop Firebase credential monitoring"
        echo "  restart - Restart Firebase credential monitoring"
        echo "  status  - Show current status"
        echo "  logs    - Show live logs"
        exit 1
        ;;
esac 