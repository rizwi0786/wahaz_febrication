# 🛍️ Full-Stack Men's Fashion E-Commerce Website — Complete Build Prompt

## Project Name: **LuxeMen** (Men's Designer Fashion Store)

---

## 🧱 TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + React Router v6 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (with pg / node-postgres) |
| Auth | JWT (Access Token + Refresh Token) |
| File Storage | Cloudinary (for product images) |
| Payments | Razorpay (for Indian market) |
| State Management | Redux Toolkit + RTK Query |
| Form Handling | React Hook Form + Zod validation |
| Email | Nodemailer (SMTP) |
| ORM | Prisma ORM (for PostgreSQL) |

---

## 📁 PROJECT FOLDER STRUCTURE

```
luxemen/
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Images, fonts, icons
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Modal, Loader, Badge
│   │   │   ├── layout/              # Navbar, Footer, Sidebar
│   │   │   ├── product/             # ProductCard, ProductGrid, ProductFilter
│   │   │   ├── cart/                # CartItem, CartSummary
│   │   │   ├── checkout/            # CheckoutSteps, AddressForm, PaymentForm
│   │   │   └── admin/               # AdminSidebar, StatsCard, DataTable
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Shop.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderSuccess.jsx
│   │   │   ├── OrderTracking.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminAddProduct.jsx
│   │   │       ├── AdminEditProduct.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       ├── AdminOrderDetail.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminCategories.jsx
│   │   │       ├── AdminCoupons.jsx
│   │   │       ├── AdminBanners.jsx
│   │   │       └── AdminReviews.jsx
│   │   ├── store/                   # Redux store
│   │   │   ├── index.js
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── cartSlice.js
│   │   │   │   └── wishlistSlice.js
│   │   │   └── api/
│   │   │       ├── productApi.js
│   │   │       ├── orderApi.js
│   │   │       ├── userApi.js
│   │   │       └── adminApi.js
│   │   ├── hooks/                   # useAuth, useCart, useDebounce
│   │   ├── utils/                   # formatCurrency, formatDate, validators
│   │   ├── context/                 # ThemeContext (optional dark mode)
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Express Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Full DB schema
│   │   └── seed.js                  # Seeding script
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # Prisma client
│   │   │   ├── cloudinary.js
│   │   │   ├── razorpay.js
│   │   │   └── nodemailer.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # verifyToken, verifyAdmin
│   │   │   ├── error.middleware.js  # Global error handler
│   │   │   ├── upload.middleware.js # Multer + Cloudinary
│   │   │   └── rateLimiter.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── coupon.controller.js
│   │   │   ├── wishlist.controller.js
│   │   │   ├── banner.controller.js
│   │   │   └── admin.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── coupon.routes.js
│   │   │   ├── wishlist.routes.js
│   │   │   ├── banner.routes.js
│   │   │   └── admin.routes.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── sendEmail.js
│   │   │   ├── apiFeatures.js       # Filtering, sorting, pagination
│   │   │   └── errorHandler.js
│   │   └── app.js
│   ├── .env
│   └── server.js
└── README.md
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  password        String
  phone           String?
  role            Role      @default(CUSTOMER)
  isVerified      Boolean   @default(false)
  verifyToken     String?
  resetToken      String?
  resetTokenExpiry DateTime?
  refreshToken    String?
  avatar          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  addresses       Address[]
  orders          Order[]
  reviews         Review[]
  wishlist        Wishlist[]
  cart            Cart?
}

enum Role {
  CUSTOMER
  ADMIN
}

model Address {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  fullName    String
  phone       String
  addressLine1 String
  addressLine2 String?
  city        String
  state       String
  pincode     String
  country     String   @default("India")
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  image       String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  products    Product[]
}

model Product {
  id            String        @id @default(uuid())
  name          String
  slug          String        @unique
  description   String
  price         Decimal
  discountPrice Decimal?
  discountPercent Int?
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id])
  images        ProductImage[]
  variants      ProductVariant[]
  reviews       Review[]
  wishlist      Wishlist[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  tags          String[]
  fabric        String?
  fit           String?
  occasion      String?
  careInstructions String?
  isFeatured    Boolean       @default(false)
  isNewArrival  Boolean       @default(false)
  isActive      Boolean       @default(true)
  stock         Int           @default(0)
  avgRating     Decimal       @default(0)
  totalReviews  Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model ProductImage {
  id        String  @id @default(uuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  publicId  String
  isPrimary Boolean @default(false)
  order     Int     @default(0)
}

model ProductVariant {
  id        String     @id @default(uuid())
  productId String
  product   Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  size      String
  color     String
  colorHex  String?
  stock     Int        @default(0)
  sku       String     @unique
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  variantId String
  quantity  Int      @default(1)
}

model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  shippingAddress Json
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  paymentId       String?
  razorpayOrderId String?
  orderStatus     OrderStatus @default(PROCESSING)
  subtotal        Decimal
  discount        Decimal     @default(0)
  shippingCharge  Decimal     @default(0)
  tax             Decimal     @default(0)
  total           Decimal
  couponCode      String?
  notes           String?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  tracking        OrderTracking[]
}

model OrderItem {
  id          String  @id @default(uuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  productName String
  productImage String
  size        String
  color       String
  quantity    Int
  price       Decimal
  total       Decimal
}

model OrderTracking {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  status    String
  message   String
  location  String?
  createdAt DateTime @default(now())
}

enum OrderStatus {
  PROCESSING
  CONFIRMED
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  RETURN_REQUESTED
  RETURNED
}

enum PaymentMethod {
  RAZORPAY
  COD
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  rating    Int
  title     String?
  comment   String
  images    String[]
  isApproved Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId])
}

model Wishlist {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}

model Coupon {
  id              String      @id @default(uuid())
  code            String      @unique
  description     String?
  discountType    DiscountType
  discountValue   Decimal
  minOrderAmount  Decimal?
  maxDiscount     Decimal?
  usageLimit      Int?
  usedCount       Int         @default(0)
  isActive        Boolean     @default(true)
  expiresAt       DateTime?
  createdAt       DateTime    @default(now())
}

enum DiscountType {
  PERCENTAGE
  FLAT
}

model Banner {
  id          String   @id @default(uuid())
  title       String
  subtitle    String?
  image       String
  imagePublicId String
  mobileImage String?
  link        String?
  position    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

## 🔐 AUTH SYSTEM — JWT (Access + Refresh Token)

### How it works:
1. User logs in → server returns `accessToken` (15 min expiry) + `refreshToken` (7 days)
2. `accessToken` stored in Redux state / memory (NOT localStorage)
3. `refreshToken` stored in **httpOnly cookie** (not accessible via JS — secure)
4. Every protected API request sends `Authorization: Bearer <accessToken>` header
5. When `accessToken` expires → frontend calls `/api/auth/refresh-token` endpoint → server validates `refreshToken` from cookie → issues new `accessToken`
6. Logout clears cookie and invalidates `refreshToken` in DB

### Endpoints:
```
POST   /api/auth/register           → Register new user
POST   /api/auth/login              → Login, returns tokens
POST   /api/auth/logout             → Clears refresh token
POST   /api/auth/refresh-token      → Get new access token
POST   /api/auth/forgot-password    → Send reset email
POST   /api/auth/reset-password     → Reset with token
GET    /api/auth/verify-email/:token → Email verification
GET    /api/auth/me                 → Get current user (protected)
```

### Token Generation (generateToken.js):
```js
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
```

### Auth Middleware:
```js
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  next();
};
```

---

## 🛒 PRODUCT CATEGORIES

Initial categories to seed in the database:

| Slug | Name | Description |
|---|---|---|
| `designer-coats` | Designer Coats | Premium wool, trench, and overcoats |
| `pants` | Pants & Trousers | Formal, casual, chinos, linen |
| `sherwani` | Sherwani | Traditional Indian occasion wear |
| `blazers` | Blazers | Casual, formal, printed blazers |
| `suits` | Suits | 2-piece and 3-piece suits |
| `tuxedos` | Tuxedos | Black tie and formal tuxedos |
| `kurta-sets` | Kurta Sets | Ethnic festive wear |
| `jackets` | Jackets | Bombers, denim, leather jackets |
| `shirts` | Shirts | Formal, casual, party shirts |
| `t-shirts` | T-Shirts | Polo, printed, plain |
| `accessories` | Accessories | Ties, pocket squares, cufflinks, belts |

---

## 🌐 FULL API ROUTES

### Products
```
GET    /api/products                       → All products (filter, sort, paginate)
GET    /api/products/:slug                 → Single product by slug
GET    /api/products/featured              → Featured products
GET    /api/products/new-arrivals          → New arrivals
GET    /api/products/category/:categorySlug → Products by category
POST   /api/admin/products                 → Create product (Admin)
PUT    /api/admin/products/:id             → Update product (Admin)
DELETE /api/admin/products/:id             → Delete product (Admin)
POST   /api/admin/products/:id/images      → Upload images (Admin)
DELETE /api/admin/products/:id/images/:imageId → Delete image (Admin)
```

### Query Params for GET /api/products:
```
?category=blazers
&minPrice=500
&maxPrice=10000
&size=M,L,XL
&color=Black,Navy
&occasion=formal
&sort=price_asc | price_desc | newest | popular | rating
&page=1
&limit=12
&search=blue blazer
&tags=sale,featured
```

### Categories
```
GET    /api/categories                     → All active categories
GET    /api/categories/:slug               → Single category
POST   /api/admin/categories               → Create (Admin)
PUT    /api/admin/categories/:id           → Update (Admin)
DELETE /api/admin/categories/:id           → Delete (Admin)
```

### Cart
```
GET    /api/cart                           → Get user cart (protected)
POST   /api/cart                           → Add item to cart (protected)
PUT    /api/cart/:itemId                   → Update quantity (protected)
DELETE /api/cart/:itemId                   → Remove item (protected)
DELETE /api/cart                           → Clear cart (protected)
```

### Orders
```
POST   /api/orders                         → Place order (protected)
GET    /api/orders                         → Get user orders (protected)
GET    /api/orders/:id                     → Get order detail (protected)
POST   /api/orders/:id/cancel              → Cancel order (protected)
POST   /api/orders/verify-payment          → Verify Razorpay payment (protected)
GET    /api/admin/orders                   → All orders (Admin)
PUT    /api/admin/orders/:id/status        → Update order status (Admin)
GET    /api/admin/orders/:id               → Order details (Admin)
```

### Users
```
GET    /api/users/profile                  → Get profile (protected)
PUT    /api/users/profile                  → Update profile (protected)
PUT    /api/users/change-password          → Change password (protected)
POST   /api/users/addresses                → Add address (protected)
PUT    /api/users/addresses/:id            → Update address (protected)
DELETE /api/users/addresses/:id            → Delete address (protected)
GET    /api/admin/users                    → All users (Admin)
PUT    /api/admin/users/:id/block          → Block/unblock user (Admin)
```

### Reviews
```
POST   /api/reviews                        → Post review (protected)
PUT    /api/reviews/:id                    → Update review (protected)
DELETE /api/reviews/:id                    → Delete review (protected)
GET    /api/products/:id/reviews           → Get product reviews
PUT    /api/admin/reviews/:id/approve      → Approve review (Admin)
DELETE /api/admin/reviews/:id              → Delete review (Admin)
```

### Wishlist
```
GET    /api/wishlist                       → Get wishlist (protected)
POST   /api/wishlist/:productId            → Add to wishlist (protected)
DELETE /api/wishlist/:productId            → Remove from wishlist (protected)
```

### Coupons
```
POST   /api/coupons/validate               → Validate coupon (protected)
POST   /api/admin/coupons                  → Create coupon (Admin)
GET    /api/admin/coupons                  → All coupons (Admin)
PUT    /api/admin/coupons/:id              → Update coupon (Admin)
DELETE /api/admin/coupons/:id              → Delete coupon (Admin)
```

### Banners
```
GET    /api/banners                        → All active banners
POST   /api/admin/banners                  → Create banner (Admin)
PUT    /api/admin/banners/:id              → Update banner (Admin)
DELETE /api/admin/banners/:id              → Delete banner (Admin)
```

### Admin Dashboard
```
GET    /api/admin/stats                    → Revenue, orders, users summary
GET    /api/admin/stats/revenue-chart      → Monthly revenue data
GET    /api/admin/stats/top-products       → Best selling products
GET    /api/admin/stats/recent-orders      → Recent 10 orders
```

---

## 🖥️ FRONTEND PAGES — DETAILED

### 1. HOME PAGE (`/`)
- Full-width hero banner slider (auto-play, 3 banners from DB)
- Category grid (icons/images for each category — click navigates to shop filtered)
- "New Arrivals" horizontal scroll section (8 products)
- "Featured / Best Sellers" section (8 products)
- Promotional banner (e.g. "40% off on Sherwanis")
- "Shop by Occasion" cards: Formal | Casual | Party | Wedding
- Testimonials / Reviews section (3 cards)
- Instagram-style outfit grid (static images linking to products)
- Brand USPs: Free Shipping | Premium Quality | Easy Returns | Secure Payment

### 2. SHOP PAGE (`/shop`)
- Sidebar Filter Panel (collapsible on mobile):
  - Category checkboxes
  - Price range slider (₹0 - ₹50,000)
  - Size multi-select (XS, S, M, L, XL, XXL, 38, 40, 42, 44)
  - Color swatches with hex
  - Occasion (Formal, Casual, Party, Wedding, Festive)
  - Fabric (Cotton, Wool, Silk, Polyester, Linen)
  - Rating filter (4★ and above, etc.)
- Top bar: "Showing X results", Sort dropdown, Grid/List view toggle
- Product Grid: 3 columns (desktop), 2 (tablet), 1 (mobile)
- Each product card shows: image with hover second image, name, price, discount badge, quick-add to cart/wishlist buttons
- Pagination (infinite scroll or numbered)
- "No results found" empty state with suggestions

### 3. PRODUCT DETAIL PAGE (`/product/:slug`)
- Left: Image gallery with thumbnail strip + zoom on hover + lightbox
- Right:
  - Breadcrumb navigation
  - Product name, rating stars + review count (clickable)
  - Price display: original (strikethrough) + sale price + discount % badge
  - Color selector (swatches — visual)
  - Size selector (buttons, greyed out if OOS)
  - Size guide popup/modal
  - Quantity selector (+/-)
  - "Add to Cart" and "Buy Now" buttons
  - "Add to Wishlist" heart button
  - Share buttons (copy link)
  - Product highlights (Fabric, Fit, Occasion, Care)
  - Tabs below: Description | Size Guide | Reviews | Shipping & Returns
  - Review section with: Average rating breakdown bars, individual reviews with images, "Write a Review" form (protected)
- "You May Also Like" — 4 related products from same category

### 4. CART PAGE (`/cart`)
- Cart items table: image, name, size, color, quantity stepper, price, remove button
- Empty cart state with "Continue Shopping" CTA
- Order summary panel:
  - Subtotal
  - Coupon input field + "Apply" button (validate via API, show discount)
  - Shipping (free above ₹999 or show charge)
  - Tax (18% GST displayed)
  - Total
  - "Proceed to Checkout" button (redirects to login if not authenticated)

### 5. CHECKOUT PAGE (`/checkout`) — 3-step
- Step 1: Delivery Address (select saved address OR add new form: name, phone, address lines, city, state, pincode)
- Step 2: Order Summary + Coupon final confirmation
- Step 3: Payment (Razorpay integration — opens payment modal, OR Cash on Delivery option)
- On success: redirect to `/order-success/:orderId`
- Order Success page: Animated tick, order number, estimated delivery, "Track Order" and "Continue Shopping" buttons

### 6. ORDER HISTORY (`/orders`)
- Table with columns: Order#, Date, Items (thumbnail), Total, Status badge, "View Details" link
- Each order status with colored badge: Processing (blue), Confirmed (cyan), Shipped (orange), Delivered (green), Cancelled (red)

### 7. ORDER DETAIL / TRACKING (`/orders/:id`)
- Full order breakdown: items, shipping address, payment details
- Visual tracking timeline: Order Placed → Confirmed → Shipped → Out for Delivery → Delivered
- Cancel order button (only if status is PROCESSING)

### 8. PROFILE PAGE (`/profile`)
- Edit personal info (name, email, phone, avatar upload)
- Address book (list, add, edit, delete, set default)
- Change password form (old + new + confirm)

### 9. WISHLIST PAGE (`/wishlist`)
- Grid of saved products
- "Move to Cart" and "Remove" actions on each card
- Empty wishlist state

### 10. AUTH PAGES
- **Login**: Email + Password form, "Remember me", Forgot password link, Google OAuth (optional)
- **Register**: Name, Email, Phone, Password, Confirm Password
- **Forgot Password**: Email input → sends reset link
- **Reset Password**: New password + confirm (token from URL)

---

## 🔧 ADMIN PANEL (`/admin/*`) — DETAILED

Admin panel is a completely separate layout with its own sidebar, accessible only by users with `role: ADMIN`.

### Admin Sidebar Links:
- Dashboard
- Products (list, add, edit)
- Categories
- Orders
- Users
- Coupons
- Banners
- Reviews

---

### ADMIN DASHBOARD (`/admin`)
**Stats Cards Row:**
- Total Revenue (this month vs last month %)
- Total Orders (this month)
- New Customers (this month)
- Pending Orders count

**Charts (use Recharts library):**
- Line chart: Revenue for last 12 months
- Bar chart: Orders per month
- Donut chart: Revenue by category

**Tables:**
- Recent 10 orders (order#, customer, total, status, date)
- Top 5 best-selling products (image, name, sold units, revenue)

---

### ADMIN PRODUCTS (`/admin/products`)
- Searchable, sortable table with columns: Image, Name, Category, Price, Discount, Stock, Status, Actions
- Bulk delete option (checkboxes)
- "Add New Product" button → `/admin/products/add`
- Filter by category, status (active/inactive)

### ADD / EDIT PRODUCT (`/admin/products/add` and `/admin/products/edit/:id`)
Full product form with:
- Name (auto-generates slug)
- Category (dropdown from DB)
- Description (rich text editor — use react-quill or tiptap)
- Price + Discount Price (auto-calculates %)
- Images (multi-upload with drag-drop, reorder, set primary, delete — Cloudinary)
- Variants: dynamic table to add size + color + colorHex + stock + SKU rows
- Tags (comma-separated input)
- Fabric, Fit, Occasion, Care Instructions
- Is Featured toggle
- Is New Arrival toggle
- Is Active toggle

---

### ADMIN CATEGORIES (`/admin/categories`)
- Table: image, name, slug, product count, status, actions
- Add/Edit form in modal: name (auto-slug), description, image upload
- Toggle active/inactive

---

### ADMIN ORDERS (`/admin/orders`)
- Table: Order#, Customer, Date, Items, Total, Payment Status, Order Status, Actions
- Filters: status filter, date range picker, search by order# or customer name
- Click row → Order detail page

### ADMIN ORDER DETAIL (`/admin/orders/:id`)
- Full order information (customer, items, address, payment)
- Status update dropdown: select new status + optional message → updates DB + adds tracking entry + sends email to customer
- Timeline of all status changes with timestamps

---

### ADMIN USERS (`/admin/users`)
- Table: avatar, name, email, phone, joined date, total orders, total spent, role, status, actions
- Block/Unblock toggle
- Click to view all orders by that user

---

### ADMIN COUPONS (`/admin/coupons`)
- Table: Code, Type, Value, Min Order, Max Discount, Used/Limit, Expiry, Status
- Add Coupon modal form: code, discount type (PERCENTAGE/FLAT), value, min order, max discount, usage limit, expiry date
- Activate/Deactivate toggle

---

### ADMIN BANNERS (`/admin/banners`)
- List of banners with preview image, title, position, active status
- Add/Edit form: title, subtitle, desktop image upload, mobile image upload, link URL, position order
- Drag-to-reorder (or position number input)

---

### ADMIN REVIEWS (`/admin/reviews`)
- Table: Product, Customer, Rating, Comment, Date, Status (Pending/Approved)
- Approve / Reject / Delete actions
- Filter by approval status

---

## 💳 RAZORPAY INTEGRATION

### Backend Flow:
```
1. POST /api/orders  → Create order in DB with status PROCESSING + paymentStatus PENDING
                       → Create Razorpay order via SDK
                       → Return { razorpayOrderId, amount, currency, orderId }

2. Frontend opens Razorpay modal with above details

3. On Razorpay success → POST /api/orders/verify-payment
   Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
   → Verify HMAC signature
   → Update order paymentStatus to PAID, orderStatus to CONFIRMED
   → Deduct stock from ProductVariant
   → Clear user cart
   → Send order confirmation email
   → Return success
```

---

## 📧 EMAIL TEMPLATES (HTML emails via Nodemailer)

Send emails for:
1. **Welcome / Email Verification** — after register
2. **Forgot Password** — reset link (expires in 1 hour)
3. **Order Confirmation** — after successful payment (include order summary table)
4. **Order Status Update** — when admin changes status (shipped, delivered, etc.)
5. **Order Cancellation** — with cancellation reason

---

## 🎨 FRONTEND DESIGN SYSTEM

### Colors (TailwindCSS custom theme):
```js
// tailwind.config.js
colors: {
  brand: {
    primary: '#1A1A1A',    // Near black — primary buttons, navbar
    secondary: '#B8962E',  // Gold — accents, badges, highlights
    light: '#F5F0E8',      // Warm cream — page background
  }
}
```

### Typography:
- Headings: `Playfair Display` (serif — luxury feel)
- Body: `Inter` (clean sans-serif)
- Load via Google Fonts

### Design Principles:
- Clean, premium, dark-and-gold luxury aesthetic inspired by high-end menswear brands
- Subtle hover animations (scale, shadow)
- Sticky navbar with cart count badge and wishlist icon
- Mobile-first responsive design
- Skeleton loading states (not spinners)
- Toast notifications (react-hot-toast) for cart, wishlist, errors

---

## 🔒 SECURITY CHECKLIST

- [ ] Passwords hashed with bcryptjs (saltRounds: 12)
- [ ] JWT secrets in `.env` (never hardcoded)
- [ ] `httpOnly` + `secure` + `sameSite` flags on refresh token cookie
- [ ] Input validation on all routes (express-validator or Zod)
- [ ] SQL injection protection via Prisma parameterized queries
- [ ] Rate limiting on auth routes (express-rate-limit: 5 attempts per 15 min)
- [ ] CORS configured for frontend origin only
- [ ] Helmet.js for security headers
- [ ] Razorpay signature verification (HMAC-SHA256)
- [ ] File upload validation (image MIME types only, max 5MB)
- [ ] Admin routes double-protected (verifyToken + verifyAdmin)

---

## ⚙️ ENVIRONMENT VARIABLES

### server/.env
```env
DATABASE_URL=postgresql://user:password@localhost:5432/luxemen
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@luxemen.com
FROM_NAME=LuxeMen

CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### client/.env
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 📦 PACKAGE LIST

### Backend (server/package.json):
```json
"dependencies": {
  "@prisma/client": "^5.0.0",
  "bcryptjs": "^2.4.3",
  "cloudinary": "^1.41.0",
  "cookie-parser": "^1.4.6",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0",
  "express": "^4.18.0",
  "express-rate-limit": "^7.0.0",
  "express-validator": "^7.0.0",
  "helmet": "^7.0.0",
  "jsonwebtoken": "^9.0.0",
  "morgan": "^1.10.0",
  "multer": "^1.4.5",
  "multer-storage-cloudinary": "^4.0.0",
  "nodemailer": "^6.9.0",
  "razorpay": "^2.9.0",
  "slugify": "^1.6.0",
  "uuid": "^9.0.0"
},
"devDependencies": {
  "prisma": "^5.0.0",
  "nodemon": "^3.0.0"
}
```

### Frontend (client/package.json):
```json
"dependencies": {
  "@reduxjs/toolkit": "^2.0.0",
  "axios": "^1.6.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hook-form": "^7.48.0",
  "react-hot-toast": "^2.4.0",
  "react-redux": "^9.0.0",
  "react-router-dom": "^6.20.0",
  "recharts": "^2.10.0",
  "react-quill": "^2.0.0",
  "react-image-magnifiers": "^1.4.0",
  "swiper": "^11.0.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0",
  "lucide-react": "^0.300.0",
  "clsx": "^2.0.0"
},
"devDependencies": {
  "@vitejs/plugin-react": "^4.0.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0",
  "tailwindcss": "^3.4.0",
  "vite": "^5.0.0"
}
```

---

## 🚀 SETUP INSTRUCTIONS (for the AI to include in README)

```bash
# 1. Clone the repo
git clone <repo-url>
cd luxemen

# 2. Setup backend
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
cp .env.example .env   # fill in your values

# 3. Setup frontend
cd ../client
npm install
cp .env.example .env   # fill in your values

# 4. Run both
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

---

## 🌱 SEED DATA (prisma/seed.js)

Seed the following on first run:
- 1 Admin user: `admin@luxemen.com` / `Admin@123`
- 11 categories (as listed above)
- 5 sample products per category with variants
- 3 banners
- 2 coupons: `WELCOME10` (10% off) and `FLAT500` (₹500 off on orders above ₹3000)

---

## ✅ FEATURE CHECKLIST SUMMARY

### Customer Features:
- [x] Register / Login / Logout with JWT
- [x] Email verification
- [x] Forgot / Reset password via email
- [x] Browse products with advanced filtering & sorting
- [x] Search products (debounced, full-text)
- [x] Product detail with size/color variant selection
- [x] Image gallery with zoom
- [x] Add to cart (persistent for logged-in users)
- [x] Coupon code application
- [x] Multi-step checkout (address → summary → payment)
- [x] Razorpay payment gateway
- [x] Cash on Delivery option
- [x] Order placement + confirmation email
- [x] Order history and status tracking
- [x] Cancel order
- [x] Wishlist (add/remove/move to cart)
- [x] Write reviews (with images) — only for purchased products
- [x] Manage profile and addresses
- [x] Change password

### Admin Features:
- [x] Secure admin login (JWT + role check)
- [x] Dashboard with revenue, order, and user analytics
- [x] Product CRUD with multi-image upload (Cloudinary)
- [x] Product variant management (size, color, stock, SKU)
- [x] Category CRUD
- [x] Order management with status updates
- [x] Automated email on status change
- [x] User management (view, block)
- [x] Coupon CRUD
- [x] Banner management with image upload
- [x] Review moderation (approve/reject)

---

## 📝 IMPORTANT NOTES FOR THE AI CODER

1. **Build backend first**, test all APIs with Postman/Thunder Client, then build frontend.
2. **All admin routes must use both `verifyToken` AND `verifyAdmin` middleware**.
3. **Product images should be uploaded to Cloudinary** — store `url` and `publicId` in DB. On delete, remove from Cloudinary too.
4. **The cart should merge** — if a guest adds items and then logs in, merge the guest cart with the DB cart.
5. **Stock management** — deduct variant stock ONLY after payment verification, not on order placement.
6. **Prisma migrations** — run `npx prisma migrate dev` for any schema changes.
7. **Use transactions** for order placement (create order + orderItems + deduct stock atomically).
8. **Refresh token rotation** — issue a new refresh token on every `/refresh-token` call and invalidate the old one.
9. **Image upload** — accept max 5 images per product, validate MIME type (jpg, jpeg, png, webp), max 5MB each.
10. **All monetary values** — store as `Decimal` in PostgreSQL, display formatted in INR (₹) using `Intl.NumberFormat`.
```
