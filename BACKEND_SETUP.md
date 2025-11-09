# Backend Setup - Зааварчилгаа

## ⚠️ АНХААРУУЛГА: Backend API холбогдоогүй байна

Таны frontend систем одоо **http://localhost:3000** хаяг руу холбогдох гэж оролдож байна, гэвч Backend server ажиллахгүй байна.

## 🚀 Backend Server Асаах:

### Хэрэв Backend код танд байгаа бол:

```bash
# Backend folder руу очих
cd /path/to/your/backend

# Dependencies суулгах
npm install

# Database migration ажиллуулах
npm run migrate

# Server асаах
npm run dev
# эсвэл
npm start
```

Backend server ажиллаж эхлэхэд:
- ✅ Products (Бараа)
- ✅ Customers (Харилцагчид)
- ✅ Orders (Захиалга)
- ✅ Employees (Ажилтнууд)
- ✅ Бусад бүх мэдээлэл харагдана

## 🔄 Өөр Backend URL ашиглах бол:

`.env` файл үүсгээд:

```env
VITE_API_BASE_URL=http://your-backend-url:port
VITE_APP_NAME="Oasis"
```

Жишээ нь:
```env
VITE_API_BASE_URL=http://192.168.1.100:3000
# эсвэл
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 📝 Backend API шаардлагатай endpoints:

### Authentication
- POST /api/auth/login

### Products
- GET /api/products
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Customers
- GET /api/customers
- POST /api/customers
- PUT /api/customers/:id

### Orders
- GET /api/orders
- POST /api/orders
- GET /api/orders/:id
- PUT /api/orders/:id/status

### Employees
- GET /api/employees
- POST /api/employees
- PUT /api/employees/:id

### Returns
- GET /api/returns
- POST /api/returns

## 🧪 Mock Data ашиглах (Хөгжүүлэлтийн үед)

Хэрэв та зөвхөн frontend тестлэх гэж байгаа бол, би танд mock data-тай хувилбар үүсгэж өгч болно.

Одоогоор таны систем бодит Backend API-тай ажиллах гэж тохируулагдсан байна.

