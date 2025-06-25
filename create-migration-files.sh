#!/bin/bash

# N8N ASTERIA - Cloud Migration File Creator
echo "🚀 N8N ASTERIA Cloud Migration Setup"
echo "======================================"

# Create individual workflow files
echo "📁 Creating workflow export files..."
touch main-orchestrator.json
touch auth-agent.json  
touch member-data.json
touch business-logic.json
touch integration-agent.json
touch orchestrator.json

echo "✅ Created migration files:"
ls -la *.json

echo ""
echo "📋 NEXT STEPS:"
echo "1. Open your local N8N: http://localhost:5678"
echo "2. For each workflow:"
echo "   - Open the workflow"
echo "   - Select All (Cmd+A / Ctrl+A)" 
echo "   - Copy (Cmd+C / Ctrl+C)"
echo "   - Paste into the corresponding .json file"
echo ""
echo "📝 Workflow Mapping:"
echo "   Main Orchestrator Workflow    → main-orchestrator.json"
echo "   Auth Agent workflow           → auth-agent.json"
echo "   Member Data Workflow          → member-data.json"
echo "   Business Logic Workflow       → business-logic.json"
echo "   Integration Agent workflow    → integration-agent.json" 
echo "   Orchestrator workflow         → orchestrator.json"
echo ""
echo "🔗 Then follow the migration guide: n8n-cloud-migration-guide.md" 