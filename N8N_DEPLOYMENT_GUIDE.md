# n8n Deployment Guide for Asteria Integration

## 🎯 Overview
This guide provides complete deployment options for n8n workflow automation platform, from local development to enterprise production deployment with security.

---

## 🏠 **LOCAL DEVELOPMENT DEPLOYMENT**

### Quick Start (Already Configured)
```bash
# Start local n8n instance
./n8n-manager.sh start

# Access local interface
http://localhost:5678
Username: asteria
Password: asteria2024!

# Run integration tests
node test-n8n-integration.js
```

### Local Environment Features
- ✅ **Docker Container**: Isolated n8n instance
- ✅ **Basic Authentication**: Secure local access
- ✅ **Data Persistence**: Workflows saved in ~/.n8n
- ✅ **Management Scripts**: Full container lifecycle management
- ✅ **Integration Testing**: Comprehensive validation suite

### Local Management Commands
```bash
./n8n-manager.sh status    # Check container status
./n8n-manager.sh stop      # Stop container
./n8n-manager.sh restart   # Restart container
./n8n-manager.sh logs      # View container logs
./n8n-manager.sh backup    # Create data backup
./n8n-manager.sh help      # Show all commands
```

---

## 🌐 **PRODUCTION DEPLOYMENT**

### Prerequisites
1. **Server Requirements**:
   - Ubuntu/Debian server with root access
   - Domain name pointed to server IP
   - Ports 80, 443, and 22 accessible

2. **DNS Configuration**:
   ```bash
   # Ensure domain points to your server
   n8n.thriveachievegrow.com → YOUR_SERVER_IP
   ```

### 🚀 One-Command Production Deployment
```bash
# Deploy complete production infrastructure
sudo ./deploy-n8n-production.sh
```

### Production Deployment Includes
- ✅ **SSL/TLS Encryption**: Let's Encrypt certificates with auto-renewal
- ✅ **Nginx Reverse Proxy**: Enterprise-grade proxy with security headers
- ✅ **Rate Limiting**: DDoS protection and abuse prevention
- ✅ **Firewall Configuration**: UFW security with port management
- ✅ **Automated Monitoring**: Health checks and auto-restart capabilities
- ✅ **Backup System**: Weekly automated backups with retention
- ✅ **Security Headers**: Complete OWASP-recommended security implementation

### Manual Production Setup Steps

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nginx certbot python3-certbot-nginx docker.io ufw curl
```

#### 2. Domain & SSL Setup
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Get SSL certificate
sudo certbot certonly --standalone --email admin@thriveachievegrow.com \
  --agree-tos --domains n8n.thriveachievegrow.com
```

#### 3. Nginx Configuration
```bash
# Copy nginx configuration
sudo cp nginx-n8n-ssl.conf /etc/nginx/sites-available/n8n.thriveachievegrow.com

# Enable site
sudo ln -sf /etc/nginx/sites-available/n8n.thriveachievegrow.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. n8n Container Deployment
```bash
# Create data directory
sudo mkdir -p /opt/n8n-data
sudo chown -R 1000:1000 /opt/n8n-data

# Deploy production container
sudo docker run -d --name asteria-n8n-prod \
  --restart unless-stopped \
  -p 127.0.0.1:5678:5678 \
  -v /opt/n8n-data:/home/node/.n8n \
  --env-file n8n-production.env \
  n8nio/n8n:latest
```

---

## 🔒 **SECURITY FEATURES**

### Local Development Security
- **Basic Authentication**: User/password access control
- **Container Isolation**: Docker security boundaries
- **Local Network Only**: No external exposure
- **Credential Protection**: Environment files excluded from git

### Production Security
- **HTTPS Encryption**: TLS 1.2/1.3 with modern ciphers
- **Security Headers**: Complete OWASP header implementation
- **Rate Limiting**: Multi-tier request throttling
- **IP Whitelisting**: Optional team-specific access control
- **Attack Protection**: Path traversal and file access prevention
- **Automated SSL Renewal**: Zero-maintenance certificate management

### Security Testing
```bash
# Test production security
node test-production-security.js

# Expected results:
# 🛡️ Security Score: 100%
# ✅ HTTPS Redirect: PASSED
# ✅ SSL Certificate: VALID
# ✅ Security Headers: 5/5 PRESENT
# ✅ Basic Authentication: ENFORCED
# ✅ Rate Limiting: ACTIVE
```

---

## 🔧 **CONFIGURATION FILES**

### Local Development
- `n8n-docker-config.env` - Local environment configuration
- `n8n-manager.sh` - Container management script
- `test-n8n-integration.js` - Local integration testing

### Production Deployment
- `nginx-n8n-ssl.conf` - Nginx reverse proxy with SSL
- `n8n-production.env` - Production environment configuration
- `deploy-n8n-production.sh` - Automated deployment script
- `test-production-security.js` - Security validation suite

---

## 🎛️ **ENVIRONMENT CONFIGURATIONS**

### Local Development Environment
```env
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=asteria
N8N_BASIC_AUTH_PASSWORD=asteria2024!
```

### Production Environment
```env
N8N_HOST=n8n.thriveachievegrow.com
N8N_PORT=443
N8N_PROTOCOL=https
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=asteria
N8N_BASIC_AUTH_PASSWORD=[generated-secure-password]
N8N_RUNNERS_ENABLED=true
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
```

---

## 🚨 **TROUBLESHOOTING**

### Common Local Issues
```bash
# Container not starting
docker logs asteria-n8n
./n8n-manager.sh restart

# Port conflicts
sudo lsof -i :5678
# Change port in configuration if needed

# Permission issues
sudo chown -R $(whoami) ~/.n8n
```

### Common Production Issues
```bash
# SSL certificate issues
sudo certbot certificates
sudo certbot renew --dry-run

# Nginx configuration errors
sudo nginx -t
sudo systemctl status nginx

# Container not accessible
sudo docker logs asteria-n8n-prod
curl -I https://n8n.thriveachievegrow.com
```

### Monitoring Commands
```bash
# Check system health
./n8n-manager.sh status              # Local
sudo docker ps | grep asteria-n8n   # Production

# Monitor logs
tail -f ~/.n8n/n8n.log                                    # Local
sudo tail -f /var/log/nginx/n8n.thriveachievegrow.com.access.log  # Production

# Check SSL status
curl -I https://n8n.thriveachievegrow.com
openssl s_client -connect n8n.thriveachievegrow.com:443 -servername n8n.thriveachievegrow.com
```

---

## 🎯 **NEXT STEPS FOR ASTERIA INTEGRATION**

### 1. Workflow Development
- Access n8n interface (local or production)
- Create workflows for Asteria agent communication
- Set up webhook endpoints for real-time integration

### 2. API Integration
```javascript
// Example: Trigger n8n workflow from Asteria
const triggerWorkflow = async (workflowId, data) => {
  const response = await fetch(`https://n8n.thriveachievegrow.com/webhook/${workflowId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('asteria:password')
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 3. Multi-Agent Orchestration
- Configure workflows for each agent type
- Set up data flow between Asteria agents and n8n
- Implement monitoring and error handling

### 4. Performance Optimization
- Monitor workflow execution times
- Optimize for concurrent execution
- Scale with additional n8n instances if needed

---

## 📋 **DEPLOYMENT CHECKLIST**

### Local Development ✅
- [x] Docker installed and running
- [x] n8n container deployed
- [x] Management scripts executable
- [x] Integration tests passing
- [x] Access credentials configured

### Production Deployment
- [ ] Domain DNS configured
- [ ] Server with root access
- [ ] Run deployment script: `sudo ./deploy-n8n-production.sh`
- [ ] Verify SSL certificate
- [ ] Run security tests: `node test-production-security.js`
- [ ] Configure IP whitelist (optional)
- [ ] Set up monitoring alerts
- [ ] Test webhook endpoints
- [ ] Configure backup monitoring

---

## 🎉 **Success Metrics**

### Local Development
- ✅ n8n accessible at http://localhost:5678
- ✅ Integration tests: 100% pass rate
- ✅ Container management: All commands working
- ✅ Data persistence: Workflows saved and restored

### Production Deployment
- ✅ HTTPS accessible at https://n8n.thriveachievegrow.com
- ✅ Security score: 100%
- ✅ SSL certificate: Valid with auto-renewal
- ✅ Rate limiting: Active and tested
- ✅ Monitoring: Health checks every 5 minutes
- ✅ Backups: Weekly automated with retention

**🚀 Your n8n environment is now ready for Asteria multi-agent orchestration!** 