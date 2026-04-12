# Wahaz Fabrication

Premium men's designer fashion e-commerce platform. Full-stack application with a customer storefront, admin panel, Razorpay payments, and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Redux Toolkit + RTK Query |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (Access + Refresh token with httpOnly cookie) |
| Payments | Razorpay (UPI / Card / Netbanking / COD) |
| Images | Base64 data URLs stored in PostgreSQL |
| Email | Nodemailer (SMTP) |

---

## Project Structure

```
wahaz_febrication/
├── server/                        # Express backend
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (13 models)
│   │   └── seed.js                # Seed data (admin, categories, products)
│   ├── scripts/
│   │   └── create-admin.js        # CLI tool to create admin users
│   ├── src/
│   │   ├── config/                # DB, Razorpay, Nodemailer configs
│   │   ├── middleware/            # Auth, error, upload, rate limiter
│   │   ├── controllers/           # All business logic
│   │   ├── routes/                # API route definitions
│   │   └── utils/                 # Token generation, email templates, helpers
│   ├── server.js                  # Entry point
│   └── .env.example               # Environment template
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Button, Input, Loader, Modal, Badge
│   │   │   ├── layout/            # Navbar, Footer, MainLayout
│   │   │   ├── product/           # ProductCard, ProductGrid, ProductFilter
│   │   │   └── admin/             # AdminLayout (sidebar + nav)
│   │   ├── pages/                 # All customer-facing pages
│   │   │   └── admin/             # All admin panel pages
│   │   ├── store/
│   │   │   ├── slices/            # Auth, UI state
│   │   │   └── api/               # RTK Query endpoints (7 API slices)
│   │   ├── routes/                # ProtectedRoute, AdminRoute
│   │   ├── hooks/                 # useAuthBootstrap
│   │   └── utils/                 # Currency formatting, Razorpay loader
│   └── .env.example               # Frontend env template
│
└── README.md
```

---

## Features

### Customer Storefront
- Home page with **auto-rotating banner carousel** and **category carousel**
- Product listing with **advanced filtering** (category, price, size, color, occasion, fabric)
- Product detail with **image gallery**, **variant selection** (color + size), and **reviews**
- Shopping cart with **coupon codes** and live price calculation
- **3-step checkout** (Address > Summary > Payment)
- **Razorpay integration** (UPI, card, netbanking) + Cash on Delivery
- Order tracking with **visual timeline**
- **Write reviews** on delivered orders (admin approval required)
- Wishlist, profile management, address book, password change
- **Fully responsive** mobile-first design

### Admin Panel (`/admin`)
- Dashboard with **revenue charts** (Recharts), order stats, top products
- Product CRUD with **multi-image upload**, variant management, rich descriptions
- Category, banner, coupon management
- Order management with **status updates** and automatic customer email notifications
- User management with **block/unblock**
- Review moderation (approve / reject)
- **Secure admin creation** — requires server-side secret code (`ADMIN_CREATION_SECRET`)

### Security
- Passwords hashed with bcrypt (12 rounds)
- JWT access token (15m) in memory + refresh token (7d) in httpOnly cookie
- Refresh token rotation with reuse detection
- Rate limiting on auth routes (5/15min) and global API (120/min)
- Helmet security headers, CORS locked to frontend origin
- Razorpay HMAC-SHA256 signature verification
- Admin creation requires a server-side secret (two-factor trust)
- Constant-time secret comparison to prevent timing attacks

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/rizwi0786/wahaz_febrication.git
cd wahaz_febrication
```

### 2. Setup the backend

```bash
cd server
npm install

# Create your environment file
cp .env.example .env
# Fill in: DATABASE_URL, JWT secrets, Razorpay keys, SMTP, ADMIN_CREATION_SECRET

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed the database (admin user, 11 categories, 55 products, banners, coupons)
npm run seed

# Start the server
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Setup the frontend

```bash
cd client
npm install

# Create your environment file
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api

# Start the dev server
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Login

| Role | Email | Password |
|---|---|---|
| Admin | `admin@wahazfabrication.com` | `Admin@123` |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `ADMIN_CREATION_SECRET` | Required to create admin users from the UI |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `CLIENT_URL` | Frontend URL for CORS and email links |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key |

---

## API Overview

| Area | Endpoints | Auth |
|---|---|---|
| Auth | Register, Login, Logout, Refresh, Forgot/Reset Password | Public |
| Products | List, Detail, Featured, New Arrivals, By Category | Public |
| Categories | List all active categories | Public |
| Banners | List all active banners | Public |
| Cart | Get, Add, Update, Remove, Clear | Customer |
| Orders | Place, Verify Payment, List, Detail, Cancel | Customer |
| Wishlist | Get, Add, Remove | Customer |
| Reviews | Create, Update, Delete | Customer |
| Profile | Get/Update Profile, Change Password, Address CRUD | Customer |
| Coupons | Validate | Customer |
| Admin | Dashboard stats, Product/Category/Order/User/Coupon/Banner/Review management | Admin |

---

## Payment Flow

1. Customer places order → backend creates Razorpay order via SDK
2. Frontend opens Razorpay checkout modal
3. On success → `POST /api/orders/verify-payment` verifies HMAC signature
4. Backend marks order as PAID, decrements stock, clears cart, sends confirmation email
5. COD orders skip Razorpay; stock is decremented at placement

---

## Image Storage

Images (products, banners, categories, avatars) are stored as **base64 data URLs** directly in PostgreSQL `TEXT` columns.

- Max file size: **2 MB** per image (multer)
- Accepted formats: JPEG, PNG, WebP
- Product listings return only the primary image to keep response sizes manageable
- Product detail pages return the full gallery

---

## Admin User Creation

Admin accounts can be created in two ways:

1. **From the admin panel** (`/admin/users` > Add User > select Admin role) — requires the `ADMIN_CREATION_SECRET` from the server environment
2. **From the CLI** (for initial setup): `node scripts/create-admin.js`

---

## Scripts

| Command | Directory | Description |
|---|---|---|
| `npm run dev` | `server/` | Start backend with nodemon |
| `npm run seed` | `server/` | Seed database with sample data |
| `npm run dev` | `client/` | Start frontend dev server |
| `npm run build` | `client/` | Build frontend for production |
| `node scripts/create-admin.js` | `server/` | Create admin user via CLI |

---

## License

This project is proprietary. All rights reserved.
