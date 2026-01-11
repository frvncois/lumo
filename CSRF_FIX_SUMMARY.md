# CSRF Token Fix for Authentication Flow

## Problems Fixed

### Problem 1: Setup Endpoint CSRF Error
The `/api/auth/setup` endpoint was returning "CSRF token invalid" error, preventing initial project configuration. This occurred because:
1. CSRF protection was applied globally to all POST/PUT/DELETE requests
2. The setup endpoint runs BEFORE any user session exists
3. No CSRF token cookie was set yet during initial setup

### Problem 2: Authenticated Requests CSRF Error
After successful login or setup, authenticated requests (like creating schemas or posts) were failing with "CSRF token invalid" error. This occurred because:
1. Login and setup endpoints did NOT set the CSRF cookie
2. Users could authenticate successfully but had no CSRF token for subsequent requests
3. The CSRF middleware expected the token for all authenticated mutations

## Solution

### 1. Added CSRF Exemption for Pre-Auth Endpoints

Modified `/packages/server/src/utils/csrf.ts` to exempt specific paths from CSRF validation:

```typescript
const CSRF_EXEMPT_PATHS = [
  '/api/auth/setup',    // Initial project setup
  '/api/auth/status',   // Auth status check (pre-setup)
  '/api/auth/login',    // User login
  '/api/config',        // Public config endpoint
  '/health',            // Health check endpoint
]
```

These endpoints are exempt because:
- **setup**: No session exists yet during initial configuration
- **status**: Pre-authentication endpoint that sets CSRF token
- **login**: Accepts credentials before session is created
- **config**: Public endpoint with no side effects
- **health**: Monitoring endpoint

### 2. Enhanced Status Endpoint

Modified `/packages/server/src/routes/auth/index.ts` to:
- Generate and set CSRF token cookie on first request
- Return the token in the response body for easy frontend access

```typescript
app.get('/api/auth/status', async (request, reply) => {
  const needsSetup = !hasAnyUsers(app.db)

  // Generate CSRF token if not present
  let csrfToken = request.cookies.csrf
  if (!csrfToken) {
    csrfToken = generateCsrfToken()
    reply.setCookie('csrf', csrfToken, {
      httpOnly: false, // JS must read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }

  return { needsSetup, csrfToken }
})
```

### 3. Set CSRF Token on Login and Setup

Modified `/packages/server/src/routes/auth/index.ts` to set CSRF token after successful authentication:

**Setup endpoint** (lines 176-183):
```typescript
// Generate and set CSRF token for subsequent authenticated requests
const csrfToken = generateCsrfToken()
reply.setCookie('csrf', csrfToken, {
  httpOnly: false, // Must be readable by JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
})
```

**Login endpoint** (lines 274-281):
```typescript
// Generate and set CSRF token for subsequent authenticated requests
const csrfToken = generateCsrfToken()
reply.setCookie('csrf', csrfToken, {
  httpOnly: false, // Must be readable by JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
})
```

Both endpoints also return the `csrfToken` in the response body so the frontend can immediately use it.

## How It Works

### Setup Flow
1. User navigates to setup page
2. Frontend calls `GET /api/auth/status`
3. Server sets CSRF cookie and returns `{ needsSetup: true, csrfToken: "..." }`
4. User fills setup form
5. Frontend submits `POST /api/auth/setup` (no CSRF validation required - exempt)
6. Server creates user, sets session cookie, **sets CSRF cookie**, and returns `{ user, project, csrfToken }`
7. Frontend can now make authenticated requests using the CSRF token

### Login Flow (After Setup)
1. User navigates to login page
2. Frontend calls `GET /api/auth/status`
3. Server sets CSRF cookie and returns `{ needsSetup: false, csrfToken: "..." }`
4. User fills login form
5. Frontend submits `POST /api/auth/login` (no CSRF validation required - exempt)
6. Server verifies credentials, sets session cookie, **sets CSRF cookie**, and returns `{ user, csrfToken }`
7. Frontend can now make authenticated requests using the CSRF token

### Authenticated Requests
All authenticated POST/PUT/DELETE requests (except exempt paths) require:
- CSRF cookie set by server (with `httpOnly: false` so JavaScript can read it)
- `x-csrf-token` header matching the cookie value

The frontend should:
1. Read the CSRF token from the cookie OR from the login/setup response
2. Include it in the `x-csrf-token` header for all authenticated mutations

## Testing

### Test 1: Fresh Setup
```bash
# Clear all cookies
# Open browser DevTools → Application → Cookies → Clear all

# Navigate to http://localhost:3000
# Check Network tab

# Expected:
# 1. GET /api/auth/status → 200 OK
#    Response: { needsSetup: true, csrfToken: "..." }
#    Set-Cookie: csrf=...
#
# 2. POST /api/auth/setup → 201 Created (or 200 OK)
#    No CSRF error
#    Setup succeeds
```

### Test 2: Login After Setup
```bash
# Clear cookies again
# Navigate to http://localhost:3000/admin

# Expected:
# 1. GET /api/auth/status → 200 OK
#    Response: { needsSetup: false, csrfToken: "..." }
#    Set-Cookie: csrf=...
#
# 2. POST /api/auth/login → 200 OK
#    No CSRF error
#    Login succeeds
```

### Test 3: Authenticated Endpoint (Should Require CSRF)
```bash
# After logging in
# Try creating content without CSRF token

curl -X POST http://localhost:3000/api/admin/posts \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"type":"blog","status":"draft"}'

# Expected: 403 Forbidden
# Response: { error: { code: "CSRF_MISSING", message: "CSRF token missing" } }

# Try with CSRF token
curl -X POST http://localhost:3000/api/admin/posts \
  -H "Cookie: session=...; csrf=..." \
  -H "x-csrf-token: <token-value>" \
  -H "Content-Type: application/json" \
  -d '{"type":"blog","status":"draft"}'

# Expected: 201 Created (or validation error if invalid data)
```

## Security Considerations

### Why These Exemptions Are Safe

1. **setup**: Can only be called once (before any users exist). After first user is created, returns error.

2. **login**: Accepts only email/password. No state-changing side effects beyond creating a session. Protected by:
   - Rate limiting (5 attempts per 15 min)
   - Audit logging
   - bcrypt password verification

3. **status**: Read-only endpoint, no side effects

4. **config**: Read-only public data

5. **health**: Monitoring only, no authentication

### What's Still Protected

All authenticated endpoints remain CSRF-protected:
- `/api/admin/*` (all admin routes)
- `/api/me/password` (password change)
- Any POST/PUT/DELETE after login

## Files Modified

1. `packages/server/src/utils/csrf.ts`
   - Added `CSRF_EXEMPT_PATHS` array
   - Updated `csrfProtection()` middleware to check exemptions

2. `packages/server/src/routes/auth/index.ts`
   - Imported `generateCsrfToken`
   - Enhanced `/api/auth/status` to set and return CSRF token (lines 91-112)
   - Enhanced `/api/auth/setup` to set and return CSRF token (lines 176-183, 203)
   - Enhanced `/api/auth/login` to set and return CSRF token (lines 274-281, 296)

## Related Documentation

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- Double Submit Cookie Pattern (used in this implementation)
- SameSite cookie attribute for additional protection
