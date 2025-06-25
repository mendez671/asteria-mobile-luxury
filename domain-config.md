# ASTERIA n8n Custom Domain Configuration

## 🎯 **Recommended Domain Setup**

### **Production Architecture:**
- **Local n8n (Development)**: `http://localhost:5678`
- **Production n8n (Cloud)**: `https://n8n.thriveachievegrow.com`
- **Asteria Main App**: `https://asteria.thriveachievegrow.com`
- **API Gateway**: `https://api.thriveachievegrow.com`

### **Alternative Setup (if using n8n Cloud):**
- **n8n Cloud Instance**: `https://asteria-{your-instance}.app.n8n.cloud`
- **Custom Domain**: `https://n8n.thriveachievegrow.com` (CNAME to cloud)

## 🔧 **Implementation Steps**

### **Option 1: Self-Hosted n8n with Custom Domain**

1. **Server Setup:**
   ```bash
   # On your production server
   docker run -d \
     --name n8n-production \
     -p 5678:5678 \
     -e N8N_HOST=n8n.thriveachievegrow.com \
     -e N8N_PROTOCOL=https \
     -e N8N_PORT=443 \
     -e WEBHOOK_URL=https://n8n.thriveachievegrow.com/ \
     -v n8n_data:/home/node/.n8n \
     n8nio/n8n
   ```

2. **Nginx Configuration:**
   ```nginx
   # /etc/nginx/sites-available/n8n.thriveachievegrow.com
   server {
       listen 80;
       server_name n8n.thriveachievegrow.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name n8n.thriveachievegrow.com;

       ssl_certificate /etc/letsencrypt/live/n8n.thriveachievegrow.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/n8n.thriveachievegrow.com/privkey.pem;

       location / {
           proxy_pass http://localhost:5678;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **SSL Certificate:**
   ```bash
   sudo certbot --nginx -d n8n.thriveachievegrow.com
   ```

### **Option 2: n8n Cloud with Custom Domain**

1. **DNS Configuration:**
   ```
   Type: CNAME
   Name: n8n
   Value: your-instance.app.n8n.cloud
   TTL: 300
   ```

2. **n8n Cloud Settings:**
   - Go to Settings > Environment
   - Add custom domain: `n8n.thriveachievegrow.com`
   - Configure SSL (automatic with n8n Cloud)

## 🔌 **Asteria Integration Configuration**

### **Environment Variables Update:**

Update your Asteria app's environment variables:

```bash
# For local development
N8N_ASTERIA_BASE_URL=http://localhost:5678

# For production
N8N_ASTERIA_BASE_URL=https://n8n.thriveachievegrow.com

# CORS configuration
ASTERIA_CORS_ORIGIN=https://asteria.thriveachievegrow.com,https://thriveachievegrow.com
```

### **Webhook Configuration:**

```javascript
// In your Asteria app
const n8nWebhookURL = process.env.N8N_ASTERIA_BASE_URL + '/webhook/asteria-request';

// Example webhook call
fetch(n8nWebhookURL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://asteria.thriveachievegrow.com'
  },
  body: JSON.stringify({
    memberId: 'member-123',
    message: 'Book a private jet to Miami',
    memberTier: 'founding10'
  })
});
```

## 🛠 **Local Development Workflow**

### **Development Process:**
1. **Build workflows locally**: `http://localhost:5678`
2. **Test with Asteria app**: Point to localhost
3. **Export workflows**: `./sync-workflows.sh backup`
4. **Deploy to production**: Manual upload to production domain

### **Sync Commands:**
```bash
# Check status
./sync-workflows.sh status

# Create backup
./sync-workflows.sh backup

# Import workflow
./sync-workflows.sh import asteria-main-orchestrator-v2.json
```

## 🔐 **Security Configuration**

### **CORS Headers:**
```javascript
// In n8n webhook responses
{
  "Access-Control-Allow-Origin": "https://asteria.thriveachievegrow.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
}
```

### **Authentication:**
- Use API keys for webhook authentication
- Implement member token validation
- Set up rate limiting

## 📊 **Monitoring & Logging**

### **Health Checks:**
- Local: `http://localhost:5678/healthz`
- Production: `https://n8n.thriveachievegrow.com/healthz`

### **Logging:**
- n8n execution logs
- Webhook performance metrics
- Error tracking and alerts

## 🚀 **Next Steps**

1. Choose your preferred setup (Self-hosted vs Cloud)
2. Configure DNS records for your domain
3. Set up SSL certificates
4. Update Asteria environment variables
5. Test webhook connectivity
6. Deploy your first workflow

## 📞 **Support**

If you need help with domain configuration:
- Check n8n documentation: https://docs.n8n.io
- Domain DNS configuration with your registrar
- SSL certificate setup with Let's Encrypt 