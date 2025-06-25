# n8n CLI Import Guide - ASTERIA Workflows V2

## Prerequisites
- n8n instance running (Docker or local)
- Access to n8n CLI
- Environment variables configured

## Step 1: Prepare Your Environment

```bash
# Create workflow directory
mkdir ~/asteria-n8n-workflows
cd ~/asteria-n8n-workflows

# Set n8n environment variables
export N8N_HOST="http://localhost:5678"
export N8N_BASIC_AUTH_USER="your-username"
export N8N_BASIC_AUTH_PASSWORD="your-password"
```

## Step 2: Save Workflow Files

Save each workflow JSON to a separate file:

```bash
# Save the Integration Agent V2 workflow
cat > integration-agent-v2.json << 'EOF'
[paste the Integration Agent V2 JSON here]
EOF

# Save other workflows similarly
cat > planning-agent.json << 'EOF'
[paste Planning Agent JSON]
EOF

cat > execution-agent.json << 'EOF'
[paste Execution Agent JSON]
EOF

cat > reflection-agent.json << 'EOF'
[paste Reflection Agent JSON]
EOF

cat > goal-checking-agent.json << 'EOF'
[paste Goal Checking Agent JSON]
EOF
```

## Step 3: Import Using n8n CLI

### Option A: Using n8n CLI directly

```bash
# Import single workflow
n8n import:workflow --input=integration-agent-v2.json

# Import all workflows at once
n8n import:workflow --input=./asteria-n8n-workflows --separate

# Import with specific user
n8n import:workflow --input=integration-agent-v2.json --userId=1
```

### Option B: Using Docker exec

```bash
# If using Docker, exec into container first
docker exec -it n8n /bin/sh

# Then run import commands
n8n import:workflow --input=/data/workflows/integration-agent-v2.json
```

### Option C: Using REST API

```bash
# Import via API
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your-api-key" \
  -d @integration-agent-v2.json
```

## Step 4: Verify Import

```bash
# List all workflows
n8n list:workflows

# Check specific workflow
n8n export:workflow --id=<workflow-id> --output=verify.json
```

## Step 5: Activate Workflows

```bash
# Activate workflow by ID
n8n activate:workflow --id=<workflow-id>

# Or activate all ASTERIA workflows
for workflow in $(n8n list:workflows | grep asteria | awk '{print $1}'); do
  n8n activate:workflow --id=$workflow
done
```

## Troubleshooting

### Common Issues:

1. **"Invalid JSON" Error**
   ```bash
   # Validate JSON first
   jq . integration-agent-v2.json
   ```

2. **"Node type not found" Error**
   - Ensure all required nodes are installed
   - Update n8n to latest version

3. **"Credentials missing" Error**
   - Import credentials separately:
   ```bash
   n8n import:credentials --input=credentials.json
   ```

4. **Permission Issues**
   ```bash
   # Set correct permissions
   chmod 644 *.json
   ```

## Alternative: Direct Copy-Paste Method

If CLI import fails, use the UI copy-paste method:

1. Open n8n UI
2. Create new workflow
3. Press `Ctrl+A` to select all
4. Press `Ctrl+V` to paste the JSON
5. Save workflow

## Environment Variables Setup

Create `.env` file for your n8n instance:

```env
# ASTERIA Agent URLs
PLANNING_AGENT_URL=http://localhost:3001
EXECUTION_AGENT_URL=http://localhost:3002
REFLECTION_AGENT_URL=http://localhost:3003
CHECKING_AGENT_URL=http://localhost:3004

# Integration Settings
ASTERIA_ALLOWED_ORIGINS=http://localhost:3000,https://app.asteria.com
ERROR_TRACKING_WEBHOOK=http://localhost:5678/webhook/error-tracking

# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=n8n

# Execution
EXECUTIONS_PROCESS=main
N8N_CONCURRENCY_LIMIT=10
```

## Post-Import Configuration

1. **Update Webhook URLs**
   - Go to each webhook node
   - Copy the production URL
   - Update your application configs

2. **Configure Credentials**
   - Add API keys for external services
   - Set up authentication tokens

3. **Test Workflows**
   - Use n8n's built-in testing
   - Send test requests to webhooks

## Validation Script

Create a validation script to ensure everything is working:

```bash
#!/bin/bash
# validate-asteria-workflows.sh

echo "🔍 Validating ASTERIA Workflows..."

# Check if workflows are imported
WORKFLOWS=$(n8n list:workflows | grep -c asteria)
echo "✅ Found $WORKFLOWS ASTERIA workflows"

# Check if workflows are active
ACTIVE=$(n8n list:workflows | grep asteria | grep -c active)
echo "✅ $ACTIVE workflows are active"

# Test webhook endpoints
for webhook in integration planning execution reflection checking; do
  URL="http://localhost:5678/webhook/$webhook-agent"
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)
  if [ $RESPONSE -eq 200 ]; then
    echo "✅ $webhook webhook is responding"
  else
    echo "❌ $webhook webhook returned $RESPONSE"
  fi
done

echo "🎉 Validation complete!"
```

Make it executable:
```bash
chmod +x validate-asteria-workflows.sh
./validate-asteria-workflows.sh
```