```markdown
# FoodReels - Complete Project Setup Guide

A comprehensive guide to set up and run the FoodReels application locally.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Complete Folder Structure](#complete-folder-structure)
3. [Prerequisites](#prerequisites)
4. [Installation Steps](#installation-steps)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Testing the Application](#testing-the-application)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Common Issues & Solutions](#common-issues--solutions)
11. [Development Workflow](#development-workflow)
12. [Useful Commands](#useful-commands)

---

## Project Overview

**FoodReels** is a short-video food discovery and ordering platform (TikTok meets Zomato).

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | Node.js 20, Express.js |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Authentication | JWT (RS256) |
| Validation | Zod |

### Features

- **Customers:** Browse food reels, like/comment/save, follow restaurants, place orders
- **Restaurant Owners:** Upload reels, manage menu, view analytics, handle orders

---

## Complete Folder Structure

```
foodreels/
│
├── apps/
│   │
│   ├── api/                                    # Backend API Server
│   │   ├── src/
│   │   │   │
│   │   │   ├── cache/
│   │   │   │   └── redis.js                    # Redis client configuration
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── logger/
│   │   │   │   │   └── logger.js               # Winston logger setup
│   │   │   │   │
│   │   │   │   └── middleware/
│   │   │   │       ├── auth.middleware.js      # JWT authentication
│   │   │   │       ├── error-handler.js        # Global error handling
│   │   │   │       ├── not-found-handler.js    # 404 handler
│   │   │   │       ├── rate-limiter.js         # Redis-based rate limiting
│   │   │   │       └── validate.js             # Zod validation middleware
│   │   │   │
│   │   │   ├── config/
│   │   │   │   └── index.js                    # Environment configuration
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── db.js                       # PostgreSQL connection pool
│   │   │   │   ├── migrate.js                  # Migration runner script
│   │   │   │   ├── seed.js                     # Database seeder
│   │   │   │   └── migrations/
│   │   │   │       └── 001_initial_schema.sql  # Initial database schema
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── cleanup-old-data.js         # Daily cleanup job
│   │   │   │   └── flush-redis-counts.js       # Flush counters to DB
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   │
│   │   │   │   ├── auth/                       # Authentication Module
│   │   │   │   │   ├── auth.controller.js
│   │   │   │   │   ├── auth.routes.js
│   │   │   │   │   ├── auth.service.js
│   │   │   │   │   └── auth.validation.js
│   │   │   │   │
│   │   │   │   ├── users/                      # User Management Module
│   │   │   │   │   ├── users.controller.js
│   │   │   │   │   ├── users.routes.js
│   │   │   │   │   ├── users.service.js
│   │   │   │   │   └── users.validation.js
│   │   │   │   │
│   │   │   │   ├── restaurants/                # Restaurant Module
│   │   │   │   │   ├── restaurants.controller.js
│   │   │   │   │   ├── restaurants.routes.js
│   │   │   │   │   ├── restaurants.service.js
│   │   │   │   │   └── restaurants.validation.js
│   │   │   │   │
│   │   │   │   ├── reels/                      # Reels & Feed Module
│   │   │   │   │   ├── feed.service.js         # Feed algorithm
│   │   │   │   │   ├── reels.controller.js
│   │   │   │   │   ├── reels.routes.js
│   │   │   │   │   ├── reels.service.js
│   │   │   │   │   └── reels.validation.js
│   │   │   │   │
│   │   │   │   ├── interactions/               # Likes, Comments, Saves, Follows
│   │   │   │   │   ├── interactions.controller.js
│   │   │   │   │   ├── interactions.routes.js
│   │   │   │   │   ├── interactions.service.js
│   │   │   │   │   └── interactions.validation.js
│   │   │   │   │
│   │   │   │   ├── orders/                     # Order Management Module
│   │   │   │   │   ├── orders.controller.js
│   │   │   │   │   ├── orders.routes.js
│   │   │   │   │   ├── orders.service.js
│   │   │   │   │   └── orders.validation.js
│   │   │   │   │
│   │   │   │   └── analytics/                  # Analytics Module
│   │   │   │       ├── analytics.controller.js
│   │   │   │       ├── analytics.routes.js
│   │   │   │       ├── analytics.service.js
│   │   │   │       └── analytics.validation.js
│   │   │   │
│   │   │   └── server.js                       # Express app entry point
│   │   │
│   │   └── package.json
│   │
│   └── web/                                    # Frontend React Application
│       ├── public/
│       │   └── favicon.svg
│       │
│       ├── src/
│       │   │
│       │   ├── components/                     # Reusable UI Components
│       │   │   ├── CartDrawer/
│       │   │   │   └── CartDrawer.jsx          # Shopping cart slide-up
│       │   │   ├── CommentDrawer/
│       │   │   │   └── CommentDrawer.jsx       # Comments slide-up
│       │   │   ├── FeedScroller/
│       │   │   │   └── FeedScroller.jsx        # Vertical snap scroll
│       │   │   ├── Navbar/
│       │   │   │   └── Navbar.jsx              # Bottom navigation
│       │   │   ├── QRPayment/
│       │   │   │   └── QRPayment.jsx           # QR payment modal
│       │   │   ├── ReelCard/
│       │   │   │   └── ReelCard.jsx            # Reel overlay UI
│       │   │   ├── ReelPlayer/
│       │   │   │   └── ReelPlayer.jsx          # Video player
│       │   │   └── Toast/
│       │   │       └── Toast.jsx               # Toast notifications
│       │   │
│       │   ├── hooks/                          # Custom React Hooks
│       │   │   ├── useInfiniteScroll.js
│       │   │   └── useIntersectionObserver.js
│       │   │
│       │   ├── pages/                          # Route Pages
│       │   │   ├── Feed.jsx                    # Main reel feed
│       │   │   ├── Home.jsx                    # Landing page
│       │   │   ├── Login.jsx                   # Login page
│       │   │   ├── Register.jsx                # Registration page
│       │   │   ├── Profile.jsx                 # User profile
│       │   │   ├── Orders.jsx                  # Order history
│       │   │   ├── OrderDetail.jsx             # Single order view
│       │   │   ├── Restaurant.jsx              # Restaurant profile
│       │   │   ├── ReelDetail.jsx              # Single reel view
│       │   │   ├── SavedReels.jsx              # Saved reels list
│       │   │   ├── RestaurantDashboard.jsx     # Owner analytics
│       │   │   └── RestaurantManage.jsx        # Manage restaurant
│       │   │
│       │   ├── services/                       # API Client Functions
│       │   │   ├── api.js                      # Axios instance
│       │   │   ├── analytics.service.js
│       │   │   ├── auth.service.js
│       │   │   ├── orders.service.js
│       │   │   ├── reels.service.js
│       │   │   ├── restaurants.service.js
│       │   │   └── users.service.js
│       │   │
│       │   ├── store/                          # Zustand State Stores
│       │   │   ├── authStore.js                # Authentication state
│       │   │   ├── cartStore.js                # Shopping cart state
│       │   │   ├── feedStore.js                # Feed/reels state
│       │   │   └── uiStore.js                  # UI state (modals, toasts)
│       │   │
│       │   ├── utils/                          # Utility functions
│       │   │
│       │   ├── App.jsx                         # Main app component
│       │   ├── main.jsx                        # React entry point
│       │   └── index.css                       # Global styles + Tailwind
│       │
│       ├── index.html
│       ├── vite.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── package.json
│
├── infra/                                      # Infrastructure Configuration
│   │
│   ├── docker/
│   │   ├── docker-compose.yml                  # All services
│   │   ├── docker-compose.dev.yml              # Development overrides
│   │   ├── Dockerfile.api                      # API Docker image
│   │   └── Dockerfile.web                      # Web Docker image
│   │
│   └── nginx/
│       ├── nginx.conf                          # Production nginx
│       └── web.nginx.conf                      # Frontend nginx
│
├── scripts/
│   └── generate-jwt-keys.js                    # JWT key generator
│
├── keys/                                       # Generated JWT keys (gitignored)
│   ├── private.pem
│   └── public.pem
│
├── logs/                                       # Application logs (gitignored)
│
├── .env                                        # Environment variables (gitignored)
├── .env.example                                # Example environment file
├── .gitignore
├── package.json                                # Root workspace configuration
├── PROJECT_SETUP.md                            # This file
└── README.md
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| Node.js | 20.x LTS | Runtime | https://nodejs.org/ |
| npm | 10.x+ | Package manager | Included with Node.js |
| PostgreSQL | 15+ | Database | https://www.postgresql.org/download/ |
| Redis | 7+ | Caching | https://redis.io/download/ |
| Git | Latest | Version control | https://git-scm.com/ |

### Optional (Recommended)

| Software | Purpose |
|----------|---------|
| Docker Desktop | Run PostgreSQL & Redis easily |
| VS Code | Code editor |
| Postman | API testing |
| pgAdmin | PostgreSQL GUI |
| Redis Insight | Redis GUI |

### Verify Installation

Open your terminal and run:

```bash
# Check Node.js version (should be 20.x.x)
node --version

# Check npm version (should be 10.x.x)
npm --version

# Check Git
git --version

# If using Docker
docker --version
docker-compose --version

# If PostgreSQL installed locally
psql --version

# If Redis installed locally
redis-cli --version
```

---

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/yourusername/foodreels.git

# Navigate to project directory
cd foodreels
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (root + all workspaces)
npm install
```

This installs dependencies for:
- Root package
- `apps/api` (Backend)
- `apps/web` (Frontend)

### Step 3: Start Database Services

#### Option A: Using Docker (Recommended)

```bash
# Navigate to docker directory
cd infra/docker

# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Verify containers are running
docker-compose ps

# You should see:
# NAME                 STATUS
# foodreels-postgres   running (healthy)
# foodreels-redis      running (healthy)

# Return to project root
cd ../..
```

#### Option B: Local Installation

**PostgreSQL:**

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15
sudo systemctl start postgresql

# Create database
psql -U postgres
```

```sql
-- In PostgreSQL shell
CREATE USER foodreels WITH PASSWORD 'foodreels123';
CREATE DATABASE foodreels OWNER foodreels;
GRANT ALL PRIVILEGES ON DATABASE foodreels TO foodreels;
\q
```

**Redis:**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Generate JWT Keys

```bash
# Run the key generator script
node scripts/generate-jwt-keys.js
```

This will output something like:

```
Generating RSA key pair for JWT signing...

Add these to your .env file:

JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg..."

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhk..."
```

### Step 3: Update .env File

Open `.env` in your editor and update:

```env
# ========================
# API Configuration
# ========================
NODE_ENV=development
PORT=3000

# Database Connection
# For Docker: postgresql://foodreels:foodreels123@localhost:5432/foodreels
# For Local: Update credentials as needed
DATABASE_URL=postgresql://foodreels:foodreels123@localhost:5432/foodreels

# Redis Connection
# For Docker: redis://:redis123@localhost:6379
# For Local without password: redis://localhost:6379
REDIS_URL=redis://:redis123@localhost:6379

# JWT Configuration (paste the generated keys)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_GENERATED_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
YOUR_GENERATED_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----"

JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS - Frontend URL
CORS_ORIGIN=http://localhost:5173

# ========================
# Web Configuration
# ========================
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**Important Notes:**
- For multi-line JWT keys, you can use `\n` for newlines or actual line breaks
- Make sure there are no extra spaces in the keys
- The `CORS_ORIGIN` must match your frontend URL exactly

---

## Database Setup

### Run Migrations

```bash
# Create all database tables
npm run db:migrate
```

**Expected Output:**

```
📦 Connected to PostgreSQL database
🌱 Running migration: 001_initial_schema.sql
✅ Migration completed: 001_initial_schema.sql
✅ All migrations completed
```

### Seed Sample Data

```bash
# Add sample restaurants, users, reels, etc.
npm run seed
```

**Expected Output:**

```
🌱 Starting database seed...
Created admin user
Created test customer
Created test restaurant owner
Created test restaurants
Created food items and reels
Created customer address
✅ Database seed completed successfully

=== Test Credentials ===
Admin: admin@foodreels.com / Admin123!
Customer: customer@test.com / Customer123!
Owner: owner@test.com / Owner123!
========================
```

### Verify Database (Optional)

```bash
# Connect to PostgreSQL
psql postgresql://foodreels:foodreels123@localhost:5432/foodreels

# List all tables
\dt

# You should see tables like:
# users, restaurants, food_items, reels, orders, etc.

# Check sample data
SELECT name, email, role FROM users;

# Exit
\q
```

---

## Running the Application

### Development Mode (Both Frontend & Backend)

```bash
# From project root, start everything
npm run dev
```

This starts:
- **API Server:** http://localhost:3000
- **Web App:** http://localhost:5173

### Run Services Separately

**Terminal 1 - Backend API:**

```bash
npm run dev:api
```

**Terminal 2 - Frontend Web:**

```bash
npm run dev:web
```

### Verify Application is Running

1. **Check API Health:**

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

2. **Open Web Application:**
   - Navigate to http://localhost:5173
   - You should see the FoodReels landing page

3. **Test Login:**
   - Click "Sign In"
   - Email: `customer@test.com`
   - Password: `Customer123!`
   - You should be redirected to the feed

---

## Testing the Application

### Test Accounts

| Role | Email | Password | What they can do |
|------|-------|----------|------------------|
| Customer | customer@test.com | Customer123! | Browse, order, like, comment |
| Restaurant Owner | owner@test.com | Owner123! | Upload reels, manage menu, view analytics |
| Admin | admin@foodreels.com | Admin123! | Full access |

### Customer Testing Flow

```
1. Go to http://localhost:5173
2. Click "Start Watching" to view feed
3. Login with customer@test.com / Customer123!
4. Scroll through reels (vertical scroll)
5. Tap the heart icon to like a reel
6. Tap bookmark icon to save a reel
7. Tap "Add" button on a food item
8. Tap the cart icon (bottom right)
9. Fill delivery address and place order
10. Complete mock QR payment
11. View order in Profile > Order History
```

### Restaurant Owner Testing Flow

```
1. Login with owner@test.com / Owner123!
2. Go to Profile
3. Click "Restaurant Dashboard"
4. View analytics (views, likes, orders)
5. Click "Manage Restaurant"
6. Add a new menu item
7. Upload a new reel (enter video URL)
8. Check your reel appears in the feed
```

### API Testing with cURL

**Register New User:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "role": "customer"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Customer123!"
  }'
```

**Get Feed (Authenticated):**

```bash
# Replace YOUR_TOKEN with token from login response
curl http://localhost:3000/api/v1/reels/feed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Restaurant Details:**

```bash
# Replace RESTAURANT_ID with actual UUID
curl http://localhost:3000/api/v1/restaurants/RESTAURANT_ID
```

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| POST | `/api/v1/auth/refresh` | Refresh token | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/profile` | Get profile | Yes |
| PATCH | `/api/v1/users/profile` | Update profile | Yes |
| GET | `/api/v1/users/saved-reels` | Get saved reels | Yes |
| GET | `/api/v1/users/addresses` | Get addresses | Yes |
| POST | `/api/v1/users/addresses` | Add address | Yes |

### Reels

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/reels/feed` | Get personalized feed | Optional |
| POST | `/api/v1/reels` | Create reel | Yes (Owner) |
| GET | `/api/v1/reels/:id` | Get reel details | Optional |
| DELETE | `/api/v1/reels/:id` | Delete reel | Yes (Owner) |
| POST | `/api/v1/reels/:id/view` | Record view | Yes |
| POST | `/api/v1/reels/:id/like` | Toggle like | Yes |
| POST | `/api/v1/reels/:id/save` | Toggle save | Yes |
| GET | `/api/v1/reels/:id/comments` | Get comments | Yes |
| POST | `/api/v1/reels/:id/comments` | Add comment | Yes |

### Restaurants

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/restaurants/search` | Search restaurants | No |
| GET | `/api/v1/restaurants/my` | My restaurants | Yes (Owner) |
| POST | `/api/v1/restaurants` | Create restaurant | Yes (Owner) |
| GET | `/api/v1/restaurants/:id` | Get restaurant | Optional |
| GET | `/api/v1/restaurants/:id/menu` | Get menu | No |
| POST | `/api/v1/restaurants/:id/menu` | Add menu item | Yes (Owner) |
| POST | `/api/v1/restaurants/:id/follow` | Toggle follow | Yes |

### Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/orders` | Create order | Yes |
| GET | `/api/v1/orders/history` | Order history | Yes |
| GET | `/api/v1/orders/:id` | Order details | Yes |
| PATCH | `/api/v1/orders/:id/status` | Update status | Yes (Owner) |
| POST | `/api/v1/orders/:id/payment-confirm` | Confirm payment | Yes |

### Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/analytics/restaurant/:id` | Restaurant analytics | Yes (Owner) |
| GET | `/api/v1/analytics/reels/:id` | Reel analytics | Yes (Owner) |

---

## Common Issues & Solutions

### Issue 1: Cannot Connect to PostgreSQL

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# Check if PostgreSQL is running

# Docker:
cd infra/docker
docker-compose ps
docker-compose logs postgres

# If not running:
docker-compose up -d postgres

# Local macOS:
brew services list | grep postgresql
brew services restart postgresql@15

# Local Linux:
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

**Verify Connection:**
```bash
psql postgresql://foodreels:foodreels123@localhost:5432/foodreels -c "SELECT 1"
```

---

### Issue 2: Cannot Connect to Redis

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

```bash
# Check if Redis is running

# Docker:
cd infra/docker
docker-compose ps
docker-compose logs redis

# If not running:
docker-compose up -d redis

# Local macOS:
brew services restart redis

# Local Linux:
sudo systemctl restart redis
```

**Verify Connection:**
```bash
redis-cli -a redis123 ping
# Should return: PONG
```

---

### Issue 3: JWT/Token Errors

**Error Messages:**
- "Invalid token"
- "Token has expired"
- "jwt malformed"

**Solutions:**

1. **Regenerate JWT Keys:**
```bash
node scripts/generate-jwt-keys.js
```

2. **Update .env with new keys**

3. **Clear browser storage:**
   - Open DevTools (F12)
   - Application > Local Storage > Clear

4. **Restart API server:**
```bash
# Stop current server (Ctrl+C)
npm run dev:api
```

---

### Issue 4: CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:3000/api/v1/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions:**

1. **Check CORS_ORIGIN in .env:**
```env
CORS_ORIGIN=http://localhost:5173
```

2. **Make sure URLs match exactly** (no trailing slash)

3. **Restart API server after changing .env**

---

### Issue 5: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

---

### Issue 6: Migration Fails

**Error Messages:**
- "relation already exists"
- "permission denied"

**Solutions:**

```bash
# Connect to database
psql postgresql://foodreels:foodreels123@localhost:5432/foodreels

# Option 1: Drop and recreate schema (WARNING: Deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO foodreels;
\q

# Re-run migrations
npm run db:migrate
npm run seed
```

---

### Issue 7: "Module not found" Errors

**Solutions:**

```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm -rf apps/api/node_modules
rm -rf apps/web/node_modules
rm package-lock.json

# Reinstall
npm install
```

---

### Issue 8: Frontend Not Loading / Blank Page

**Solutions:**

1. **Check browser console** (F12 > Console) for errors

2. **Verify API is running:**
```bash
curl http://localhost:3000/health
```

3. **Check Vite is running correctly:**
```bash
npm run dev:web
# Should show: Local: http://localhost:5173/
```

4. **Clear browser cache** and hard reload (Ctrl+Shift+R)

---

### Issue 9: Videos Not Playing

**Possible Causes:**
- Video URL is invalid or inaccessible
- Video format not supported
- CORS issues with video source

**Solutions:**
- Use direct video URLs (not YouTube/Vimeo)
- Use MP4 format
- Use videos from same domain or CORS-enabled CDN
- Test with sample video: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`

---

### Issue 10: Seed Data Not Appearing

**Solutions:**

```bash
# Check if seed was successful
npm run seed

# Verify data in database
psql postgresql://foodreels:foodreels123@localhost:5432/foodreels

# Check users
SELECT id, name, email, role FROM users;

# Check restaurants
SELECT id, name, category FROM restaurants;

# Check reels
SELECT id, caption, restaurant_id FROM reels;

\q
```

---

## Development Workflow

### Making Backend Changes

1. Edit files in `apps/api/src/`
2. Server auto-restarts (nodemon)
3. Test your changes with cURL or Postman

### Making Frontend Changes

1. Edit files in `apps/web/src/`
2. Vite hot-reloads automatically
3. See changes instantly in browser

### Adding a New API Endpoint

1. **Add validation schema** (`module.validation.js`)
2. **Add service function** (`module.service.js`)
3. **Add controller** (`module.controller.js`)
4. **Add route** (`module.routes.js`)

### Adding a New Page

1. Create component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.jsx`
3. Add navigation link if needed

### Database Changes

1. Create new migration:
```bash
touch apps/api/src/database/migrations/002_my_changes.sql
```

2. Write SQL changes

3. Run migration:
```bash
npm run db:migrate
```

---

## Useful Commands

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start both API and Web |
| `npm run dev:api` | Start only API server |
| `npm run dev:web` | Start only Web app |
| `npm run db:migrate` | Run database migrations |
| `npm run seed` | Seed sample data |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

### Database Commands

```bash
# Connect to PostgreSQL
psql postgresql://foodreels:foodreels123@localhost:5432/foodreels

# Common psql commands
\dt          # List tables
\d tablename # Describe table
\q           # Quit
```

### Redis Commands

```bash
# Connect to Redis
redis-cli -a redis123

# Common redis commands
KEYS *       # List all keys
GET key      # Get value
FLUSHALL     # Clear all data
QUIT         # Exit
```

---

## Quick Reference Card

### URLs

| Service | URL |
|---------|-----|
| Web Application | http://localhost:5173 |
| API Server | http://localhost:3000 |
| API Health Check | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@test.com | Customer123! |
| Owner | owner@test.com | Owner123! |
| Admin | admin@foodreels.com | Admin123! |

### Project Scripts

```bash
npm install      # Install dependencies
npm run dev      # Start development
npm run db:migrate   # Run migrations
npm run seed     # Seed data
```

---

## Support

If you encounter issues not covered here:

1. Check the [Common Issues](#common-issues--solutions) section
2. Review logs:
   - API: `apps/api/logs/`
   - Docker: `docker-compose logs`
3. Verify all environment variables in `.env`
4. Ensure all services are running
5. Try restarting all services

---

**Happy Coding! 🚀**
```

This comprehensive `PROJECT_SETUP.md` file includes:

1. ✅ Complete folder structure with explanations
2. ✅ Prerequisites and software requirements
3. ✅ Step-by-step installation instructions
4. ✅ Environment configuration guide
5. ✅ Database setup (Docker and local options)
6. ✅ Running the application
7. ✅ Testing guide with test accounts
8. ✅ Complete API endpoints reference
9. ✅ 10 common issues with detailed solutions
10. ✅ Development workflow
11. ✅ Useful commands quick reference
12. ✅ Quick reference card

You can copy this entire markdown content and save it as `PROJECT_SETUP.md` in your project root!