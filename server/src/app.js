const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter, webhookLimiter } = require('./middleware/rateLimiter');
const orderCtrl = require('./controllers/order.controller');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const reviewRoutes = require('./routes/review.routes');
const couponRoutes = require('./routes/coupon.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const bannerRoutes = require('./routes/banner.routes');
const adminRoutes = require('./routes/admin.routes');
const customOrderRoutes = require('./routes/customOrder.routes');
const consultationRoutes = require('./routes/consultation.routes');

const app = express();

// Behind ngrok / a load balancer, req.ip and req.secure must trust the
// proxy headers — otherwise rate limiting and HTTPS redirect both misbehave.
app.set('trust proxy', 1);

// -------- Security & parsers --------
app.use(
  helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// In production, refuse plain HTTP — redirect to HTTPS so cookies and
// payment payloads never travel in the clear.
if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    return res.redirect(308, `https://${req.headers.host}${req.url}`);
  });
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Razorpay webhook MUST be mounted with the raw body BEFORE express.json,
// otherwise the parsed body will not match the HMAC signature.
app.post(
  '/api/webhooks/razorpay',
  webhookLimiter,
  express.raw({ type: 'application/json', limit: '1mb' }),
  orderCtrl.razorpayWebhook,
);

// Bigger body limits — images are stored as base64 data URLs inside
// the JSON payloads going in and out of the DB.
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// -------- Global rate limiting --------
app.use('/api', apiLimiter);

// -------- Health check --------
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Bellissimo Couture API', version: '1.0.0' });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// -------- Routes --------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/custom-orders', customOrderRoutes);
app.use('/api/consultations', consultationRoutes);
// Public Google OAuth callback (browser-redirected by Google after consent)
app.get(
  '/api/admin/google/callback',
  require('./controllers/consultation.controller').googleCallback,
);
app.use('/api/admin', adminRoutes);

// -------- Error handling --------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
