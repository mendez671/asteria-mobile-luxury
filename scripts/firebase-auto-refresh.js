#!/usr/bin/env node

// ===============================
// FIREBASE CREDENTIAL AUTO-REFRESH SYSTEM
// Automated authentication renewal and monitoring
// ===============================

const fs = require('fs');
const path = require('path');

class FirebaseCredentialManager {
  constructor() {
    this.credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.projectId = 'tag-inner-circle-v01';
    this.checkInterval = 30 * 60 * 1000; // Check every 30 minutes
    this.renewalThreshold = 2 * 60 * 60 * 1000; // Renew 2 hours before expiry
    this.monitoring = true;
  }

  /**
   * Start automated credential monitoring
   */
  startMonitoring() {
    console.log('🔄 Starting Firebase credential monitoring...');
    console.log(`📁 Credential file: ${this.credentialPath}`);
    console.log(`⏰ Check interval: ${this.checkInterval / 60000} minutes`);
    console.log(`⚠️ Renewal threshold: ${this.renewalThreshold / 3600000} hours before expiry`);

    // Initial check
    this.checkCredentials();

    // Set up interval monitoring
    setInterval(() => {
      this.checkCredentials();
    }, this.checkInterval);

    console.log('✅ Firebase credential monitoring started');
  }

  /**
   * Check credential status and validity
   */
  async checkCredentials() {
    try {
      console.log('\n🔍 Checking Firebase credentials...');
      
      // Check if credential file exists
      if (!this.credentialPath || !fs.existsSync(this.credentialPath)) {
        console.error('❌ Firebase credential file not found:', this.credentialPath);
        await this.handleCredentialFailure('missing_file');
        return;
      }

      // Read and validate credential file
      const credData = JSON.parse(fs.readFileSync(this.credentialPath, 'utf8'));
      console.log(`📋 Service account: ${credData.client_email}`);
      console.log(`🏷️ Project ID: ${credData.project_id}`);

      // Test Firebase connectivity
      const isValid = await this.testFirebaseConnectivity();
      
      if (isValid) {
        console.log('✅ Firebase credentials valid and working');
        await this.updateCredentialStatus('valid');
      } else {
        console.log('❌ Firebase credentials invalid or expired');
        await this.handleCredentialFailure('expired');
      }

    } catch (error) {
      console.error('❌ Credential check failed:', error.message);
      await this.handleCredentialFailure('check_error', error);
    }
  }

  /**
   * Test Firebase connectivity with current credentials
   */
  async testFirebaseConnectivity() {
    try {
      // Import Firebase admin (only when needed to avoid startup issues)
      const admin = require('firebase-admin');
      
      // Initialize if not already done
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: this.projectId
        });
      }

      // Test Firestore connectivity
      const db = admin.firestore();
      await db.collection('_health_check').limit(1).get();
      
      return true;
    } catch (error) {
      console.log('🔧 Firebase connectivity test failed:', error.message);
      
      // Check for specific authentication errors
      if (error.message.includes('invalid_grant') || 
          error.message.includes('reauth') ||
          error.message.includes('expired')) {
        return false;
      }
      
      // For other errors, assume credentials are valid but service is unavailable
      return true;
    }
  }

  /**
   * Handle credential failures with automated recovery
   */
  async handleCredentialFailure(type, error = null) {
    console.log(`\n🚨 CREDENTIAL FAILURE DETECTED: ${type}`);
    
    switch (type) {
      case 'missing_file':
        await this.setupCredentialFile();
        break;
        
      case 'expired':
        await this.renewCredentials();
        break;
        
      case 'check_error':
        await this.troubleshootCredentials(error);
        break;
        
      default:
        console.log('⚠️ Unknown credential failure type');
    }
  }

  /**
   * Set up credential file if missing
   */
  async setupCredentialFile() {
    console.log('🔧 Setting up Firebase credential file...');
    
    const possiblePaths = [
      '/Users/mndst/Documents/AI_and_Tools/tag-inner-circle-v01-firebase-adminsdk-fbsvc-99620828bd.json',
      './firebase-service-account.json',
      './service-account-key.json'
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`✅ Found credential file: ${filePath}`);
        
        // Update environment variable
        await this.updateEnvironmentVariable('GOOGLE_APPLICATION_CREDENTIALS', filePath);
        this.credentialPath = filePath;
        
        // Test the credentials
        const isValid = await this.testFirebaseConnectivity();
        if (isValid) {
          console.log('✅ Credential file setup successful');
          return true;
        }
      }
    }

    console.log('❌ No valid credential file found');
    await this.notifyCredentialIssue('No valid Firebase credential file found');
    return false;
  }

  /**
   * Automated credential renewal
   */
  async renewCredentials() {
    console.log('🔄 Attempting automated credential renewal...');
    
    try {
      // Try to refresh using gcloud if available
      const { execSync } = require('child_process');
      
      try {
        console.log('📋 Refreshing gcloud credentials...');
        execSync('gcloud auth application-default login --no-launch-browser', { 
          stdio: 'pipe',
          timeout: 30000 
        });
        
        console.log('✅ gcloud credentials refreshed');
        
        // Test connectivity again
        const isValid = await this.testFirebaseConnectivity();
        if (isValid) {
          console.log('✅ Credential renewal successful');
          await this.notifyCredentialSuccess('Credentials automatically renewed');
          return true;
        }
      } catch (gcloudError) {
        console.log('⚠️ gcloud refresh failed:', gcloudError.message);
      }

      // Alternative: Check for updated service account file
      await this.checkForUpdatedServiceAccount();
      
    } catch (error) {
      console.error('❌ Automated renewal failed:', error.message);
      await this.notifyCredentialIssue(`Credential renewal failed: ${error.message}`);
    }
    
    return false;
  }

  /**
   * Check for updated service account files
   */
  async checkForUpdatedServiceAccount() {
    console.log('🔍 Checking for updated service account files...');
    
    const searchPaths = [
      '/Users/mndst/Downloads',
      '/Users/mndst/Documents/AI_and_Tools',
      './downloads',
      '.'
    ];

    for (const searchPath of searchPaths) {
      if (!fs.existsSync(searchPath)) continue;
      
      try {
        const files = fs.readdirSync(searchPath);
        const serviceAccountFiles = files.filter(file => 
          file.includes('firebase-adminsdk') && 
          file.endsWith('.json') &&
          file.includes(this.projectId)
        );

        for (const file of serviceAccountFiles) {
          const filePath = path.join(searchPath, file);
          const stats = fs.statSync(filePath);
          
          // Check if file is newer than current credentials
          const currentStats = fs.existsSync(this.credentialPath) ? 
            fs.statSync(this.credentialPath) : { mtime: new Date(0) };
          
          if (stats.mtime > currentStats.mtime) {
            console.log(`✅ Found newer service account file: ${filePath}`);
            
            // Test the new file
            const tempPath = this.credentialPath;
            this.credentialPath = filePath;
            
            const isValid = await this.testFirebaseConnectivity();
            if (isValid) {
              console.log('✅ New service account file is valid');
              await this.updateEnvironmentVariable('GOOGLE_APPLICATION_CREDENTIALS', filePath);
              await this.notifyCredentialSuccess(`Updated to newer service account file: ${file}`);
              return true;
            } else {
              this.credentialPath = tempPath;
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking ${searchPath}:`, error.message);
      }
    }

    return false;
  }

  /**
   * Troubleshoot credential issues
   */
  async troubleshootCredentials(error) {
    console.log('🔧 Troubleshooting credential issues...');
    
    const troubleshootingSteps = [
      {
        name: 'Check file permissions',
        action: () => {
          if (fs.existsSync(this.credentialPath)) {
            const stats = fs.statSync(this.credentialPath);
            console.log(`📁 File permissions: ${stats.mode.toString(8)}`);
            console.log(`📅 Last modified: ${stats.mtime}`);
            console.log(`📏 File size: ${stats.size} bytes`);
          }
        }
      },
      {
        name: 'Validate JSON format',
        action: () => {
          try {
            const credData = JSON.parse(fs.readFileSync(this.credentialPath, 'utf8'));
            console.log('✅ JSON format valid');
            console.log(`📧 Client email: ${credData.client_email}`);
            console.log(`🆔 Project ID: ${credData.project_id}`);
          } catch (err) {
            console.log('❌ Invalid JSON format:', err.message);
          }
        }
      },
      {
        name: 'Check environment variables',
        action: () => {
          console.log(`🌐 GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
          console.log(`🌐 GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT}`);
          console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV}`);
        }
      }
    ];

    for (const step of troubleshootingSteps) {
      try {
        console.log(`\n📋 ${step.name}...`);
        step.action();
      } catch (stepError) {
        console.log(`❌ ${step.name} failed:`, stepError.message);
      }
    }
  }

  /**
   * Update environment variable in .env.local
   */
  async updateEnvironmentVariable(key, value) {
    const envPath = '.env.local';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const envLines = envContent.split('\n');
    const keyIndex = envLines.findIndex(line => line.startsWith(`${key}=`));
    
    const newLine = `${key}="${value}"`;
    
    if (keyIndex >= 0) {
      envLines[keyIndex] = newLine;
    } else {
      envLines.push(newLine);
    }

    fs.writeFileSync(envPath, envLines.filter(line => line.trim()).join('\n') + '\n');
    console.log(`✅ Updated ${key} in .env.local`);
  }

  /**
   * Update credential status tracking
   */
  async updateCredentialStatus(status) {
    const statusFile = '.firebase-credential-status.json';
    const statusData = {
      status,
      lastCheck: new Date().toISOString(),
      credentialPath: this.credentialPath,
      projectId: this.projectId
    };

    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
  }

  /**
   * Send notification about credential issues
   */
  async notifyCredentialIssue(message) {
    console.log(`\n🚨 CREDENTIAL NOTIFICATION: ${message}`);
    
    // Could integrate with Slack, email, etc.
    const notification = {
      timestamp: new Date().toISOString(),
      type: 'credential_issue',
      message,
      project: this.projectId,
      severity: 'high'
    };

    // Log to file for monitoring
    const logFile = 'firebase-credential.log';
    fs.appendFileSync(logFile, JSON.stringify(notification) + '\n');
    
    console.log('📝 Issue logged to firebase-credential.log');
  }

  /**
   * Send notification about credential success
   */
  async notifyCredentialSuccess(message) {
    console.log(`\n✅ CREDENTIAL SUCCESS: ${message}`);
    
    const notification = {
      timestamp: new Date().toISOString(),
      type: 'credential_success',
      message,
      project: this.projectId,
      severity: 'info'
    };

    const logFile = 'firebase-credential.log';
    fs.appendFileSync(logFile, JSON.stringify(notification) + '\n');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;
    console.log('🛑 Firebase credential monitoring stopped');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new FirebaseCredentialManager();

  switch (args[0]) {
    case 'start':
      manager.startMonitoring();
      break;
      
    case 'check':
      manager.checkCredentials();
      break;
      
    case 'renew':
      manager.renewCredentials();
      break;
      
    case 'troubleshoot':
      manager.troubleshootCredentials();
      break;
      
    default:
      console.log(`
🔥 Firebase Credential Auto-Refresh System

Usage:
  node scripts/firebase-auto-refresh.js start        - Start monitoring
  node scripts/firebase-auto-refresh.js check        - Check credentials once
  node scripts/firebase-auto-refresh.js renew        - Force renewal
  node scripts/firebase-auto-refresh.js troubleshoot - Troubleshoot issues

Current status:
  📁 Credential file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Not set'}
  🏷️ Project: ${manager.projectId}
`);
      process.exit(1);
  }
}

module.exports = FirebaseCredentialManager; 