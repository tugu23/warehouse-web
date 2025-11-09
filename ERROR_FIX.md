# 🔧 АЛДАА ЗАСАХ

## Асуудлууд:

### 1. ❌ Backend ажиллахгүй байна
```
Error: Network error. Please check your internet connection.
```

**Шалтгаан:** Podman machine зогссон эсвэл backend container унтарсан

**Шийдэл:**
```bash
# Podman machine эхлүүлэх
podman machine start

# 10 секунд хүлээх
sleep 10

# Backend эхлүүлэх
cd /Users/tuguldur.tu/warehouse-service
podman-compose up -d

# Шалгах
curl http://localhost:3000/health
```

---

### 2. ❌ Email зөрүү

**Frontend:** `admin@warehouse.com`  
**Backend:** `admin@oasis.mn`

**Шийдэл:** Frontend-ийн LoginPage.tsx засах

---

## ✅ БҮРЭН ЗАСАХ:

### Алхам 1: Backend эхлүүлэх
```bash
podman machine start
sleep 10
cd /Users/tuguldur.tu/warehouse-service
podman-compose up -d
```

### Алхам 2: Backend шалгах
```bash
curl http://localhost:3000/health
# Response: {"status":"success","message":"Server is running",...}
```

### Алхам 3: Demo user үүсгэх (хэрэв байхгүй бол)
```bash
# Option 1: Register API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@oasis.mn",
    "password": "admin123",
    "name": "Admin User"
  }'

# Option 2: Prisma Studio
podman exec -it warehouse-backend npx prisma studio
# Browser: http://localhost:5555
```

### Алхам 4: Frontend LoginPage засах
File: `/Users/tuguldur.tu/warehouse-web/src/features/auth/LoginPage.tsx`

Change:
```typescript
// Before:
Admin: admin@warehouse.com / admin123

// After:
Admin: admin@oasis.mn / admin123
```

### Алхам 5: Frontend эхлүүлэх
```bash
cd /Users/tuguldur.tu/warehouse-web
npm run dev
```

### Алхам 6: Test
```
http://localhost:5173/login

Email: admin@oasis.mn
Password: admin123
```

---

## 📊 Системийн статус шалгах:

```bash
# Backend health
curl http://localhost:3000/health

# Containers
podman ps

# Frontend port
lsof -i :5173

# Backend port  
lsof -i :3000
```

---

## ✅ Зөв тохиргоо:

```
warehouse-service:
  - Backend: localhost:3000 ✅
  - Database: localhost:5432 ✅
  - Demo user: admin@oasis.mn ✅

warehouse-web:
  - Frontend: localhost:5173 ✅
  - API proxy: /api → localhost:3000 ✅
  - Login: admin@oasis.mn ✅
```

