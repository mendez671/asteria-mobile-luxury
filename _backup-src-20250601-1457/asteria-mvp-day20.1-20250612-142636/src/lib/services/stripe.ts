// ===============================
// STRIPE PAYMENT SERVICE INTEGRATION
// Phase 5.3: External Service Integrations
// ===============================

import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/utils/secrets';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  amount?: number;
  currency?: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  status?: string;
}

class StripeService {
  private stripe: Stripe | null = null;

  // ===============================
  // INITIALIZATION WITH SECRET MANAGER
  // ===============================
  
  private async getStripeClient(): Promise<Stripe> {
    if (!this.stripe) {
      try {
        const apiKey = await getStripeSecretKey();
        this.stripe = new Stripe(apiKey, {
          apiVersion: '2025-05-28.basil',
          typescript: true,
        });
      } catch (error) {
        console.error('[STRIPE] Failed to initialize Stripe client:', error);
        throw new Error('Stripe service unavailable');
      }
    }
    return this.stripe;
  }

  // ===============================
  // PAYMENT INTENT MANAGEMENT
  // ===============================

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {}
  ): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripeClient();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          service: 'asteria_concierge',
          timestamp: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
      };
    } catch (error) {
      console.error('[STRIPE] Payment intent creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment setup failed',
      };
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripeClient();
      
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('[STRIPE] Payment confirmation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const stripe = await this.getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret || '',
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error('[STRIPE] Failed to retrieve payment intent:', error);
      return null;
    }
  }

  // ===============================
  // CUSTOMER MANAGEMENT
  // ===============================

  async createCustomer(
    email: string,
    name?: string,
    metadata: Record<string, string> = {}
  ): Promise<StripeCustomer | null> {
    try {
      const stripe = await this.getStripeClient();
      
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          ...metadata,
          service: 'asteria_concierge',
          created_at: new Date().toISOString(),
        },
      });

      return {
        id: customer.id,
        email: customer.email || email,
        name: customer.name || undefined,
        metadata: customer.metadata,
      };
    } catch (error) {
      console.error('[STRIPE] Customer creation failed:', error);
      return null;
    }
  }

  async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const stripe = await this.getStripeClient();
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        metadata: customer.metadata,
      };
    } catch (error) {
      console.error('[STRIPE] Failed to retrieve customer:', error);
      return null;
    }
  }

  // ===============================
  // SUBSCRIPTION MANAGEMENT
  // ===============================

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {}
  ): Promise<SubscriptionResult> {
    try {
      const stripe = await this.getStripeClient();
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          ...metadata,
          service: 'asteria_concierge',
          created_at: new Date().toISOString(),
        },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      console.error('[STRIPE] Subscription creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed',
      };
    }
  }

  // ===============================
  // WEBHOOK VERIFICATION
  // ===============================

  async verifyWebhook(payload: string, signature: string, secret: string): Promise<any> {
    try {
      const stripe = await this.getStripeClient();
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error('[STRIPE] Webhook verification failed:', error);
      throw error;
    }
  }

  // ===============================
  // PRICING AND PRODUCTS
  // ===============================

  async createPrice(
    amount: number,
    currency: string = 'usd',
    productName: string,
    recurring?: { interval: 'month' | 'year' }
  ) {
    try {
      const stripe = await this.getStripeClient();
      
      // First create the product
      const product = await stripe.products.create({
        name: productName,
        metadata: {
          service: 'asteria_concierge',
        },
      });

      // Then create the price
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        product: product.id,
        recurring: recurring || undefined,
      });

      return { product, price };
    } catch (error) {
      console.error('[STRIPE] Price creation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();

// ===============================
// WORKFLOW INTEGRATION HELPERS
// ===============================

export interface WorkflowPaymentConfig {
  amount: number;
  currency?: string;
  description: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export async function processWorkflowPayment(
  config: WorkflowPaymentConfig
): Promise<PaymentResult> {
  const { amount, currency = 'usd', description, customerId, metadata = {} } = config;
  
  const paymentMetadata = {
    ...metadata,
    description,
    workflow_step: 'payment',
    customer_id: customerId || 'guest',
  };

  return await stripeService.createPaymentIntent(amount, currency, paymentMetadata);
}

export async function handlePaymentWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
) {
  try {
    const event = await stripeService.verifyWebhook(payload, signature, webhookSecret);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('[STRIPE_WEBHOOK] Payment succeeded:', event.data.object.id);
        // TODO: Update workflow status
        break;
        
      case 'payment_intent.payment_failed':
        console.log('[STRIPE_WEBHOOK] Payment failed:', event.data.object.id);
        // TODO: Handle payment failure in workflow
        break;
        
      case 'customer.subscription.created':
        console.log('[STRIPE_WEBHOOK] Subscription created:', event.data.object.id);
        // TODO: Update member tier
        break;
        
      default:
        console.log('[STRIPE_WEBHOOK] Unhandled event type:', event.type);
    }

    return { received: true };
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Error processing webhook:', error);
    throw error;
  }
} 