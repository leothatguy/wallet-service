# Authentication Guide

## 🔐 Two Authentication Methods

Your API supports **TWO** ways to authenticate:

### 1. **JWT Bearer Token** (for users)
- Used by **human users** logging in via Google OAuth
- Get it from `/auth/google` → `/auth/google/callback`
- Short-lived (expires in 24h)
- Tied to your Google account

### 2. **API Key** (for services/apps)
- Used by **applications and services**
- Get it from `/keys/create` endpoint
- Long-lived (configurable: 1H, 1D, 1M, 1Y)
- Has specific permissions (read, deposit, transfer)

---

## 🎯 When to Use Which?

| Scenario | Use This | Why |
|----------|----------|-----|
| Testing in Swagger UI | **JWT Token** | Easiest - just login via Google |
| Mobile/Web App | **JWT Token** | Users login with Google |
| Backend Service | **API Key** | No user interaction needed |
| CI/CD Pipeline | **API Key** | Automated processes |
| Cron Jobs | **API Key** | Scheduled tasks |

---

## 📱 How It Looks in Swagger UI

When you open an endpoint like `GET /wallet/balance`, you'll see:

### In the "Authorize" Dialog:

```
🔒 BearerAuth (http, Bearer)
   Value: [paste JWT token here]

🔑 api-key (apiKey)
   Value: [paste API key here]
```

### In Each Endpoint Header Section:

```
Headers:
  Authorization: Bearer <JWT>    ← JWT option
  x-api-key: <API key>          ← API key option
```

**You only need ONE of them!** Not both.

---

## ✅ How to Use in Swagger UI

### Option A: Using JWT Token (Recommended for Testing)

**Step 1: Get JWT Token**
1. In Swagger, go to `GET /auth/google`
2. Click "Try it out" → "Execute"
3. Copy the redirect URL and open in browser
4. Login with Google
5. You'll be redirected back with a JWT token in the response

**Step 2: Authorize in Swagger**
1. Click the **🔒 Authorize** button (top right)
2. In the **BearerAuth** section, paste your JWT token
3. Click "Authorize"
4. Leave **api-key** section empty
5. Click "Close"

**Step 3: Test Any Endpoint**
- All requests will now include: `Authorization: Bearer YOUR_JWT`

---

### Option B: Using API Key

**Step 1: Create API Key**
```json
POST /keys/create
{
  "name": "My Test Key",
  "permissions": ["read", "deposit", "transfer"],
  "expiry": "1M"
}
```

**Step 2: Authorize in Swagger**
1. Click the **🔒 Authorize** button
2. Leave **BearerAuth** section empty
3. In the **api-key** section, paste your API key (e.g., `sk_live_abc123...`)
4. Click "Authorize"
5. Click "Close"

**Step 3: Test Any Endpoint**
- All requests will now include: `x-api-key: YOUR_API_KEY`

---

## 🔄 The OR Logic

The authentication system works like this:

```
if (has_bearer_token) {
  ✅ Authenticate with JWT
} else if (has_api_key) {
  ✅ Authenticate with API key  
} else {
  ❌ Return 401 Unauthorized
}
```

**You don't need both!** The system tries JWT first, then API key.

---

## 💡 Behind the Scenes

### In Your Code:

```typescript
@Controller('wallet')
export class WalletController {
  @Get('balance')
  @UseGuards(ApiKeyOrJwtGuard)  // ← This accepts EITHER
  @RequirePermission(Permission.READ)
  getBalance(@Req() req: AuthenticatedRequest) {
    return this.walletService.getBalance(req.user.userId);
  }
}
```

The `ApiKeyOrJwtGuard` checks for:
1. **JWT in** `Authorization: Bearer <token>` header
2. **OR API key in** `x-api-key` header

---

## 🧪 Testing Examples

### Test 1: Using JWT

**Request:**
```bash
curl -X GET "http://localhost:3000/wallet/balance" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "balance": 15000
  }
}
```

### Test 2: Using API Key

**Request:**
```bash
curl -X GET "http://localhost:3000/wallet/balance" \
  -H "x-api-key: sk_live_abc123def456..."
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "balance": 15000
  }
}
```

### Test 3: Using Both (JWT Takes Priority)

**Request:**
```bash
curl -X GET "http://localhost:3000/wallet/balance" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "x-api-key: API_KEY"
```

**What happens:** System uses the JWT, ignores the API key.

---

## 🚫 Common Mistakes

### ❌ Mistake 1: Trying to Use Both
You **don't need both**. Pick one!

### ❌ Mistake 2: Wrong Header Format

**Wrong:**
```
Authorization: JWT_TOKEN_HERE
```

**Correct:**
```
Authorization: Bearer JWT_TOKEN_HERE
```

### ❌ Mistake 3: Using API Key as Bearer Token

**Wrong:**
```
Authorization: Bearer sk_live_abc123...
```

**Correct:**
```
x-api-key: sk_live_abc123...
```

---

## 📊 Permissions Comparison

| Action | JWT Token | API Key |
|--------|-----------|---------|
| **Permissions** | Full access (all operations) | Configurable (read, deposit, transfer) |
| **User Context** | ✅ Tied to Google account | ✅ Tied to user who created it |
| **Expiry** | Fixed (24h) | Configurable (1H-1Y) |
| **Security** | OAuth2 flow | Static key (keep secret!) |
| **Use Case** | Human users | Services/automation |

---

## 🎨 Visual: Swagger UI Setup

When you see this in Swagger:

```
┌─────────────────────────────────────┐
│  🔒 Authorize                       │
├─────────────────────────────────────┤
│                                     │
│  BearerAuth (http, Bearer)          │
│  ┌───────────────────────────────┐  │
│  │ eyJhbGciOiJIUzI1NiIsInR5...  │  │ ← Paste JWT here
│  └───────────────────────────────┘  │
│                                     │
│  OR                                 │
│                                     │
│  api-key (apiKey)                   │
│  ┌───────────────────────────────┐  │
│  │ sk_live_abc123def456...       │  │ ← Paste API key here
│  └───────────────────────────────┘  │
│                                     │
│  [ Authorize ]  [ Close ]           │
└─────────────────────────────────────┘
```

**Choose ONE of the two boxes above!**

---

## ✨ Quick Decision Guide

**Choose JWT if:**
- 🧑 Testing as a user in Swagger
- 📱 Building a user-facing app
- 🔄 Users need to login

**Choose API Key if:**
- 🤖 Building a backend service
- ⏰ Running scheduled jobs
- 🔧 No user interaction
- 📊 Need granular permissions

---

## 🔍 Debugging Auth Issues

### Issue: "Unauthorized" error

**Check:**
1. ✅ Did you click "Authorize" in Swagger?
2. ✅ Did you paste the token/key correctly?
3. ✅ Is your JWT expired? (valid for 24h)
4. ✅ Is your API key expired?
5. ✅ Does your API key have the required permission?

### Issue: "Forbidden" error

**Cause:** API key lacks required permission

**Solution:** Create a new API key with all permissions:
```json
{
  "name": "Full Access Key",
  "permissions": ["read", "deposit", "transfer"],
  "expiry": "1M"
}
```

---

## 📖 Summary

- **Two auth methods**: JWT (for users) OR API Key (for services)
- **Not both**: Use one or the other
- **In Swagger**: Fill only ONE of the "Authorize" fields
- **In Headers**: Send either `Authorization: Bearer <JWT>` OR `x-api-key: <key>`
- **Choice**: JWT for testing/users, API Key for automation

The "two API keys and authentication" you see is just Swagger showing both options. You only use one! 🎯
