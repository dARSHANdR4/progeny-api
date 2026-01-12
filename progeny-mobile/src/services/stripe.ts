import * as Linking from 'expo-linking';
import { supabase, IS_DEMO_MODE } from '../lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface CheckoutSessionResponse {
    url: string;
    sessionId: string;
}

interface PaymentVerificationResponse {
    success: boolean;
    subscription?: {
        plan_type: string;
        scans_remaining: number;
        expires_at: string;
    };
}

/**
 * Stripe Payment Service for React Native
 * Handles checkout session creation and payment verification
 */
export const stripeService = {
    /**
     * Create a Stripe Checkout session for subscription upgrade
     */
    async createCheckoutSession(planId: string = 'premium_monthly'): Promise<CheckoutSessionResponse> {
        if (IS_DEMO_MODE) {
            // In demo mode, return a mock URL
            console.log('📦 Demo Mode: Simulating Stripe checkout');
            return {
                url: 'https://checkout.stripe.com/demo',
                sessionId: 'cs_demo_' + Date.now(),
            };
        }

        try {
            const session = await supabase?.auth.getSession();
            const token = session?.data?.session?.access_token;

            const response = await fetch(`${API_BASE_URL}/api/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planId,
                    successUrl: Linking.createURL('payment-success'),
                    cancelUrl: Linking.createURL('payment-cancelled'),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();
            return {
                url: data.url,
                sessionId: data.sessionId,
            };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    },

    /**
     * Open Stripe Checkout in browser
     */
    async openCheckout(planId?: string): Promise<boolean> {
        try {
            const { url } = await this.createCheckoutSession(planId);

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                return true;
            } else {
                console.error('Cannot open URL:', url);
                return false;
            }
        } catch (error) {
            console.error('Error opening checkout:', error);
            return false;
        }
    },

    /**
     * Verify payment after returning from Stripe
     */
    async verifyPayment(sessionId: string): Promise<PaymentVerificationResponse> {
        if (IS_DEMO_MODE) {
            console.log('📦 Demo Mode: Simulating payment verification');
            return {
                success: true,
                subscription: {
                    plan_type: 'premium',
                    scans_remaining: 100,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                },
            };
        }

        try {
            const session = await supabase?.auth.getSession();
            const token = session?.data?.session?.access_token;

            const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                throw new Error('Payment verification failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error verifying payment:', error);
            return { success: false };
        }
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(): Promise<boolean> {
        if (IS_DEMO_MODE) {
            console.log('📦 Demo Mode: Simulating subscription cancellation');
            return true;
        }

        try {
            const session = await supabase?.auth.getSession();
            const token = session?.data?.session?.access_token;

            const response = await fetch(`${API_BASE_URL}/api/subscription/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            return false;
        }
    },
};
