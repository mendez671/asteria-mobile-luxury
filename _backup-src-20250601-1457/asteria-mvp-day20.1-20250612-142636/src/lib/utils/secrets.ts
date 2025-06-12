// ===============================
// GOOGLE CLOUD SECRET MANAGER UTILITY
// Centralized secret management with caching and fallback
// ===============================

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialize client
const client = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'tag-inner-circle-v01';

// Cache for secrets to avoid repeated calls
const secretCache = new Map<string, any>();

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Core secret retrieval function with caching and fallback
 */
export async function getSecret(secretName: string): Promise<string> {
  // Check cache first
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName)!;
  }

  try {
    // Try to get from Secret Manager
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });

    const secret = version.payload?.data?.toString();
    if (!secret) {
      throw new Error(`Secret ${secretName} is empty`);
    }

    // Cache the secret
    secretCache.set(secretName, secret);
    console.log(`✅ Retrieved secret from GCP: ${secretName}`);
    return secret;
  } catch (error) {
    // Fallback to environment variable for development
    const envValue = process.env[secretName];
    if (envValue) {
      console.warn(`⚠️ Using fallback env var for ${secretName} (${isDevelopment ? 'dev mode' : 'GCP error'})`);
      secretCache.set(secretName, envValue);
      return envValue;
    }
    
    console.error(`❌ Failed to get secret ${secretName}:`, error);
    throw new Error(`Secret ${secretName} not found in GCP or environment`);
  }
}

/**
 * Special handler for JSON secrets (like Google Calendar credentials)
 */
export async function getSecretJSON(secretName: string): Promise<any> {
  const secretString = await getSecret(secretName);
  try {
    return JSON.parse(secretString);
  } catch (error) {
    throw new Error(`Failed to parse JSON for secret ${secretName}: ${error}`);
  }
}

// ===============================
// SPECIFIC SECRET GETTERS
// ===============================

// Core API Keys
export const getOpenAIKey = () => getSecret('OPENAI_API_KEY');
export const getSlackWebhook = () => getSecret('SLACK_WEBHOOK_URL');
export const getTavilyKey = () => getSecret('TAVILY_API_KEY');

// Twilio Configuration
export const getTwilioAccountSid = () => getSecret('TWILIO_ACCOUNT_SID');
export const getTwilioAuthToken = () => getSecret('TWILIO_AUTH_TOKEN');
export const getTwilioPhoneNumber = () => getSecret('TWILIO_PHONE_NUMBER');
export const getConciergePhoneNumber = () => getSecret('CONCIERGE_PHONE_NUMBER');
export const getTwilioMessagingServiceSid = () => getSecret('TWILIO_MESSAGING_SERVICE_SID');

// Voice & AI Services
export const getElevenLabsKey = () => getSecret('ELEVENLABS_API_KEY');

// Stripe Configuration
export const getStripeSecretKey = () => getSecret('STRIPE_SECRET_KEY');
export const getStripeWebhookUrl = () => getSecret('STRIPE_WEBHOOK_URL');
export const getStripeWebhookSecretSnap = () => getSecret('STRIPE_WEBHOOK_SECRET_SNAP');
export const getStripeWebhookSecretThin = () => getSecret('STRIPE_WEBHOOK_SECRET_THIN');
export const getStripeWebhookSecret = () => getSecret('STRIPE_WEBHOOK_SECRET_SNAP'); // Default to snap webhook

// Calendar & Travel APIs
export const getCalendlyToken = () => getSecret('CALENDLY_API_TOKEN');
export const getGoogleCalendarCredentials = () => getSecretJSON('GCAL_CLIENT_SECRET');
export const getAmadeusKey = () => getSecret('AMADEUS_API_KEY');
export const getAmadeusSecret = () => getSecret('AMADEUS_API_SECRET');

// Database Configuration
export const getDatabaseUrl = () => getSecret('DATABASE_URL');

// ===============================
// CONVENIENCE FUNCTIONS
// ===============================

/**
 * Get all Twilio credentials at once
 */
export const getTwilioCredentials = async () => {
  const [accountSid, authToken, phoneNumber, messagingServiceSid] = await Promise.all([
    getTwilioAccountSid(),
    getTwilioAuthToken(),
    getTwilioPhoneNumber(),
    getTwilioMessagingServiceSid()
  ]);
  return { accountSid, authToken, phoneNumber, messagingServiceSid };
};

/**
 * Get Amadeus credentials as an object
 */
export const getAmadeusCredentials = async () => {
  const [apiKey, apiSecret] = await Promise.all([
    getAmadeusKey(),
    getAmadeusSecret()
  ]);
  return { apiKey, apiSecret };
};

/**
 * Get all Stripe configuration
 */
export const getStripeConfig = async () => {
  const [secretKey, webhookUrl, webhookSecretSnap, webhookSecretThin] = await Promise.all([
    getStripeSecretKey(),
    getStripeWebhookUrl(),
    getStripeWebhookSecretSnap(),
    getStripeWebhookSecretThin()
  ]);
  return { secretKey, webhookUrl, webhookSecretSnap, webhookSecretThin };
};

/**
 * Clear the secret cache (useful for testing or key rotation)
 */
export const clearSecretCache = () => {
  secretCache.clear();
  console.log('🧹 Secret cache cleared');
};

/**
 * Preload critical secrets at startup
 */
export const preloadCriticalSecrets = async () => {
  console.log('🔄 Preloading critical secrets...');
  try {
    await Promise.all([
      getOpenAIKey(),
      getSlackWebhook(),
      getTavilyKey()
    ]);
    console.log('✅ Critical secrets preloaded');
  } catch (error) {
    console.error('❌ Failed to preload some secrets:', error);
    // Don't throw - allow app to start with fallback to env vars
  }
}; 