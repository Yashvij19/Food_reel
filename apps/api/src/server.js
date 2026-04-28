const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./common/logger/logger');
const { errorHandler } = require('./common/middleware/error-handler');
const { notFoundHandler } = require('./common/middleware/not-found-handler');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const restaurantsRoutes = require('./modules/restaurants/restaurants.routes');
const reelsRoutes = require('./modules/reels/reels.routes');
const interactionsRoutes = require('./modules/interactions/interactions.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/restaurants', restaurantsRoutes);
app.use('/api/v1/reels', reelsRoutes);
app.use('/api/v1', interactionsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 FoodReels API server running on port ${PORT}`);
  logger.info(`📍 Environment: ${config.nodeEnv}`);
});

module.exports = app;