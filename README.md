# Wallet Service Backend

A production-ready wallet service API that enables users to deposit money using Paystack, manage wallet balances, view transaction history, and transfer funds between users. Supports dual authentication via JWT (Google OAuth) and API keys for service-to-service access.

---

## 🎯 Features

- ✅ **Google OAuth Authentication** - Secure user sign-in with JWT tokens
- ✅ **API Key Management** - Service-to-service access with permission controls
- ✅ **Paystack Integration** - Seamless deposit flow with webhook handlers
- ✅ **Wallet Operations** - Balance tracking, transfers, and transaction history
- ✅ **Permission System** - Granular access control for API keys
- ✅ **Security** - Webhook signature validation, atomic transactions, idempotency

---

## 📋 Prerequisites

Before you begin, ensure you have the following:

### Required Accounts & API Keys

1. **Paystack Account**
   - Sign up at [paystack.com](https://paystack.com)
   - Navigate to: Settings → API Keys & Webhooks
   - Copy your Secret Key (starts with `sk_test_` or `sk_live_`)

2. **Google Cloud Console**
   - Create a project at [console.cloud.google.com](https://console.cloud.google.com)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Client Secret

3. **PostgreSQL Database**
   - Install locally: [postgresql.org/download](https://www.postgresql.org/download/)
   - Or use cloud providers: [Supabase](https://supabase.com), [Neon](https://neon.tech), [Railway](https://railway.app)

### Technology Requirements

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or **npm**
- **PostgreSQL** (v14 or higher)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wallet_db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_256_bits
JWT_EXPIRY=24h

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# API Keys
API_KEY_SECRET=your_api_key_encryption_secret
```

### 3. Database Setup

Run database migrations:

```bash
pnpm run migration:run
```

### 4. Start the Development Server

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

Server will start at `http://localhost:3000` 🎉

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

All wallet endpoints require either:

- `Authorization: Bearer <jwt_token>` (for users)
- `x-api-key: <api_key>` (for services)

---

### Endpoints

#### 1. **Google Authentication**

**Initiate Sign-In**

```http
GET /auth/google
```

Redirects to Google OAuth consent screen.

**OAuth Callback**

```http
GET /auth/google/callback
```

Returns JWT token after successful authentication.

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

#### 2. **API Key Management**

**Create API Key**

```http
POST /keys/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "wallet-service",
  "permissions": ["deposit", "transfer", "read"],
  "expiry": "1D"
}
```

**Expiry Options:** `1H` (1 hour), `1D` (1 day), `1M` (1 month), `1Y` (1 year)

**Response:**

```json
{
  "api_key": "sk_live_abc123xyz789...",
  "expires_at": "2025-12-10T23:11:34Z"
}
```

**Rollover Expired Key**

```http
POST /keys/rollover
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "expired_key_id": "uuid",
  "expiry": "1M"
}
```

---

#### 3. **Wallet Operations**

**Get Balance**

```http
GET /wallet/balance
Authorization: Bearer <jwt_token>
# OR
x-api-key: sk_live_abc123...
```

**Response:**

```json
{
  "balance": 15000
}
```

**Deposit (Initialize)**

```http
POST /wallet/deposit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 5000
}
```

**Response:**

```json
{
  "reference": "TXN_1733786294_a1b2c3d4",
  "authorization_url": "https://checkout.paystack.com/abc123"
}
```

**Check Deposit Status**

```http
GET /wallet/deposit/{reference}/status
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "reference": "TXN_1733786294_a1b2c3d4",
  "status": "success",
  "amount": 5000
}
```

**Transfer Funds**

```http
POST /wallet/transfer
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "wallet_number": "4566678954356",
  "amount": 3000
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Transfer completed"
}
```

**Transaction History**

```http
GET /wallet/transactions
Authorization: Bearer <jwt_token>
```

**Response:**

```json
[
  {
    "id": "uuid",
    "type": "deposit",
    "amount": 5000,
    "status": "success",
    "created_at": "2025-12-09T20:00:00Z"
  },
  {
    "id": "uuid",
    "type": "transfer_out",
    "amount": 3000,
    "status": "success",
    "recipient_wallet_number": "4566678954356",
    "created_at": "2025-12-09T21:00:00Z"
  }
]
```

---

#### 4. **Paystack Webhook**

```http
POST /wallet/paystack/webhook
x-paystack-signature: <signature>
Content-Type: application/json
```

This endpoint is called automatically by Paystack to confirm payments.

---

## 🔐 Security Features

### Webhook Signature Validation

All Paystack webhooks are validated using HMAC SHA512:

```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest('hex');
```

### API Key Security

- Keys are hashed using bcrypt before storage
- Maximum 5 active keys per user
- Automatic expiry validation
- Permission-based access control

### Transaction Safety

- Atomic database transactions
- Row-level locking for balance updates
- Idempotent webhook processing
- Duplicate reference prevention

---

## 🧪 Testing

Run the test suite:

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

---

## 🚢 Deployment

### 1. Production Environment Variables

Update `.env` for production:

- Set `NODE_ENV=production`
- Use Paystack live keys (`sk_live_...`)
- Set strong secrets (min 256 bits)
- Use production database URL

### 2. Configure Paystack Webhook

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/wallet/paystack/webhook`
3. Test webhook delivery
4. Monitor delivery logs

### 3. Deploy to Cloud

**Recommended Platforms:**

- Railway
- Render
- Heroku
- AWS EC2 + RDS
- DigitalOcean App Platform

---

## 📊 Database Schema

### Users

- `id` (UUID, Primary Key)
- `email` (Unique)
- `google_id` (Unique)
- `name`
- `created_at`, `updated_at`

### Wallets

- `id` (UUID, Primary Key)
- `user_id` (Foreign Key → Users)
- `wallet_number` (13-digit unique)
- `balance` (Decimal)
- `created_at`, `updated_at`

### Transactions

- `id` (UUID, Primary Key)
- `wallet_id` (Foreign Key → Wallets)
- `type` (deposit | transfer_in | transfer_out)
- `amount` (Decimal)
- `status` (pending | success | failed)
- `reference` (Unique, for Paystack)
- `recipient_wallet_id` (Optional, for transfers)
- `metadata` (JSONB)
- `created_at`, `updated_at`

### API Keys

- `id` (UUID, Primary Key)
- `user_id` (Foreign Key → Users)
- `name`
- `key_hash` (Hashed)
- `permissions` (Array: deposit, transfer, read)
- `expires_at`
- `is_active` (Boolean)
- `created_at`, `updated_at`

---

## 📖 API Key Permissions

| Permission | Allows                                            |
| ---------- | ------------------------------------------------- |
| `read`     | View balance, transaction history, deposit status |
| `deposit`  | Initialize deposits                               |
| `transfer` | Transfer funds to other wallets                   |

---

## ⚠️ Important Notes

### Wallet Crediting

> **CRITICAL:** Only the Paystack webhook endpoint (`/wallet/paystack/webhook`) is allowed to credit wallet balances. The status check endpoint (`/wallet/deposit/{reference}/status`) is read-only.

### Idempotency

- Paystack references are unique
- Webhooks check transaction status before crediting
- Prevents double-crediting on duplicate events

### Transfer Limits

- Transfers must have sufficient balance
- Self-transfers are prevented
- Invalid wallet numbers are rejected

### API Key Limits

- Maximum 5 active keys per user
- Expired keys are auto-rejected
- Rollover only works for expired keys

---

## 🐛 Troubleshooting

### Common Issues

**JWT Token Invalid**

- Ensure `JWT_SECRET` matches between environments
- Check token hasn't expired (default: 24h)

**Paystack Webhook Fails**

- Verify webhook URL is publicly accessible
- Check `PAYSTACK_SECRET_KEY` is correct
- Ensure signature validation logic is correct

**Insufficient Balance Error**

- Check wallet balance is sufficient
- Verify amount is in correct currency unit (kobo for NGN)

**API Key Rejected**

- Confirm key hasn't expired
- Verify key has required permissions
- Check user hasn't exceeded 5 active keys

---

## 📄 Project Documentation

For detailed implementation guides, please refer to:

- **Implementation Plan**: `.gemini/antigravity/brain/141dab1a-46b5-4d2c-9dea-981fb76058a7/implementation_plan.md`
- **Task Breakdown**: `.gemini/antigravity/brain/141dab1a-46b5-4d2c-9dea-981fb76058a7/task.md`

---

## 🏗️ Built With

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **TypeORM** / **Prisma** - ORM
- **Passport.js** - Authentication
- **Paystack** - Payment gateway
- **JWT** - Token-based auth

---

## 🎓 Learning Resources

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [NestJS Documentation](https://docs.nestjs.com)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 📞 Support

For questions or support, please open an issue in the repository.

---

**Happy Coding! 🚀**
