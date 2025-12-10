# Wallet Transfers Guide

## 💳 Understanding Wallet Numbers

### What is a Wallet Number?

A **wallet number** is a unique 13-digit identifier automatically generated when a user creates an account through Google OAuth. It's like a bank account number that others can use to send you money.

**Example**: `1733851234567`

### How Wallet Numbers are Generated

When you sign up via Google OAuth:

1. User account is created
2. A wallet is automatically created
3. A unique 13-digit wallet number is generated using:
   - Current timestamp (10 digits)
   - Random digits (3 digits)

## 📋 How to Get Your Wallet Number

### Option 1: Use the New API Endpoint

**GET `/wallet/info`**

**Request**:

```bash
curl -X GET "http://localhost:3000/wallet/info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:

```json
{
  "wallet_number": "1733851234567",
  "balance": 0,
  "created_at": "2025-12-10T18:00:00.000Z"
}
```

### Option 2: Check in Swagger UI

1. Go to http://localhost:3000/api/docs
2. Authenticate with your JWT token (click "Authorize" button)
3. Expand **GET `/wallet/info`**
4. Click "Try it out" → "Execute"
5. Copy your `wallet_number` from the response

## 💸 How to Transfer Money

### Prerequisites

1. **You need**: JWT token (login via `/auth/google`)
2. **You need**: Sufficient balance in your wallet
3. **You need**: Recipient's wallet number

### Transfer Workflow

#### Step 1: Get Recipient's Wallet Number

Ask the person you want to send money to for their wallet number. They can get it using **GET `/wallet/info`**.

#### Step 2: Make the Transfer

**POST `/wallet/transfer`**

**Request**:

```json
{
  "wallet_number": "1733851234567",
  "amount": 1000
}
```

**Parameters**:

- `wallet_number`: The recipient's 13-digit wallet number
- `amount`: Amount to transfer (in your currency, e.g., NGN)

**Response** (Success):

```json
{
  "status": "success",
  "message": "Transfer completed"
}
```

**Response** (Error - Insufficient Balance):

```json
{
  "statusCode": 400,
  "message": "Insufficient balance"
}
```

**Response** (Error - Invalid Wallet):

```json
{
  "statusCode": 404,
  "message": "Invalid wallet number"
}
```

### Step 3: Verify Transfer

Check your transaction history:

**GET `/wallet/transactions`**

You'll see:

```json
[
  {
    "id": "uuid-here",
    "type": "TRANSFER_OUT",
    "amount": 1000,
    "status": "SUCCESS",
    "recipient_wallet_number": "1733851234567",
    "created_at": "2025-12-10T19:30:00.000Z"
  }
]
```

## 🔒 Transfer Security & Rules

### Validations

✅ **Checks performed**:

- Wallet number exists
- Sufficient balance
- Cannot transfer to yourself
- Amount must be positive

### Atomicity

Transfers use **database transactions** with **pessimistic locking** to ensure:

- Money is never lost
- No race conditions
- Either completes fully or fails completely

### Transaction Records

Every transfer creates **two transaction records**:

1. **TRANSFER_OUT** - in sender's history (shows recipient wallet number)
2. **TRANSFER_IN** - in recipient's history (shows sender wallet ID in metadata)

## 📊 Complete Transfer Example

### Scenario

**Alice** (wallet: `1733851234567`) wants to send **₦2,000** to **Bob** (wallet: `1733859876543`)

### Alice's Steps:

1. **Check her balance**:

   ```bash
   GET /wallet/balance
   # Response: { "balance": 5000 }
   ```

2. **Initiate transfer**:

   ```bash
   POST /wallet/transfer
   {
     "wallet_number": "1733859876543",
     "amount": 2000
   }
   # Response: { "status": "success", "message": "Transfer completed" }
   ```

3. **Verify new balance**:

   ```bash
   GET /wallet/balance
   # Response: { "balance": 3000 }
   ```

4. **Check transaction**:
   ```bash
   GET /wallet/transactions
   # Shows: TRANSFER_OUT of 2000 to Bob's wallet
   ```

### Bob's View:

1. **Check balance** (now increased):

   ```bash
   GET /wallet/balance
   # Response: { "balance": 2000 }  # (assuming he had 0 before)
   ```

2. **Check transactions**:
   ```bash
   GET /wallet/transactions
   # Shows: TRANSFER_IN of 2000
   ```

## 🧪 Testing Transfers Locally

### Step-by-Step Test

1. **Login as User 1**:

   ```bash
   GET /auth/google
   # Get JWT token after OAuth flow
   ```

2. **Get User 1's wallet info**:

   ```bash
   GET /wallet/info
   # Copy wallet_number
   ```

3. **Add funds to User 1** (via deposit or webhook):

   ```bash
   POST /wallet/deposit
   { "amount": 10000 }
   ```

4. **Login as User 2** (use different Google account or create new user):

   ```bash
   GET /auth/google
   # Get different JWT token
   ```

5. **Get User 2's wallet number**:

   ```bash
   GET /wallet/info
   # Copy wallet_number
   ```

6. **Transfer from User 1 to User 2**:

   ```bash
   # Use User 1's JWT token
   POST /wallet/transfer
   {
     "wallet_number": "USER_2_WALLET_NUMBER",
     "amount": 1000
   }
   ```

7. **Verify both wallets**:
   - User 1: Check balance decreased
   - User 2: Check balance increased

## 🚫 Common Errors & Solutions

| Error                         | Cause                 | Solution                         |
| ----------------------------- | --------------------- | -------------------------------- |
| `Invalid wallet number`       | Wallet doesn't exist  | Double-check the wallet number   |
| `Insufficient balance`        | Not enough funds      | Deposit money first              |
| `Cannot transfer to yourself` | Same sender/recipient | Use different wallet number      |
| `Wallet not found`            | Your wallet missing   | Login via OAuth to create wallet |
| `Unauthorized`                | No/invalid JWT token  | Login again via `/auth/google`   |

## 📱 API Summary

| Endpoint               | Method | Purpose                          | Auth Required |
| ---------------------- | ------ | -------------------------------- | ------------- |
| `/wallet/info`         | GET    | Get your wallet number & balance | ✅ JWT        |
| `/wallet/balance`      | GET    | Get current balance only         | ✅ JWT        |
| `/wallet/transfer`     | POST   | Send money to another wallet     | ✅ JWT        |
| `/wallet/transactions` | GET    | View transfer history            | ✅ JWT        |

## 💡 Pro Tips

1. **Share Wallet Numbers Safely**: Your wallet number is public info (like email), but keep your JWT token private
2. **Check Balance First**: Always verify you have sufficient funds before transferring
3. **Keep Records**: Use `/wallet/transactions` to track all your transfers
4. **Test Small First**: When testing, start with small amounts
5. **Use API Keys**: For service-to-service transfers, use API keys instead of JWT

## 🔍 Viewing Logs

With the logging system enabled, you'll see detailed transfer logs in your terminal:

```
[LOG] [HTTP] 📨 INCOMING REQUEST
[LOG] [HTTP] Method: POST
[LOG] [HTTP] URL: /wallet/transfer
[LOG] [HTTP] Body: {
  "wallet_number": "1733859876543",
  "amount": 2000
}
[LOG] [HTTP] ✅ RESPONSE SENT
[LOG] [HTTP] Status: 200
[LOG] [HTTP] Response: {
  "status": "success",
  "message": "Transfer completed"
}
```

This helps you debug any transfer issues immediately!
