# 🚀 WAREHOUSE-WEB SETUP

## Architecture:
```
warehouse-web (Frontend)  ←→  warehouse-service (Backend)
Port: 5173                    Port: 3000
```

## Setup Steps:

### 1. Install dependencies (if needed)
```bash
cd /Users/tuguldur.tu/warehouse-web
npm install
```

### 2. Create .env.local file
```bash
# Create .env.local with:
VITE_API_URL=http://localhost:3000/api
```

### 3. Update vite.config.ts (add proxy)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 4. Start development server
```bash
npm run dev
```

### 5. Open browser
```
http://localhost:5173
```

### 6. Login credentials
```
Email: admin@oasis.mn
Password: admin123
```

## Backend (warehouse-service) must be running:
```bash
cd /Users/tuguldur.tu/warehouse-service
podman-compose up -d
```

## File Structure:
```
warehouse-web/
├── src/
│   ├── components/
│   │   └── auth/           ← NEW: Login, Register, ProtectedRoute
│   ├── services/           ← NEW: API services
│   ├── config/
│   │   └── api.ts          ← NEW: Axios config
│   ├── App.tsx             ← UPDATED: Auth routes
│   └── ...
├── vite.config.ts          ← UPDATED: Proxy
└── .env.local              ← NEW: Environment vars
```

## Next files to copy:
1. src/components/auth/Login.tsx
2. src/components/auth/Register.tsx
3. src/components/auth/ProtectedRoute.tsx
4. src/services/auth.service.ts
5. src/services/products.api.ts
6. src/services/customers.api.ts
7. src/services/orders.api.ts
8. src/config/api.ts
9. Updated src/App.tsx
10. vite.config.ts updates

