#!/bin/bash
# Production n8n Deployment Script with SSL
# Created: December 8, 2024
# Purpose: Deploy secure n8n instance with HTTPS and reverse proxy

set -e  # Exit on any error

# Configuration
DOMAIN="n8n.thriveachievegrow.com"
EMAIL="admin@thriveachievegrow.com"  # For Let's Encrypt
N8N_VERSION="latest"
CONTAINER_NAME="asteria-n8n-prod"
N8N_PORT="5678"

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root for system configuration"
        print_status "Please run: sudo $0"
        exit 1
    fi
}

check_domain_dns() {
    print_status "Checking DNS configuration for $DOMAIN..."
    
    if nslookup $DOMAIN > /dev/null 2>&1; then
        SERVER_IP=$(curl -s ifconfig.me)
        DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -n1 | awk '{print $2}')
        
        if [[ "$SERVER_IP" == "$DOMAIN_IP" ]]; then
            print_success "DNS correctly points to this server"
        else
            print_warning "DNS may not point to this server. Server: $SERVER_IP, Domain: $DOMAIN_IP"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_error "Cannot resolve $DOMAIN. Please check DNS configuration."
        exit 1
    fi
}

install_dependencies() {
    print_status "Installing required packages..."
    
    # Update package list
    apt update
    
    # Install required packages
    apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose curl ufw
    
    # Start and enable services
    systemctl start nginx
    systemctl enable nginx
    systemctl start docker
    systemctl enable docker
    
    print_success "Dependencies installed successfully"
}

configure_firewall() {
    print_status "Configuring firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH (important!)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow specific IPs for n8n direct access if needed
    # ufw allow from YOUR_OFFICE_IP to any port 5678
    
    print_success "Firewall configured"
}

setup_ssl_certificate() {
    print_status "Setting up SSL certificate with Let's Encrypt..."
    
    # Stop nginx temporarily for standalone authentication
    systemctl stop nginx
    
    # Get SSL certificate
    certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN
    
    if [[ $? -eq 0 ]]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
    
    # Start nginx again
    systemctl start nginx
}

configure_nginx() {
    print_status "Configuring Nginx reverse proxy..."
    
    # Copy our nginx configuration
    cp nginx-n8n-ssl.conf /etc/nginx/sites-available/$DOMAIN
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    if [[ $? -eq 0 ]]; then
        print_success "Nginx configuration is valid"
        systemctl reload nginx
    else
        print_error "Nginx configuration error"
        exit 1
    fi
}

deploy_n8n_container() {
    print_status "Deploying n8n Docker container for production..."
    
    # Stop any existing container
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    # Create n8n data directory
    mkdir -p /opt/n8n-data
    chown -R 1000:1000 /opt/n8n-data
    
    # Deploy n8n container with production settings
    docker run -d --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p 127.0.0.1:$N8N_PORT:5678 \
        -v /opt/n8n-data:/home/node/.n8n \
        -e N8N_HOST=$DOMAIN \
        -e N8N_PORT=443 \
        -e N8N_PROTOCOL=https \
        -e WEBHOOK_URL=https://$DOMAIN \
        -e N8N_BASIC_AUTH_ACTIVE=true \
        -e N8N_BASIC_AUTH_USER=asteria \
        -e N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 32) \
        -e N8N_RUNNERS_ENABLED=true \
        -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
        -e N8N_LOG_LEVEL=info \
        $N8N_VERSION
    
    if [[ $? -eq 0 ]]; then
        print_success "n8n container deployed successfully"
    else
        print_error "Failed to deploy n8n container"
        exit 1
    fi
}

setup_ssl_renewal() {
    print_status "Setting up automatic SSL certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.daily/certbot-renewal << 'EOF'
#!/bin/bash
/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF
    
    chmod +x /etc/cron.daily/certbot-renewal
    
    # Test renewal process
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        print_success "SSL renewal configured successfully"
    else
        print_warning "SSL renewal test failed, but continuing..."
    fi
}

configure_monitoring() {
    print_status "Setting up basic monitoring..."
    
    # Create monitoring script
    cat > /opt/n8n-monitor.sh << 'EOF'
#!/bin/bash
# n8n Health Monitoring Script

CONTAINER_NAME="asteria-n8n-prod"
DOMAIN="n8n.thriveachievegrow.com"
LOG_FILE="/var/log/n8n-monitor.log"

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "$(date): n8n container not running, attempting restart" >> $LOG_FILE
    docker start $CONTAINER_NAME
fi

# Check HTTP response
if ! curl -s -f https://$DOMAIN/health > /dev/null; then
    echo "$(date): n8n not responding via HTTPS" >> $LOG_FILE
fi
EOF
    
    chmod +x /opt/n8n-monitor.sh
    
    # Add to crontab (check every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/n8n-monitor.sh") | crontab -
    
    print_success "Monitoring configured"
}

create_backup_script() {
    print_status "Creating backup script..."
    
    cat > /opt/n8n-backup.sh << 'EOF'
#!/bin/bash
# n8n Backup Script

BACKUP_DIR="/opt/backups/n8n"
DATE=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="asteria-n8n-prod"

mkdir -p $BACKUP_DIR

# Stop container for consistent backup
docker stop $CONTAINER_NAME

# Create backup
tar -czf $BACKUP_DIR/n8n_backup_$DATE.tar.gz -C /opt/n8n-data .

# Restart container
docker start $CONTAINER_NAME

# Keep only last 7 backups
find $BACKUP_DIR -name "n8n_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/n8n_backup_$DATE.tar.gz"
EOF
    
    chmod +x /opt/n8n-backup.sh
    
    # Add weekly backup to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/n8n-backup.sh") | crontab -
    
    print_success "Backup script created and scheduled"
}

show_deployment_summary() {
    print_success "🎉 n8n Production Deployment Complete!"
    echo
    print_status "=== Deployment Summary ==="
    echo -e "🌐 URL: ${GREEN}https://$DOMAIN${NC}"
    echo -e "👤 Username: ${GREEN}asteria${NC}"
    echo -e "🔑 Password: ${GREEN}Check container logs for generated password${NC}"
    echo -e "📦 Container: ${GREEN}$CONTAINER_NAME${NC}"
    echo -e "📁 Data: ${GREEN}/opt/n8n-data${NC}"
    echo -e "🔒 SSL: ${GREEN}Let's Encrypt (auto-renewal enabled)${NC}"
    echo -e "🛡️ Security: ${GREEN}Nginx reverse proxy, rate limiting, security headers${NC}"
    echo
    print_status "=== Management Commands ==="
    echo "• Check status: docker ps | grep $CONTAINER_NAME"
    echo "• View logs: docker logs $CONTAINER_NAME"
    echo "• Restart: docker restart $CONTAINER_NAME"
    echo "• Backup: /opt/n8n-backup.sh"
    echo "• Monitor: tail -f /var/log/n8n-monitor.log"
    echo
    print_status "=== Next Steps ==="
    echo "1. Get the generated password: docker logs $CONTAINER_NAME | grep -i password"
    echo "2. Login to https://$DOMAIN"
    echo "3. Configure IP whitelist in /etc/nginx/sites-available/$DOMAIN if needed"
    echo "4. Set up webhooks for Asteria integration"
    echo "5. Test the deployment with: curl -I https://$DOMAIN"
}

# Main deployment process
main() {
    print_status "🚀 Starting n8n Production Deployment..."
    print_status "Domain: $DOMAIN"
    print_status "Email: $EMAIL"
    echo
    
    # Confirmation prompt
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_root
    check_domain_dns
    install_dependencies
    configure_firewall
    setup_ssl_certificate
    configure_nginx
    deploy_n8n_container
    setup_ssl_renewal
    configure_monitoring
    create_backup_script
    
    # Show summary
    show_deployment_summary
}

# Execute main function
main "$@" 