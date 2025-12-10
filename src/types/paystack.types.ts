/**
 * Paystack webhook event data for charge.success
 */
export interface PaystackChargeData {
  reference: string;
  amount: number;
  status: string;
  currency?: string;
  paid_at?: string;
  channel?: string;
  customer?: {
    email: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Paystack webhook payload structure
 */
export interface PaystackWebhookPayload {
  event: string;
  data: PaystackChargeData;
}

/**
 * Paystack transaction initialization response
 */
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Paystack API response wrapper
 */
export interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
