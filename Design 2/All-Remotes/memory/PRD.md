# All Remotes E-Commerce Website - Product Requirements Document

## Original Problem Statement
Create an e-commerce website for "All Remotes" brand selling car remotes, garage remotes, keys, and related accessories/machinery. The brand colors are red and white.

## User Personas
- **End Customers**: Australian car/homeowners looking for replacement remotes and keys
- **Trade Professionals**: Locksmiths and auto electricians purchasing equipment and bulk items
- **Admin Users**: Store managers managing inventory, orders, and analytics

## Core Requirements

### E-Commerce Features (Shopify-like)
- [x] Product catalog with images, descriptions, pricing
- [x] Product image zoom-in feature
- [x] Add to Cart functionality
- [x] Cart page with quantity management
- [x] Checkout with Stripe integration
- [x] User authentication (Login/Register)
- [x] User dashboard for order history
- [x] Admin panel with analytics

### Admin Features
- [x] Product CRUD operations
- [x] CSV import/export for bulk product management
- [x] Sales analytics and dashboard
- [x] Order management

### Car Finder Feature
- [x] Manual selection (Make → Year → Model)
- [ ] Vehicle Registration (Rego) lookup - UI exists, backend NOT implemented
- [ ] Australian state selection integration

### Navigation & Design
- [x] Light red and white color scheme (top bar red, navigation light red)
- [x] Category navigation (Garage Remotes, Car Remotes, Car Keys, Machinery, etc.)
- [ ] Multi-level sub-category dropdowns
- [x] Mobile-responsive design
- [x] Background patterns and visual enhancements
- [x] Fixed dropdown transparency issue (solid white backgrounds)

### NEW FEATURES (Jan 28, 2026)
- [x] **Product Reviews & Ratings**
  - 1-5 star rating system
  - Login required to write reviews
  - Rating breakdown chart
  - Review list with user name, date, stars, title, comment
  - One review per user per product
- [x] **Related Products**
  - Shows products from same category AND/OR brand
  - Prioritizes products matching both
  - Displays up to 4 related items
- [x] **Email Notifications** (MOCKED)
  - Order confirmation emails to customers
  - Order notification emails to admin
  - Using Resend API (needs API key to send real emails)
  - Currently logs to console in mock mode

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe (test mode)
- **Email**: Resend (mocked - needs API key)

## What's Been Implemented

### Backend (server.py)
- User authentication with JWT
- Product CRUD with filtering
- Order management
- Stripe checkout integration
- Admin analytics endpoints
- CSV import/export
- Wishlist functionality
- Brand listing endpoint
- **NEW: Reviews API** (create, read, delete)
- **NEW: Related Products API**
- **NEW: Email notification API** (mocked)

### Frontend Pages
- Home (hero, categories, featured products, why choose us)
- Shop (filters, product grid, search)
- Product Detail (zoom, add to cart, specs, **reviews**, **related products**)
- Cart & Checkout
- Auth (Login/Register)
- User Dashboard
- Admin Dashboard

### Components
- Navbar (responsive, light red/white theme)
- Footer (contact info, links)
- CarFinder (UI only, manual selection)

### Database
- 119 products seeded across categories
- Reviews collection
- Admin user: admin@allremotes.com / adminpassword

## P0 - Critical/Next
1. **Find by Rego Backend**: Create API endpoint to search vehicles by registration number
2. **Configure Resend API**: Add API key to enable real email notifications

## P1 - Important
1. Sub-category Navigation: Implement multi-level dropdown menus
2. Backend refactoring (split monolithic server.py)
3. Order status tracking for users

## P2 - Nice to Have
1. Advanced search with autocomplete
2. Wishlist sync across devices

## Known MOCKED Features
- **Email Notifications**: Emails are logged to console, not sent. To enable:
  1. Sign up at https://resend.com
  2. Create API key (starts with `re_...`)
  3. Add to `/app/backend/.env`: `RESEND_API_KEY=re_your_key`
  4. Restart backend: `sudo supervisorctl restart backend`

## Files Structure
```
/app/
├── backend/
│   ├── server.py              # All API routes (including reviews, email)
│   ├── seed_100plus_products.py
│   └── requirements.txt       # Includes resend>=2.0.0
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Footer, CarFinder
│   │   ├── context/           # Auth, Cart providers
│   │   ├── pages/             # All page components
│   │   └── components/ui/     # Shadcn components
│   └── package.json
├── ADMIN_GUIDE.md
├── USER_GUIDE.md
└── test_reports/
```

## 3rd Party Integrations
- **Stripe**: Payment processing (test key in environment)
- **Resend**: Email notifications (MOCKED - needs API key)
