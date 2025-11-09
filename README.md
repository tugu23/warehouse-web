# Oasis - Агуулахын удирдлагын систем

Орчин үеийн React апп - Бараа, захиалга, харилцагч, ажилтнуудын удирдлага болон агентын байршлыг цаг хугацаанд нь хянах.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Material-UI](https://img.shields.io/badge/Material--UI-7-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Онцлогууд

### Core Functionality

- 🔐 **Нэвтрэх ба эрх** - JWT-д суурилсан нэвтрэх, эрхийн удирдлага
- 📊 **Үүрэг дээр суурилсан Dashboard** - Admin, Manager, Sales Agent үүрэгт тохирсон дэлгэц
- 📦 **Барааны удирдлага** - CRUD үйлдлүүд, үлдэгдэл хянах
- 👥 **Харилцагчийн удирдлага** - Харилцагчийн мэдээлэл, байршлын зураглал
- 🛒 **Захиалгын удирдлага** - Захиалга үүсгэх, үнийн автомат тооцоо
- 🔄 **Буцаалтын удирдлага** - Барааны буцаалт, үлдэгдэл сэргээх
- 👨‍💼 **Ажилтны удирдлага** - Admin эрх шаардлагатай
- 🗺️ **Агентын байршил** - GPS байршил, замын түүх

### Technical Features

- ⚡ Lightning-fast performance with Vite
- 🎨 Beautiful UI with Material-UI components
- 🌙 Dark/Light mode support
- 📱 Fully responsive design
- 🔄 Real-time data updates
- 🛡️ Type-safe with TypeScript
- 🎯 Form validation with Zod
- 🗺️ Interactive maps with React Leaflet
- 📈 Data visualization with Recharts

## 🛠️ Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand (with persistence)
- **Routing:** React Router v6
- **UI Framework:** Material-UI (MUI) v7
- **HTTP Client:** Axios with interceptors
- **Forms:** React Hook Form + Zod validation
- **Maps:** React Leaflet + Leaflet
- **Charts:** Recharts
- **Date Handling:** date-fns
- **Notifications:** react-hot-toast
- **Code Quality:** ESLint + Prettier + Husky

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:3000)

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME="Oasis"
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## 👤 Test Credentials

### Admin

- **Email:** admin@oasis.mn
- **Password:** admin123
- **Access:** Бүх системд хандах эрхтэй

### Manager

- **Email:** manager@oasis.mn
- **Password:** manager123
- **Access:** Бараа, харилцагч, захиалга, буцаалт, агентын удирдлага

### Sales Agent

- **Email:** agent@oasis.mn
- **Password:** agent123
- **Access:** Бараа үзэх, харилцагч үзэх, захиалга үүсгэх

## 📁 Project Structure

```
src/
├── api/              # API client and endpoints
│   └── index.ts
├── components/       # Reusable UI components
│   ├── DataTable.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   └── LoadingSkeletons.tsx
├── config/           # App configuration
│   ├── theme.ts
│   └── ThemeProvider.tsx
├── features/         # Feature-based modules
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── customers/
│   ├── orders/
│   ├── returns/
│   ├── employees/
│   └── agents/
├── hooks/            # Custom React hooks
│   └── useAuth.ts
├── layouts/          # Layout components
│   └── DashboardLayout.tsx
├── lib/              # External library configurations
│   └── axios.ts
├── routes/           # Route definitions
│   └── index.tsx
├── store/            # Zustand stores
│   └── authStore.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   └── validation.ts
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## 🎨 Features by Role

### Admin

- ✅ All features access
- ✅ Employee management
- ✅ Agent tracking and monitoring
- ✅ System-wide analytics

### Manager

- ✅ Product CRUD operations
- ✅ Customer management
- ✅ Order processing
- ✅ Returns management
- ✅ Agent tracking
- ✅ Inventory adjustments

### Sales Agent

- ✅ View products catalog
- ✅ View assigned customers
- ✅ Create customer orders
- ✅ View order history
- ✅ Record GPS location

## 🔐 Security Features

- JWT token-based authentication
- Automatic token refresh
- Role-based route protection
- API request authentication
- Secure token storage
- Session management
- Protected API endpoints

## 📱 Responsive Design

The application is fully responsive and optimized for:

- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1440px+)

## 🧪 Code Quality

### Linting

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Fix linting errors
```

### Formatting

```bash
npm run format      # Format code with Prettier
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically:

- Run ESLint on staged files
- Format code with Prettier
- Ensure code quality before commits

## 🗺️ API Integration

The application integrates with the Warehouse Management System API:

### Base URL

```
Development: http://localhost:3000
Production: https://api.warehouse.com
```

### API Endpoints

- `/api/auth/*` - Authentication
- `/api/employees/*` - Employee management
- `/api/products/*` - Product management
- `/api/customers/*` - Customer management
- `/api/orders/*` - Order management
- `/api/returns/*` - Return management
- `/api/agents/*` - Agent tracking

## 🎯 Key Components

### DataTable Component

Reusable table with:

- Sorting
- Filtering/Search
- Pagination
- Custom column formatting

### Modal Component

Flexible modal dialogs for forms and details

### ConfirmDialog

User confirmations for destructive actions

### Protected Routes

Role-based route protection with automatic redirects

## 🚀 Performance Optimizations

- Code splitting with React.lazy
- Route-based lazy loading
- Memoization with React.memo
- Optimized re-renders
- Tree-shaking
- Asset optimization
- Gzip compression

## 🐛 Troubleshooting

### Common Issues

**Issue: API connection refused**

- Solution: Ensure backend API is running on port 3000

**Issue: Map tiles not loading**

- Solution: Check internet connection and Leaflet CSS import

**Issue: Authentication errors**

- Solution: Clear browser localStorage and login again

## 📝 Scripts Reference

| Command            | Description               |
| ------------------ | ------------------------- |
| `npm run dev`      | Start development server  |
| `npm run build`    | Build for production      |
| `npm run preview`  | Preview production build  |
| `npm run lint`     | Run ESLint                |
| `npm run lint:fix` | Fix ESLint errors         |
| `npm run format`   | Format code with Prettier |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- React team for the amazing framework
- Leaflet for mapping capabilities
- All contributors who helped shape this project

## 📞 Support

For support, email support@oasis.mn or open an issue in the repository.

---

**Built with ❤️ by Oasis Team using React, TypeScript, and Material-UI**
