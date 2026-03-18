import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Razorpay window declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface PaymentData {
  planId: string;          // Any plan ID from the plans table (e.g. 'plus', 'pro', 'neet_full')
  billingCycle: string;    // 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
  userEmail?: string;
  userName?: string;
}

interface UseRazorpayReturn {
  loading: boolean;
  initiatePayment: (data: PaymentData) => Promise<void>;
  loadRazorpayScript: () => Promise<boolean>;
}

/**
 * Custom hook for Razorpay payment integration
 * 
 * Usage:
 * ```tsx
 * const { loading, initiatePayment } = useRazorpay();
 * 
 * await initiatePayment({
 *   planId: 'PRO',
 *   billingCycle: 'MONTHLY',
 *   userEmail: 'user@example.com'
 * });
 * ```
 */
export function useRazorpay(): UseRazorpayReturn {
  const [loading, setLoading] = useState(false);

  /**
   * Load Razorpay checkout script dynamically
   */
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        console.log('[Razorpay] Checkout script loaded successfully');
        resolve(true);
      };

      script.onerror = () => {
        console.error('[Razorpay] Failed to load checkout script');
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }, []);

  /**
   * Initiate payment flow
   */
  const initiatePayment = useCallback(async (data: PaymentData): Promise<void> => {
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // 2. Create order on server
      const createOrderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: data.planId,
          billingCycle: data.billingCycle,
        }),
      });

      if (!createOrderResponse.ok) {
        const error = await createOrderResponse.json();
        throw new Error(error.error || 'Failed to create payment order');
      }

      const orderData = await createOrderResponse.json();

      console.log('[Razorpay] Order data received from backend:', orderData);

      // 3. Configure Razorpay options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NEET Prep Platform',
        description: `NEET UG Premium Subscription - ${data.planId} (${data.billingCycle})`,
        order_id: orderData.order_id,
        prefill: {
          email: data.userEmail,
          name: data.userName,
        },
        theme: {
          color: '#0AA89E', // Teal brand color
        },
        handler: async (response: RazorpaySuccessResponse) => {
          // 4. Payment success - verify on server
          console.log('[Razorpay] Payment successful, verifying...', response);
          
          // Show immediate success feedback
          toast.success('Payment completed! Verifying...', { duration: 3000 });
          
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            console.log('[Razorpay] Verify response status:', verifyResponse.status);

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}));
              console.error('[Razorpay] Verification failed with status:', verifyResponse.status, errorData);
              throw new Error(errorData.error || 'Payment verification failed');
            }

            // 5. Success!
            console.log('[Razorpay] ✅ Payment verified successfully');
            
            // 5.5. Force session and enrollment refresh
            try {
              const supabase = createSupabaseBrowserClient();
              const { data: refreshData } = await supabase.auth.refreshSession();
              console.log('[Razorpay] Session refreshed:', !!refreshData.session);
              
              // Wait a moment for server-side data to propagate
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (refreshError) {
              console.error('[Razorpay] Session refresh failed (non-critical):', refreshError);
            }
            
            toast.success('Payment successful! Your subscription is now active.', {
              duration: 3000,
            });

            // 6. Immediate redirect with full page reload to clear all cached data
            console.log('[Razorpay] Redirecting to dashboard...');
            window.location.replace('/dashboard?upgraded=true&t=' + Date.now());

          } catch (verifyError: any) {
            console.error('[Razorpay] Verification failed:', verifyError);
            toast.error('Payment received but verification failed. Please contact support with your payment ID.', {
              duration: 10000,
            });
            setLoading(false);
            
            // Still redirect to dashboard after 5 seconds so user isn't stuck
            setTimeout(() => {
              window.location.href = '/dashboard?payment_issue=true&t=' + Date.now();
            }, 5000);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[Razorpay] Payment modal dismissed');
            toast.info('Payment cancelled');
            setLoading(false);
          },
        },
      };

      // Debug logging (CRITICAL: Check these values before opening Razorpay)
      console.log('[Razorpay] Checkout config:', {
        key: options.key,
        order_id: options.order_id,
        amount: options.amount,
        currency: options.currency,
      });

      if (!options.key) {
        console.error('[Razorpay] CRITICAL: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set!');
        toast.error('Payment configuration error. Please contact support.');
        setLoading(false);
        return;
      }

      if (!options.order_id) {
        console.error('[Razorpay] CRITICAL: order_id is missing from backend response!');
        toast.error('Payment order creation failed. Please try again.');
        setLoading(false);
        return;
      }

      // 4. Start polling for QR/UPI payments (runs in background)
      let pollInterval: NodeJS.Timeout | null = null;
      let pollTimeout: NodeJS.Timeout | null = null;
      const orderId = orderData.order_id;
      
      const stopPolling = () => {
        if (pollInterval) clearInterval(pollInterval);
        if (pollTimeout) clearTimeout(pollTimeout);
      };
      
      const checkPaymentStatus = async () => {
        try {
          console.log('[Razorpay] Polling payment status for order:', orderId);
          const statusResponse = await fetch(`/api/payments/status?order_id=${orderId}`);
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('[Razorpay] Poll result:', statusData);
            
            if (statusData.status === 'paid') {
              console.log('[Razorpay] ✅ QR/UPI payment detected! Auto-verifying...');
              stopPolling();
              
              // Create mock response for handler
              const mockResponse: RazorpaySuccessResponse = {
                razorpay_order_id: orderId,
                razorpay_payment_id: statusData.payment_id,
                razorpay_signature: '', // Webhook will handle verification
              };
              
              // Trigger the success handler
              options.handler(mockResponse);
            }
          }
        } catch (pollError) {
          console.error('[Razorpay] Poll error (non-critical):', pollError);
        }
      };
      
      // Poll every 3 seconds for 10 minutes
      pollInterval = setInterval(checkPaymentStatus, 3000);
      pollTimeout = setTimeout(() => {
        stopPolling();
        console.log('[Razorpay] Polling stopped after 10 minutes');
      }, 600000); // 10 minutes
      
      // 5. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('[Razorpay] Payment failed:', response.error);
        stopPolling(); // Stop polling on failure
        toast.error(`Payment failed: ${response.error.description}`, {
          duration: 5000,
        });
        setLoading(false);
      });

      razorpay.open();

      // Safety timeout: reset loading after 2 minutes if nothing happened
      setTimeout(() => {
        setLoading(false);
      }, 120000);

    } catch (error: any) {
      console.error('[Razorpay] Payment initiation failed:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  }, [loadRazorpayScript]);

  return {
    loading,
    initiatePayment,
    loadRazorpayScript,
  };
}
