# АНХААРУУЛГА: Backend API Холболт

## 🔴 Одоогийн асуудал:

Таны систем одоо **хоосон** харагдаж байна, учир нь:

### 1. Backend API ажиллахгүй байна
- Frontend `http://localhost:3000` руу холбогдох гэж байна
- Backend server асаагүй байна
- Өгөгдлийн сан хоосон эсвэл холбогдохгүй байна

### 2. Одоогийн байдал:
```
Frontend (http://localhost:5173) ----X----> Backend (http://localhost:3000)
                                   ХОЛБОЛТ АЛДААТАЙ
```

## ✅ ШИЙДЭЛ:

### A. Backend Server-г асаах (Зөвлөмж):

```bash
# Backend folder руу очих
cd /path/to/backend-project

# Dependencies суулгах (анх удаа бол)
npm install

# Database тохируулах
# - PostgreSQL эсвэл MySQL database үүсгэх
# - .env файлд DATABASE_URL тохируулах

# Migration ажиллуулах
npm run migrate
# эсвэл
npx prisma migrate dev

# Backend server асаах
npm run dev
```

### B. Өөр Backend хаяг ашиглах бол:

`.env` файлд Backend URL-г өөрчлөх:

```env
# Production server
VITE_API_BASE_URL=https://api.oasis.mn

# эсвэл өөр port
VITE_API_BASE_URL=http://localhost:8000
```

### C. Frontend дахин асаах:

```bash
# Ctrl+C дарж зогсоох
# Дахин асаах
npm run dev
```

## 📊 Backend ажиллаж байгаа эсэхийг шалгах:

```bash
# Browser дээр нээх эсвэл curl ашиглах:
curl http://localhost:3000/api/health

# Эсвэл backend logs-г шалгах
```

## 🔧 Backend байхгүй бол Mock Data ашиглах:

Хэрэв танд Backend код байхгүй бол, би танд **mock backend** эсвэл **test data** үүсгэж өгч болно.

Хэрэв backend-гүй frontend-г л тестлэх гэж байгаа бол:
1. Mock API service үүсгэнэ
2. Sample data-тай ажиллана
3. Бүх функцүүд ажиллана (хадгалалт нь browser storage-д байна)

## 📞 Backend хөгжүүлэлт хэрэгтэй бол:

Backend API хөгжүүлэх зааварчилгаа:
- Node.js + Express
- Database: PostgreSQL / MySQL / MongoDB
- ORM: Prisma / TypeORM / Sequelize
- Authentication: JWT

Танд Backend код хэрэгтэй бол би танд бүрэн backend project template өгч болно.

---

**Одоогийн байдлаар таны frontend бүрэн бэлэн боловч Backend холболт дутуу байна.**

