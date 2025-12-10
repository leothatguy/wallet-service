# API Key Rollover Guide

## 🔄 What is API Key Rollover?

Rollover allows you to replace an expired or soon-to-expire API key with a new one, while keeping the same permissions. This ensures continuous service without interruption.

## 🎯 When to Rollover

You can rollover an API key when:

- ✅ The key has expired
- ✅ The key is expiring within **7 days**

This gives you time to update your services before the old key stops working.

## 📝 How to Rollover (Two Ways!)

### Option 1: Using the API Key Itself (Recommended)

**Best for**: When you only have the API key string

**Endpoint**: `POST /keys/rollover`

**Request**:

```json
{
  "api_key": "sk_live_abc123def456...",
  "expiry": "1M"
}
```

**Why this is better**: You don't need to remember or store the key ID - just use the actual key!

### Option 2: Using the Key ID

**Best for**: When you have the key ID stored

**Endpoint**: `POST /keys/rollover`

**Request**:

```json
{
  "expired_key_id": "123e4567-e89b-12d3-a456-426614174000",
  "expiry": "1M"
}
```

## 🔧 Complete Rollover Example

### Step 1: Check if Your Key is Expiring

If your API starts returning `401 Unauthorized`, your key might be expired.

### Step 2: Rollover the Key

**Using Swagger UI**:

1. Go to http://localhost:3000/api/docs
2. Login with JWT (click "Authorize")
3. Find **POST `/keys/rollover`**
4. Click "Try it out"
5. Enter your request:

**Using the API key directly**:

```json
{
  "api_key": "sk_live_your_current_key_here",
  "expiry": "1M"
}
```

**Using curl**:

```bash
curl -X POST "http://localhost:3000/keys/rollover" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk_live_your_current_key_here",
    "expiry": "1M"
  }'
```

### Step 3: Get Your New Key

**Response**:

```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "api_key": "sk_live_NEW_KEY_HERE",
    "expires_at": "2026-01-10T18:00:00.000Z"
  }
}
```

### Step 4: Update Your Services

**IMPORTANT**: Replace the old key with the new key in your services immediately!

**What happens to the old key?**

- ✅ Automatically deactivated
- ❌ Can no longer be used
- 📝 Remains in database for audit purposes

## ⏰ Expiry Options

| Code | Duration | Best For                       |
| ---- | -------- | ------------------------------ |
| `1H` | 1 Hour   | Testing/debugging              |
| `1D` | 1 Day    | Short-term tasks               |
| `1M` | 1 Month  | **Recommended** for production |
| `1Y` | 1 Year   | Long-running services          |

## 🔒 What Gets Preserved?

When you rollover a key, the new key inherits:

- ✅ **Same name** as the old key
- ✅ **Same permissions** (read, deposit, transfer)
- ✅ **Same user ownership**

What changes:

- 🆕 **New API key string**
- 🆕 **New expiration date**
- 🆕 **New key ID** (UUID)

## 🚫 Common Errors & Solutions

### Error: "API key not found"

**Cause**: The key doesn't exist or doesn't belong to you

**Solutions**:

- Check you copied the full API key correctly
- Verify you're logged in as the correct user
- Make sure the key hasn't been deleted

### Error: "API key must be expired or expiring within 7 days to rollover"

**Cause**: The key isn't close enough to expiry

**Solution**: Wait until the key is within 7 days of expiry, or create a new key instead

### Error: "Either api_key or expired_key_id must be provided"

**Cause**: You didn't provide either field

**Solution**: Include one of:

```json
{ "api_key": "sk_live_...", "expiry": "1M" }
```

OR

```json
{ "expired_key_id": "uuid-here", "expiry": "1M" }
```

## 💡 Best Practices

### 1. **Set Calendar Reminders**

Set a reminder 7 days before your key expires to rollover in advance.

### 2. **Store Keys Securely**

- Use environment variables
- Never commit to git
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault)

### 3. **Document Which Keys Are Used Where**

Keep a record of which services use which API keys:

```
Production API: sk_live_abc... (expires 2025-12-25)
Staging API: sk_live_def... (expires 2025-12-20)
```

### 4. **Rollover Before Expiry**

Don't wait for the key to expire! Rollover when you get the warning (within 7 days).

### 5. **Update All Services**

If you use the same key in multiple places:

1. Generate new key
2. Update ALL services that use it
3. Test to ensure they all work
4. Old key is automatically deactivated

## 📊 Rollover vs Create New Key

| Action         | When to Use                                        | Old Key Status            |
| -------------- | -------------------------------------------------- | ------------------------- |
| **Rollover**   | Replace expired/expiring key with same permissions | Deactivated automatically |
| **Create New** | Need different permissions or not yet expired      | Remains active            |

## 🧪 Testing Rollover

Want to test the rollover flow?

1. **Create a 1H key**:

```json
POST /keys/create
{
  "name": "Test Key",
  "permissions": ["read"],
  "expiry": "1H"
}
```

2. **Wait 54 minutes** (key now expires in 6 minutes - within 7 day window)

3. **Rollover the key**:

```json
POST /keys/rollover
{
  "api_key": "sk_live_test_key_here",
  "expiry": "1D"
}
```

4. **Verify**: Old key doesn't work, new key does!

## 🔍 Example Workflow

**Scenario**: Your production API key is expiring in 3 days

**Day 1** (3 days before expiry):

```bash
# 1. Rollover the key
curl -X POST "http://localhost:3000/keys/rollover" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk_live_old_production_key",
    "expiry": "1M"
  }'

# Response: { "api_key": "sk_live_NEW_KEY", ... }
```

**Day 1 - Later**:

```bash
# 2. Update your production environment variable
export API_KEY="sk_live_NEW_KEY"

# 3. Restart your production services
docker-compose restart
```

**Day 1 - Evening**:

```bash
# 4. Verify the new key works
curl -X GET "http://localhost:3000/wallet/balance" \
  -H "x-api-key: sk_live_NEW_KEY"

# ✅ Should return wallet balance
```

**Done!** Your services continue running without interruption! 🎉

## 📱 Quick Reference

**Rollover with API key**:

```json
POST /keys/rollover
{
  "api_key": "sk_live_current_key",
  "expiry": "1M"
}
```

**Rollover with key ID**:

```json
POST /keys/rollover
{
  "expired_key_id": "uuid-of-key",
  "expiry": "1M"
}
```

**Response**:

```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "api_key": "sk_live_new_key",
    "expires_at": "2026-01-10T..."
  }
}
```

---

**Remember**: The rollover automatically deactivates your old key, so update your services immediately with the new key! 🔑
