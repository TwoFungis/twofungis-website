# Auth Testing Playbook for TradeOS

## Emergent Google OAuth Testing

### Test Flow
1. Click "Sign in with Google" button
2. User is redirected to `https://auth.emergentagent.com/`
3. User authenticates with Google
4. User returns to `{redirect_url}#session_id={session_id}`
5. AuthCallback component processes session_id
6. Backend exchanges session_id for user data
7. User is redirected to Command Center

### Backend Test Commands

```bash
# Test auth callback endpoint
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST "$API_URL/api/auth/google/callback" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test_session_id"}'

# Test auth/me endpoint with session token
curl -X GET "$API_URL/api/auth/me" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"
```

### Browser Testing with Playwright

```javascript
// Set test session cookie
await page.context().addCookies([{
    name: "session_token",
    value: "YOUR_SESSION_TOKEN",
    domain: "your-app-domain.com",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "None"
}]);
await page.goto("https://your-app-domain.com/app/command-center");
```

### Debug Commands

```bash
# Check if auth routes are registered
curl -s "$API_URL/api/health" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"
```

### Success Indicators
- ✅ Google OAuth redirect works
- ✅ Session cookie is set after callback
- ✅ /api/auth/me returns user data
- ✅ Protected routes load without redirect to login
- ✅ Logout clears session

### Failure Indicators
- ❌ "Session not found" errors
- ❌ 401 Unauthorized responses
- ❌ Redirect loop to login page
- ❌ CORS errors in console
