# API Response Formats

This document describes the standardized response and error formats used across the Wallet Service API.

## ✅ Success Response Format

All successful API responses follow this structure:

```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    // ... actual response data
  }
}
```

### Fields

| Field         | Type   | Description                              |
| ------------- | ------ | ---------------------------------------- |
| `status_code` | number | HTTP status code (200, 201, etc.)        |
| `message`     | string | Success message describing the operation |
| `data`        | any    | The actual response payload              |

### Example Responses

**Get Wallet Info** (200):

```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "wallet_number": "1733851234567",
    "balance": 15000,
    "created_at": "2025-12-10T18:00:00.000Z"
  }
}
```

**Deposit Initiated** (201):

```json
{
  "status_code": 201,
  "message": "Resource created successfully",
  "data": {
    "reference": "TXN_1234567890_abc123",
    "authorization_url": "https://paystack.co/checkout/..."
  }
}
```

**Transfer Success** (200):

```json
{
  "status_code": 200,
  "message": "Request successful",
  "data": {
    "status": "success",
    "message": "Transfer completed"
  }
}
```

## ❌ Error Response Format

All error responses follow this structure:

```json
{
  "error": "Bad Request",
  "status_code": 400,
  "message": "Specific error message",
  "timestamp": "2025-12-10T18:00:00.000Z",
  "path": "/wallet/transfer"
}
```

### Fields

| Field         | Type   | Description                               |
| ------------- | ------ | ----------------------------------------- |
| `error`       | string | Human-readable error type                 |
| `status_code` | number | HTTP error status code                    |
| `message`     | string | Detailed error message                    |
| `timestamp`   | string | ISO 8601 timestamp of when error occurred |
| `path`        | string | API endpoint path that caused the error   |

### Common Error Types

| Status Code | Error Type            | Description                                  |
| ----------- | --------------------- | -------------------------------------------- |
| 400         | Bad Request           | Invalid request data or business logic error |
| 401         | Unauthorized          | Missing or invalid authentication            |
| 403         | Forbidden             | Insufficient permissions                     |
| 404         | Not Found             | Resource doesn't exist                       |
| 409         | Conflict              | Resource conflict                            |
| 422         | Unprocessable Entity  | Validation failed                            |
| 500         | Internal Server Error | Unexpected server error                      |

### Example Error Responses

**Insufficient Balance** (400):

```json
{
  "error": "Bad Request",
  "status_code": 400,
  "message": "Insufficient balance",
  "timestamp": "2025-12-10T18:30:00.000Z",
  "path": "/wallet/transfer"
}
```

**Unauthorized** (401):

```json
{
  "error": "Unauthorized",
  "status_code": 401,
  "message": "No authorization token was found",
  "timestamp": "2025-12-10T18:30:00.000Z",
  "path": "/wallet/balance"
}
```

**Wallet Not Found** (404):

```json
{
  "error": "Not Found",
  "status_code": 404,
  "message": "Invalid wallet number",
  "timestamp": "2025-12-10T18:30:00.000Z",
  "path": "/wallet/transfer"
}
```

**Validation Error** (400):

```json
{
  "error": "Bad Request",
  "status_code": 400,
  "message": ["amount must not be less than 100", "amount must be a number"],
  "timestamp": "2025-12-10T18:30:00.000Z",
  "path": "/wallet/deposit"
}
```

## 🔧 Implementation Details

### Response Transform Interceptor

Located at: `src/common/interceptors/response-transform.interceptor.ts`

This interceptor automatically wraps all successful responses in the standardized format:

- Adds `status_code` based on HTTP response
- Adds appropriate `message` for the status code
- Wraps original response in `data` field

### Exception Filter

Located at: `src/common/filters/http-exception.filter.ts`

This global filter catches all exceptions and formats them consistently:

- Maps status codes to error types
- Extracts detailed error messages
- Adds timestamp and path information
- Logs full error details to console

## 📊 Status Code Messages

### Success Messages (2xx)

| Code | Message                       |
| ---- | ----------------------------- |
| 200  | Request successful            |
| 201  | Resource created successfully |
| 204  | Request successful            |

### Error Messages (4xx/5xx)

Error messages are dynamic based on the specific exception thrown.

## 🎯 Best Practices

### For Frontend Developers

**Handling Successful Responses**:

```javascript
const response = await fetch('/wallet/info');
const { status_code, message, data } = await response.json();

if (status_code === 200) {
  console.log(data.wallet_number); // Access actual data
}
```

**Handling Errors**:

```javascript
try {
  const response = await fetch('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify({ wallet_number: '...', amount: 1000 }),
  });

  const result = await response.json();

  if (!response.ok) {
    // Error response
    console.error(`${result.error}: ${result.message}`);
    // Show user-friendly error
    alert(result.message);
  } else {
    // Success response
    console.log(result.data);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### For Backend Developers

**Service Methods** - Just return the data:

```typescript
async getWalletInfo(userId: string) {
  const wallet = await this.walletRepository.findOne({ where: { userId } });

  if (!wallet) {
    throw new NotFoundException('Wallet not found');
  }

  // Return plain data - interceptor will wrap it
  return {
    wallet_number: wallet.walletNumber,
    balance: Number(wallet.balance),
    created_at: wallet.createdAt,
  };
}
```

**Throwing Errors** - Use NestJS exceptions:

```typescript
// Bad Request
throw new BadRequestException('Insufficient balance');

// Not Found
throw new NotFoundException('Invalid wallet number');

// Unauthorized
throw new UnauthorizedException('Invalid credentials');

// Forbidden
throw new ForbiddenException('Missing required permission');
```

## 🔍 Logging

All requests and responses are logged with the standardized formats:

**Successful Request Log**:

```
[LOG] [HTTP] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[LOG] [HTTP] 📨 INCOMING REQUEST
[LOG] [HTTP] Method: GET
[LOG] [HTTP] URL: /wallet/info
[LOG] [HTTP] ─────────────────────────────────────────
[LOG] [HTTP] ✅ RESPONSE SENT
[LOG] [HTTP] Status: 200
[LOG] [HTTP] Response: {
  "status_code": 200,
  "message": "Request successful",
  "data": { "wallet_number": "..." }
}
```

**Error Request Log**:

```
[ERROR] [ExceptionFilter] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ERROR] [ExceptionFilter] 🚨 EXCEPTION CAUGHT
[ERROR] [ExceptionFilter] Status: 400
[ERROR] [ExceptionFilter] Message: Insufficient balance
[ERROR] [ExceptionFilter] Stack Trace: ...
```

## 📝 Swagger Documentation

All Swagger documentation has been updated to reflect these standardized formats. Check any endpoint in the Swagger UI at `/api/docs` to see example responses.

## ✨ Benefits

1. **Consistency**: All endpoints return the same structure
2. **Easy Parsing**: Frontend can handle all responses uniformly
3. **Better DX**: Clear, predictable API behavior
4. **Debugging**: Detailed error information with timestamps and paths
5. **Logging**: Comprehensive request/response tracking
