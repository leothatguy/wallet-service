# Paystack Webhook Testing Guide

## 🔧 Quick Fix: Bypass Signature Verification for Testing

Add this to your `.env` file to disable signature checking in development:

```env
PAYSTACK_SKIP_SIGNATURE_CHECK=true
```

> ⚠️ **IMPORTANT**: Remove this or set to `false` in production! Signature verification is a security feature.

## 📝 How to Test in Swagger

### Step 1: First Create a Pending Transaction

You need a real transaction reference. Use the deposit endpoint:

1. **Authenticate first** (get JWT token from `/auth/google`)
2. **POST /wallet/deposit** with:
   ```json
   {
     "amount": 5000
   }
   ```
3. **Copy the reference** from the response (e.g., `TXN_1702235123456_abc123def456`)

### Step 2: Test the Webhook

Now test the webhook endpoint with:

**Endpoint**: `POST /wallet/paystack/webhook`

**Headers**: Leave the `x-paystack-signature` empty (or put any value)

**Body**:

```json
{
  "event": "charge.success",
  "data": {
    "reference": "TXN_1702235123456_abc123def456",
    "amount": 500000,
    "status": "success"
  }
}
```

> 📌 Replace `TXN_1702235123456_abc123def456` with the actual reference from Step 1

### Step 3: Verify It Worked

Check your wallet balance:

- **GET /wallet/balance**

The amount should be credited!

## 🧪 Understanding Paystack Webhook Signature

### What is the `x-paystack-signature`?

It's a **security hash** that Paystack sends to verify the webhook is genuine.

**How Paystack creates it:**

```javascript
const signature = crypto
  .createHmac('sha512', YOUR_PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(webhookBody))
  .digest('hex');
```

### Why Can't You Generate It?

When testing manually in Swagger:

- You're **not** Paystack
- You don't know the exact JSON string Paystack would send
- Tiny differences (spacing, order) change the hash
- That's why we bypass it for testing!

## 🔐 Production Webhook Setup

### 1. Get Your Paystack Secret Key

The secret key is **NOT** the signature. It's your API key:

1. Login to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. Configure Your Environment

In `.env`:

```env
# Use your actual Paystack keys
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here

# For production, remove this or set to false
PAYSTACK_SKIP_SIGNATURE_CHECK=false
```

### 3. Set Webhook URL in Paystack

1. In Paystack Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/wallet/paystack/webhook`
3. Paystack will send webhooks with proper signatures automatically

## 📊 Webhook Events

Your service handles:

| Event            | Description        | Action                                            |
| ---------------- | ------------------ | ------------------------------------------------- |
| `charge.success` | Payment successful | Credits wallet and updates transaction to SUCCESS |

## 🐛 Troubleshooting

### "Invalid signature" error

✅ **Solution**: Add `PAYSTACK_SKIP_SIGNATURE_CHECK=true` to `.env` for local testing

### "Transaction not found"

- Make sure you created a deposit transaction first (POST /wallet/deposit)
- Use the exact reference from the response

### Webhook not working in production

- Check your Paystack secret key is correct
- Verify webhook URL is set in Paystack dashboard
- Make sure `PAYSTACK_SKIP_SIGNATURE_CHECK` is `false` or removed

## 💡 Best Practices

1. **Development**: Use `PAYSTACK_SKIP_SIGNATURE_CHECK=true` for easy testing
2. **Staging**: Use test keys (`sk_test_...`) with signature verification enabled
3. **Production**: Use live keys (`sk_live_...`) with signature verification enabled (never skip!)

## 📱 Testing Real Paystack Flow

To test the complete flow with real Paystack:

1. **Initiate deposit**: POST /wallet/deposit
2. **Visit authorization URL**: Open the `authorization_url` from response
3. **Make test payment**: Use Paystack test card:
   - Card: `4084 0840 8408 4081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`
4. **Paystack sends webhook**: Automatically calls your webhook endpoint
5. **Check balance**: GET /wallet/balance (should be credited)

## 🔍 Viewing Webhook Logs

With your new logging system, you'll see:

```
[LOG] [HTTP] 📨 INCOMING REQUEST
[LOG] [HTTP] Method: POST
[LOG] [HTTP] URL: /wallet/paystack/webhook
⚠️  WARNING: Paystack signature verification is DISABLED for testing
```

This confirms the webhook was called and signature was bypassed!
