// ===============================
// PHASE 8: STRIPE PAYMENT INTENT TOOL
// Agent tool for premium service payment processing
// ===============================

import { z } from 'zod';
import { getSecret } from '../../utils/secrets';

export const stripePaymentIntentSchema = z.object({
  amount: z.number().min(1).describe('Payment amount in cents'),
  currency: z.string().default('usd').describe('Currency code (default: USD)'),
  memberId: z.string().describe('Member ID for the payment'),
  serviceCategory: z.string().describe('Service category (transportation, events, lifestyle, etc.)'),
  description: z.string().describe('Payment description'),
  memberTier: z.string().optional().describe('Member tier for processing customization')
});

export interface StripePaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

/**
 * Create Stripe payment intent for luxury service payments
 * Integrates with existing Stripe infrastructure and member tier system
 */
export async function stripePaymentIntent(
  params: z.infer<typeof stripePaymentIntentSchema>
): Promise<StripePaymentIntentResult> {
  try {
    console.log('💳 [STRIPE] Creating payment intent:', {
      amount: params.amount,
      currency: params.currency,
      serviceCategory: params.serviceCategory,
      memberTier: params.memberTier
    });

    // Get Stripe secret key
    const stripeSecretKey = await getSecret('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Create Stripe payment intent
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: params.amount.toString(),
        currency: params.currency,
        automatic_payment_methods: JSON.stringify({ enabled: true }),
        description: params.description,
        metadata: JSON.stringify({
          memberId: params.memberId,
          serviceCategory: params.serviceCategory,
          memberTier: params.memberTier || 'standard',
          source: 'asteria-agent'
        })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const paymentIntent = await response.json();

    console.log('✅ [STRIPE] Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    };

  } catch (error) {
    console.error('❌ [STRIPE] Payment intent creation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment intent creation failed'
    };
  }
} 