# 🔍 Debug Agent 403 Error - Step by Step

## Frontend Analysis ✅

I've verified the frontend code - **everything is configured correctly**:

1. ✅ **Auth Token**: Properly sent in request headers
   ```typescript
   // src/lib/axios.ts line 15-17
   const token = localStorage.getItem('token');
   config.headers.Authorization = `Bearer ${token}`;
   ```

2. ✅ **Login Field**: Using "identifier" (not "email")
   ```typescript
   // src/features/auth/LoginPage.tsx line 39
   identifier: '',  // Correct field name
   ```

3. ✅ **Permission Checks**: SalesAgent is allowed
   ```typescript
   // src/hooks/useAuth.ts line 15
   const canCreate = () => hasRole(['Admin', 'Manager', 'SalesAgent']);
   ```

4. ✅ **Route Access**: No restrictions on Orders page
   ```typescript
   // src/routes/index.tsx line 81
   <Route path="/orders" element={<OrdersPage />} />  // No allowedRoles prop
   ```

5. ✅ **No Client-Side Blocking**: OrderForm has no role checks

## 🧪 Debugging Steps

### Step 1: Clear Browser Cache (CRITICAL)

```bash
# In your browser:
1. Press: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select: "Cached images and files" + "Cookies and site data"
3. Time range: "All time"
4. Click: "Clear data"

# Or use Hard Refresh:
1. Press: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 2: Verify Token Contains Role

Open Browser Console (F12) and run:

```javascript
// Check stored token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decode JWT token (if it's a JWT)
if (token) {
  const parts = token.split('.');
  if (parts.length === 3) {
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token Payload:', payload);
    console.log('User Role:', payload.role);
  }
}

// Check stored user
const user = JSON.parse(localStorage.getItem('user'));
console.log('Stored User:', user);
console.log('User Role:', user?.role);
```

**Expected Output:**
```json
{
  "id": 3,
  "email": "agent@oasis.mn",
  "role": "SalesAgent",  // ← Must be exactly "SalesAgent"
  ...
}
```

### Step 3: Check Network Request

1. Open DevTools (F12) → Network tab
2. Click "Create Order" and submit form
3. Find the POST request to `/api/orders`
4. Check:

**Request Headers:**
```
Authorization: Bearer eyJhbGc... (should be present)
Content-Type: application/json
```

**Request Payload:**
```json
{
  "customerId": 1,
  "paymentMethod": "Cash",
  "items": [...]
}
```

**Response:**
```json
// If 403:
{
  "status": "error",
  "message": "You do not have permission..."
}

// If 200/201:
{
  "status": "success",
  "data": { "order": {...} }
}
```

### Step 4: Test Backend Directly (Bypass Frontend)

```bash
# 1. Login as agent to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "agent@oasis.mn",
    "password": "agent123"
  }'

# Copy the token from response

# 2. Try to create order with that token
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "customerId": 1,
    "paymentMethod": "Cash",
    "items": [{"productId": 1, "quantity": 10}]
  }'

# What do you get?
# - 403 = Backend is blocking (backend issue)
# - 200/201 = Success (frontend issue, probably cache)
# - 401 = Token invalid (login again)
```

## 🎯 Common Issues & Solutions

### Issue 1: Role Name Mismatch

**Problem**: Backend expects different role name

```javascript
// Backend might expect:
'sales_agent'    // ❌
'salesagent'     // ❌
'Sales Agent'    // ❌
'SALESAGENT'     // ❌

// But sending:
'SalesAgent'     // ✅ Correct
```

**Solution**: Check backend role constants match exactly

### Issue 2: Token Not Refreshed After Login

**Problem**: Old token without role information

**Solution**:
```javascript
// Clear and login again
localStorage.clear();
// Then login as agent
```

### Issue 3: Backend Middleware Order

**Problem**: Permission check runs before role is set

```javascript
// BAD ORDER:
app.use(checkPermissions);  // ❌ Runs first
app.use(authenticate);       // Role set here

// GOOD ORDER:
app.use(authenticate);       // ✅ Set role first
app.use(checkPermissions);   // Then check permission
```

### Issue 4: CORS/Proxy Issues

**Problem**: Request not reaching backend

**Solution**: Check vite.config.ts proxy:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // ✅ Correct backend URL?
    changeOrigin: true,
    secure: false,
  }
}
```

## 🔬 Advanced Debugging

### Enable Axios Request Logging

Add to `src/lib/axios.ts` line 20:

```typescript
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ADD THIS FOR DEBUGGING:
    console.log('🚀 API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });
    
    return config;
  },
  ...
);
```

### Check Backend Logs

Look for these in your backend console:

```bash
# Good signs:
✅ "POST /api/orders 201 - 123ms"
✅ "User: agent@oasis.mn (SalesAgent)"

# Bad signs:
❌ "POST /api/orders 403 - 12ms"
❌ "Permission denied: SalesAgent"
❌ "Invalid role for order creation"
```

## 📊 Diagnostic Checklist

Run through this checklist:

```
Frontend:
✅ Token is stored in localStorage('token')
✅ User object stored in localStorage('user')
✅ User.role === 'SalesAgent' (exact match)
✅ Auth interceptor adds Bearer token
✅ No console errors in browser
✅ Create Order button is visible
✅ Form submits without client-side errors

Network:
✅ Request reaches backend (check Network tab)
✅ Authorization header is present
✅ Token is not empty or undefined
✅ Response is 403 (not 401 or 500)

Backend:
⚠️ Check backend logs for the request
⚠️ Verify role name in backend matches 'SalesAgent'
⚠️ Check permission middleware configuration
⚠️ Verify authentication middleware runs first
```

## 🎬 Quick Test Script

Copy this into browser console after logging in as agent:

```javascript
// Complete diagnostic
(async function() {
  console.log('=== AGENT PERMISSION DIAGNOSTIC ===\n');
  
  // 1. Check localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  console.log('1. LocalStorage Check:');
  console.log('   Token exists:', !!token);
  console.log('   Token length:', token?.length);
  console.log('   User:', user);
  console.log('   User role:', user?.role);
  console.log('   Role type:', typeof user?.role);
  
  // 2. Decode JWT
  if (token) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      console.log('\n2. JWT Payload:');
      console.log('   Role in token:', payload.role);
      console.log('   Token issued:', new Date(payload.iat * 1000));
      console.log('   Token expires:', payload.exp ? new Date(payload.exp * 1000) : 'No expiry');
    } catch (e) {
      console.log('\n2. JWT Decode Failed:', e.message);
    }
  }
  
  // 3. Test API call
  console.log('\n3. Testing Order Creation API:');
  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customerId: 1,
        paymentMethod: 'Cash',
        items: [{ productId: 1, quantity: 1 }]
      })
    });
    
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('   Response:', data);
    
    if (response.status === 403) {
      console.log('\n❌ 403 FORBIDDEN - Backend is blocking!');
      console.log('   Message:', data.message);
    } else if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ SUCCESS - Backend allows creation!');
    }
  } catch (error) {
    console.log('\n❌ Request Failed:', error.message);
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
})();
```

## 🎯 Next Steps Based on Results

### If token has wrong role:
→ Backend login endpoint not setting role correctly
→ Fix backend auth response

### If token is correct but still 403:
→ Backend permission check is wrong
→ Fix backend order creation endpoint

### If request doesn't reach backend:
→ Frontend proxy/CORS issue
→ Check vite.config.ts and backend CORS settings

### If no token at all:
→ Login not working
→ Check authStore.setAuth() is called

---

**Run the diagnostic script above and share the console output!**

That will tell us exactly where the problem is.

