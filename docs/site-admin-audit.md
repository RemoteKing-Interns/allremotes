# AllRemotes Site Audit

## 1. Architecture Summary

- App type: single `Next.js` App Router project with client-heavy pages.
- Global site shell: [`src/app/layout.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/layout.tsx), [`src/app/(site)/layout.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/layout.tsx).
- Persistence model:
  - Preferred: MongoDB via [`src/lib/mongo.ts`](/Users/darsh/Documents/GitHub/allremotes/src/lib/mongo.ts)
  - Fallback: local JSON files `products.json`, `orders.json`, `content.json`
  - Client-only/demo state: many account/admin features still use `localStorage`
- Context providers:
  - Auth: [`src/context/AuthContext.js`](/Users/darsh/Documents/GitHub/allremotes/src/context/AuthContext.js)
  - Store/content/products: [`src/context/StoreContext.js`](/Users/darsh/Documents/GitHub/allremotes/src/context/StoreContext.js)
  - Cart: [`src/context/CartContext.js`](/Users/darsh/Documents/GitHub/allremotes/src/context/CartContext.js)

## 2. UI/UX Design System

### 2.1 Design Tokens

Defined primarily in [`src/index.css`](/Users/darsh/Documents/GitHub/allremotes/src/index.css) and reused through [`src/App.css`](/Users/darsh/Documents/GitHub/allremotes/src/App.css).

| Token | Value | Usage |
| --- | --- | --- |
| `--primary-teal` | `#2e6b6f` | primary brand color, active states, price accents, nav hovers |
| `--teal-light` | `#3d8a8f` | lighter hover/end gradient teal |
| `--teal-dark` | `#1f4a4d` | darker teal backgrounds |
| `--primary-red` | `#a0312d` | secondary brand color, promos, destructive accents |
| `--red-light` | `#c03d38` | lighter hover/end gradient red |
| `--red-dark` | `#7a2522` | darker red variant |
| `--red-bright` | `#d62725` | bright highlight red for hero subtitle/footer tagline |
| `--white` | `#ffffff` | primary surface/background text contrast |
| `--gray-light` | `#f5f5f5` | muted panels, inputs, cards, section backgrounds |
| `--gray-medium` | `#e0e0e0` | borders, dividers, input outlines |
| `--gray-dark` | `#666666` | secondary copy |
| `--text-dark` | `#333333` | primary text |
| `--shadow` | `rgba(0,0,0,0.1)` | card/base shadows |
| `--shadow-hover` | `rgba(0,0,0,0.15)` | stronger hover elevation |

Gradients:

- `--gradient-primary`: teal to teal-light
- `--gradient-secondary`: red to red-light
- `--gradient-mixed`: teal to red
- `--gradient-mixed-reverse`: red to teal
- `--gradient-mixed-diagonal`: teal to teal-light to red
- `--gradient-accent`: bright red to red to teal

### 2.2 Typography

- Base body stack in [`src/index.css`](/Users/darsh/Documents/GitHub/allremotes/src/index.css):
  - `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Oxygen`, `Ubuntu`, `Cantarell`, `Fira Sans`, `Droid Sans`, `Helvetica Neue`, `sans-serif`
- Home styles import `Nunito` and apply it globally with `* { font-family: var(--font-family); }` in [`src/styles/pages/Home.css`](/Users/darsh/Documents/GitHub/allremotes/src/styles/pages/Home.css), so in practice `Nunito` leaks across the app.
- Header/nav copy is consistently uppercase.
- Typical hierarchy:
  - page hero `h1`: `36px` to `48px`
  - section titles: `24px` to `36px`
  - card/product titles: `18px`
  - body copy: `14px` to `18px`
  - labels/meta: `11px` to `14px`

### 2.3 Layout and Spacing

- Global container in [`src/App.css`](/Users/darsh/Documents/GitHub/allremotes/src/App.css):
  - width: `100%`
  - horizontal padding: `20px`, reduced to `15px` on mobile
- Common vertical rhythm:
  - section padding: `40px`, `60px`, or `80px`
  - card padding: `20px`, `24px`, `28px`, `30px`, or `40px`
  - gaps: `8px`, `10px`, `12px`, `16px`, `20px`, `24px`, `30px`
- Radii:
  - buttons/inputs: `6px`, `8px`, `12px`, or pill `50px`
  - cards: `10px`, `12px`, `16px`, `24px`
  - icons/badges: often circular

### 2.4 Buttons

Base button style comes from [`src/App.css`](/Users/darsh/Documents/GitHub/allremotes/src/App.css):

- `.btn`
  - padding `12px 24px`
  - radius `8px`
  - `font-size: 16px`
  - `font-weight: 600`
  - animated shine sweep via `::before`
- Variants:
  - `.btn-primary`: teal gradient
  - `.btn-secondary`: red gradient
  - `.btn-gradient`: teal/red mixed gradient
  - `.btn-gradient-diagonal`: multi-stop teal/red gradient
  - `.btn-outline`: transparent with teal border
  - `.btn-outline-red`: transparent with red border
- Hover behavior:
  - `translateY(-2px)` to `translateY(-3px)`
  - stronger shadow
  - gradient reversal/intensification

### 2.5 Card Styles

Common card patterns:

- Product cards: [`src/components/ProductCard.css`](/Users/darsh/Documents/GitHub/allremotes/src/components/ProductCard.css)
  - white background
  - `12px` radius
  - subtle shadow
  - 3px animated top accent bar
  - hover raise plus teal border
- Feature / Why Buy / Review cards: [`src/styles/pages/Home.css`](/Users/darsh/Documents/GitHub/allremotes/src/styles/pages/Home.css)
  - white surface on light-gray section backgrounds
  - large padding
  - hover lift and shadow increase
- Account cards/panels: [`src/styles/pages/Account.css`](/Users/darsh/Documents/GitHub/allremotes/src/styles/pages/Account.css)
  - white cards
  - `16px` radius
  - soft box shadow
- Admin cards: [`src/styles/pages/Admin.css`](/Users/darsh/Documents/GitHub/allremotes/src/styles/pages/Admin.css)
  - glassmorphism styling
  - semi-transparent white
  - blur backdrop
  - `16px` radius
  - large shadow and hover lift

### 2.6 Navigation Styles

Header and nav styles are in [`src/components/Header.css`](/Users/darsh/Documents/GitHub/allremotes/src/components/Header.css).

- Header:
  - sticky
  - translucent white background with blur
  - strong drop shadow
- Top info bar:
  - mixed teal/red gradient
  - white uppercase text
  - animated shimmer overlay
- Main nav:
  - uppercase links
  - hover wash background
  - active state uses teal text and gradient underline
- Mega menu:
  - centered wide dropdown
  - white glass surface
  - large drop shadow
  - column titles use gradient text
  - items use left accent strip and slight horizontal motion
- Account/cart actions:
  - icon buttons or circular gradient cart button

### 2.7 Form, Table, and Feedback Patterns

- Inputs:
  - mostly rounded `6px` to `12px`
  - `2px` neutral borders
  - teal focus ring/border
- Tables:
  - plain row tables with headings and compact action buttons
  - primary use: admin/products, admin/orders, admin/users
- Feedback states:
  - `.error-message`: pale red background, red border/text
  - `.loading` + `.spinner`: centered teal spinner
  - empty states: centered copy plus CTA

### 2.8 Design-System Observations

- The codebase currently has one dominant legacy token system centered on teal/red gradients.
- The admin area deliberately diverges visually from the storefront:
  - storefront: teal/red brand gradients, white cards, softer e-commerce styling
  - admin: blue/purple glassmorphism background and cards
- Typography is not fully centralized because `Home.css` globally overrides fonts.
- There are a few parallel/legacy APIs and styles, so the design system is consistent in mood but not fully normalized into a single token/component library.

## 3. Page Inventory

### 3.1 Shared Shell

- All public site pages use [`src/app/(site)/layout.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/layout.tsx):
  - sticky header
  - footer
- Header data dependencies:
  - navigation: `useStore().getNavigation()`
  - promotions: `useStore().getPromotions()`
  - products for search: `useStore().getProducts()`
  - cart count: `useCart()`
  - auth state: `useAuth()`

### 3.2 Public Site Routes

| Route | Source | What it displays | Data source / model | Backing API / persistence |
| --- | --- | --- | --- | --- |
| `/` | [`src/app/(site)/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/page.tsx) | Hero slider, trust bar, feature cards, featured products, why-buy cards, homepage reviews, CTA | `home` content doc, products list, homepage reviews | Reads from `StoreContext`, which hydrates from `/api/products` and `/api/content/*`; falls back to `localStorage` |
| `/products/all` | [`src/app/(site)/products/all/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/products/all/page.tsx) | Full product grid, search/category/brand/stock filters, pagination, add-to-cart modal | product list + promotions + cart + auth discount state | `/api/products`; filters persist in URL; cart persists in localStorage/cookies |
| `/products/[category]` | [`src/app/(site)/products/[category]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/products/[category]/page.tsx) | Same product list UI, but category-scoped | same as above | same as above |
| `/product/[id]` | [`src/app/(site)/product/[id]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/product/[id]/page.tsx) | Product image zoom, pricing, stock, quantity, add to cart, wishlist toggle, details tabs, related products | product detail from full products list; promotions; auth-based discount state | `/api/products` via store; wishlist/recently viewed use localStorage |
| `/garage-gate` and nested catch-all | [`src/app/(site)/garage-gate/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/garage-gate/[[...slug]]/page.tsx) | Category hero, section links from navigation, featured garage products | navigation section `garage-gate`, filtered products | `/api/content?section=navigation`, `/api/products` via store |
| `/automotive` and nested catch-all | [`src/app/(site)/automotive/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/automotive/[[...slug]]/page.tsx) | Same category template for automotive | navigation section `automotive`, car products | same as above |
| `/for-the-home` and nested catch-all | [`src/app/(site)/for-the-home/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/for-the-home/[[...slug]]/page.tsx) | Same category template | navigation section `for-the-home`, all products currently shown | same as above |
| `/locksmithing` and nested catch-all | [`src/app/(site)/locksmithing/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/locksmithing/[[...slug]]/page.tsx) | Same category template | navigation section `locksmithing`, all products currently shown | same as above |
| `/shop-by-brand` and nested catch-all | [`src/app/(site)/shop-by-brand/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/shop-by-brand/[[...slug]]/page.tsx) | Brand tiles linking to filtered product list URLs | navigation section `shop-by-brand` | `/api/content?section=navigation` |
| `/support` and nested catch-all | [`src/app/(site)/support/[[...slug]]/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/support/[[...slug]]/page.tsx) | Category-style support page with support navigation tiles and featured products | navigation section `support`, products | `/api/content?section=navigation`, `/api/products` |
| `/contact` | [`src/app/(site)/contact/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/contact/page.tsx) | Contact info plus a static contact form | hardcoded contact copy | no submit handler; form is presentational only |
| `/login` | [`src/app/(site)/login/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/login/page.tsx) | Email/password login plus Google and Apple OAuth buttons | auth/session user model | localStorage auth for email/password; `/api/users` for OAuth user persistence; `/api/auth/apple` for Apple token exchange |
| `/register` | [`src/app/(site)/register/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/register/page.tsx) | Registration form plus Google and Apple OAuth buttons | auth/user model | localStorage auth for email/password; `/api/users`; `/api/auth/apple` |
| `/cart` | [`src/app/(site)/cart/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/cart/page.tsx) | Cart lines, quantity controls, line totals, order summary, checkout modal | cart line items + auth discount state | cart stored in localStorage plus shared cookies via `CartContext` |
| `/checkout` | [`src/app/(site)/checkout/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/checkout/page.tsx), [`src/app/(site)/checkout/CheckoutClient.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/checkout/CheckoutClient.tsx) | Shipping form, address autocomplete, final order summary, success state | cart, logged-in user, checkout form, order payload | `POST /api/orders`; optional Geoapify API from browser |
| `/account` | [`src/app/(site)/account/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/account/page.tsx), [`src/app/(site)/account/AccountClient.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/(site)/account/AccountClient.tsx) | Account dashboard with tabbed sub-panels | user session + many localStorage-backed submodels | Account panels call `/api/orders?email=...`, but the current `GET /api/orders` handler ignores the email query and returns all orders; most other account data is localStorage-only |

### 3.3 Account Sub-Panels

These are not separate routes, but they are separate views within `/account`.

| Tab | Source | Data shown | Persistence |
| --- | --- | --- | --- |
| Account Basics | [`src/components/account/AccountBasics.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/AccountBasics.js) | name, email, phone, profile photo, password change, 2FA toggle | `user` localStorage plus `users` localStorage |
| Orders & Shopping | [`src/components/account/OrdersActivity.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/OrdersActivity.js) | order cards, items, totals, shipping details, status | calls `GET /api/orders?email=...`, but the current route does not filter by email |
| Payments & Billing | [`src/components/account/PaymentsBilling.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/PaymentsBilling.js) | saved cards, billing addresses, recent orders summary | localStorage; order fetch also calls `/api/orders?email=...`, but that filter is currently ignored server-side |
| Addresses | [`src/components/account/Addresses.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/Addresses.js) | shipping address CRUD | localStorage |
| Preferences & Saved | [`src/components/account/PreferencesSaved.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/PreferencesSaved.js) | wishlist, recently viewed, saved searches | localStorage plus product lookup from store |
| Reviews & Interactions | [`src/components/account/ReviewsInteractions.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/ReviewsInteractions.js) | user-written reviews and product questions | localStorage |
| Notifications & Settings | [`src/components/account/NotificationsSettings.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/NotificationsSettings.js) | email/push notification toggles, language/currency/timezone prefs | localStorage; seeded by site settings |
| Help & Support | [`src/components/account/HelpSupport.js`](/Users/darsh/Documents/GitHub/allremotes/src/components/account/HelpSupport.js) | support tickets, FAQs, support contact blocks | localStorage for tickets; FAQ/contact copy hardcoded |

### 3.4 Admin Routes

| Route | Source | What it displays | Data source / API |
| --- | --- | --- | --- |
| `/admin` | [`src/app/admin/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/page.tsx) | Admin login, dashboard, analytics, users, products, orders, home content, promotions, navigation, reviews, settings | mix of localStorage, `/api/products`, `/api/orders`, `/api/content`, `/api/reviews/[id]`, `/api/admin/reset`, `/api/admin/s3*` |
| `/admin/upload-products` | [`src/app/admin/upload-products/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/upload-products/page.tsx) | CSV upload UI, template download, upload results table | `/api/admin/upload-products`, `/api/admin/upload-products/template.csv`, store refresh via `/api/products` |
| `/admin/top-info-bar` | [`src/app/admin/top-info-bar/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/top-info-bar/page.tsx) | standalone top-info-bar editor | `useStore().getPromotions()` and `POST /api/content/promotions` |
| `/admin/save-hero-urls` | [`src/app/admin/save-hero-urls/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/save-hero-urls/page.tsx) | direct hero-image URL editor | `POST /api/content/home` |
| `/admin/clear-cache` | [`src/app/admin/clear-cache/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/clear-cache/page.tsx) | local cache clearing utility | localStorage only |

### 3.5 Route Gaps / Orphans

- Footer links to `/privacy`, but no `privacy` route exists.
- `CarFinder` exists as a component, but nothing renders it.
- There are parallel legacy APIs (`/api/content/[key]`, `/api/settings`, `/api/admin/orders`) alongside the generic routes the UI actually uses (`/api/content`, `/api/orders`, `/api/orders/[id]`).

## 4. Data Models and APIs

### 4.1 Core Data Models

#### Product

Primary source: `products` collection or `products.json`

Observed fields:

- `id`
- `name`
- `category`
- `price`
- `description`
- `inStock`
- `brand`
- `sku`
- `image`
- `imageIndex`
- `condition`
- `returns`
- `seller`
- `skuKey`
- `createdAt`
- `updatedAt`

#### Order

Used by checkout, admin orders, and account order history.

Observed fields:

- `id`
- `status`
- `createdAt`
- `updatedAt`
- `customer.fullName`
- `customer.email`
- `shipping.address`
- `shipping.city`
- `shipping.state`
- `shipping.zipCode`
- `shipping.country`
- `pricing.currency`
- `pricing.subtotal`
- `pricing.discountTotal`
- `pricing.total`
- `pricing.hasMemberDiscount`
- `pricing.memberDiscountRate`
- `items[].id`
- `items[].name`
- `items[].category`
- `items[].quantity`
- `items[].unitPrice`
- `items[].lineTotal`

#### Home Content

Stored in `content.home`.

- `heroImages[]`
- `hero.title`
- `hero.subtitle`
- `hero.description`
- `hero.primaryCta`
- `hero.primaryCtaPath`
- `hero.secondaryCta`
- `hero.secondaryCtaPath`
- `features[].icon`
- `features[].title`
- `features[].description`
- `features[].path`
- `features[].linkText`
- `whyBuy[].icon`
- `whyBuy[].title`
- `whyBuy[].description`
- `ctaSection.title`
- `ctaSection.description`
- `ctaSection.buttonText`
- `ctaSection.buttonPath`

#### Navigation

Stored in `content.navigation`.

- section key
- `title`
- `path`
- `hidden`
- `columns[].title`
- `columns[].items[].name`
- `columns[].items[].path`
- `columns[].items[].iconIndex`
- `columns[].items[].icon`
- `columns[].items[].hidden`
- optional `isShopAll`

#### Homepage Review

Stored in `content.reviews`.

- `id`
- `rating`
- `text`
- `author`
- `verified`
- `date`

#### Promotions

Stored in `content.promotions`.

- `topInfoBar.enabled`
- `topInfoBar.items[]`
- `offers.categories[].id`
- `offers.categories[].name`
- `offers.offers[].id`
- `offers.offers[].categoryId`
- `offers.offers[].name`
- `offers.offers[].enabled`
- `offers.offers[].appliesTo`
- `offers.offers[].discountPercent`
- `offers.offers[].startDate`
- `offers.offers[].endDate`
- `offers.stackWithMemberDiscount`

#### Settings

Stored in `content.settings`.

- `siteName`
- `siteEmail`
- `maintenanceMode`
- `enableRegistration`
- `enableReviews`
- `itemsPerPage`
- `currency`
- `timezone`

#### Auth / User

There are two separate user models:

1. Demo local auth user in `localStorage`:
   - `id`
   - `name`
   - `email`
   - `password`
   - `role`
   - `status`
   - `createdAt`
   - optional profile fields such as `phone`, `profilePhoto`, `twoFactorEnabled`

2. OAuth/Mongo user created via `/api/users`:
   - `id`
   - `name`
   - `email`
   - `provider`
   - `picture`
   - `createdAt`
   - `updatedAt`

### 4.2 Page-Specific LocalStorage Models

Account/admin areas still use browser-only storage for:

- `users`
- `user`
- `allremotes_addresses_<user>`
- `allremotes_payment_methods_<user>`
- `allremotes_billing_addresses_<user>`
- `allremotes_wishlist_<user>`
- `allremotes_recently_viewed_<user>`
- `allremotes_saved_searches_<user>`
- `allremotes_user_reviews_<user>`
- `allremotes_user_questions_<user>`
- `allremotes_support_tickets_<user>`
- `allremotes_notifications_<user>`
- `allremotes_home_content`
- `allremotes_navigation`
- `allremotes_reviews`
- `allremotes_promotions`
- `allremotes_settings`
- `allremotes_products`

### 4.3 API Route Inventory

#### Actively used by the current UI

| Route | Methods | Purpose | Used by |
| --- | --- | --- | --- |
| `/api/products` | `GET` | fetch all products | home, header search, product list, product detail, category pages, admin products |
| `/api/orders` | `GET`, `POST` | list all orders, create order | admin orders, checkout |
| `/api/orders/[id]` | `GET`, `PATCH` | fetch/update a single order | admin orders status update |
| `/api/content` | `GET`, `PUT` | generic content section fetch/save via `section` query/body | admin home/navigation/reviews/promotions/settings |
| `/api/reviews/[id]` | `PATCH`, `DELETE` | mutate individual homepage reviews | admin reviews delete path |
| `/api/users` | `GET`, `POST` | OAuth user persistence in Mongo | login/register OAuth flow |
| `/api/auth/apple` | `POST` | Apple sign-in token exchange | login/register Apple OAuth |
| `/api/admin/products` | `PUT` | bulk save normalized products | admin products "Save all changes" |
| `/api/admin/upload-products` | `POST` | CSV import/upsert into products store | admin CSV upload page |
| `/api/admin/upload-products/template.csv` | `GET` | download CSV template | admin CSV upload page |
| `/api/admin/reset` | `POST` | wipe products/orders/content test data | admin settings reset |
| `/api/admin/s3` | `GET` | list S3 images | admin home S3 image picker |
| `/api/admin/s3/upload` | `POST` | create presigned S3 upload URL | admin home image upload |

#### Present but mostly legacy/parallel

| Route | Methods | Notes |
| --- | --- | --- |
| `/api/content/[key]` | `GET`, `POST` | richer normalize/serialize layer; current admin pages mostly use `/api/content` instead |
| `/api/settings` | `GET`, `PUT` | duplicate settings-specific content route |
| `/api/reviews` | `GET` | fetches reviews array only |
| `/api/admin/orders` | `GET`, `PATCH` | separate admin order API with prod guard; current `/admin` page now uses `/api/orders` and `/api/orders/[id]` |

## 5. `/admin` Page Audit

Primary source: [`src/app/admin/page.tsx`](/Users/darsh/Documents/GitHub/allremotes/src/app/admin/page.tsx)

### 5.1 Admin Entry / Access Control

- Login state is client-side only via `useAuth()`
- Hardcoded admin credentials:
  - email: `admin@allremotes.com`
  - password: `Admin123!`
- Login form fields:
  - `Email`
  - `Password`
- Login actions:
  - `Sign in`
  - `Back to site`
- Access denied screen action:
  - `Go home`

### 5.2 Admin Navigation Tabs

- Dashboard
- Analytics
- Users
- Products
- Orders
- Home content
- Promotions
- Navigation
- Reviews
- Settings
- Extra sidebar link: `Upload CSV` to `/admin/upload-products`

### 5.3 Dashboard Tab

Read-only summary tab.

Displays:

- Stats cards:
  - Total Products
  - Orders
  - Reviews
  - Active Promotions
- Recent Activity list:
  - hardcoded entries only
- Quick Actions:
  - Add New Product
  - View Analytics
  - Site Settings
  - Import Products
- Hero Preview:
  - Title
  - Subtitle
  - Description

Data sources:

- `/api/products`
- `/api/orders`
- `/api/content?section=reviews`
- `getPromotions()` from store
- `getHomeContent()` from store

### 5.4 Analytics Tab

Fields:

- `timeRange` select:
  - Last 24 hours
  - Last 7 days
  - Last 30 days
  - Last 90 days

Displays:

- informational placeholder only

Actions:

- change time range

No real analytics API is connected.

### 5.5 Users Tab

Persistence: `localStorage` only, not backend/global auth.

Table columns:

- Name
- Email
- Role
- Status
- Joined
- Actions

Add User form fields:

- Name
- Email
- Password
- Role (`customer` or `admin`)

Actions:

- Add User
- Cancel add
- Disable / Enable user
- Delete user

Read-only summary cards:

- User Statistics
- Recent Signups
- User Roles

Special behavior:

- built-in `admin` row cannot be disabled or deleted

### 5.6 Products Tab

Table columns:

- Image
- Name
- Category
- Price
- Stock
- Actions

Edit form fields:

- Name
- Category (`garage`, `car`)
- Price (AU$)
- Image (select from `productImagePool`)
- Description
- Brand
- In stock (`yes`, `no`)

Actions:

- Add product
- Save all changes
- Edit
- Delete
- Done editing

Data flow:

- load: `/api/products`
- save: `useStore().setProducts()` which also writes through to `/api/admin/products`

### 5.7 Orders Tab

Table columns:

- Order
- Date
- Customer
- Items
- Total
- Status

Editable field:

- Status select:
  - `processing`
  - `shipped`
  - `delivered`
  - `cancelled`

Actions:

- Refresh
- per-row status update

Data flow:

- load: `GET /api/orders`
- update: `PATCH /api/orders/[id]`

### 5.8 Home Content Tab

Sections and fields:

1. Hero section
- Hero banner images (repeatable URL list)
- per-image actions:
  - Browse S3 Images
  - Remove
- global image actions:
  - Add image
- hero copy fields:
  - Title
  - Subtitle
  - Description
  - Primary button text
  - Primary button path
  - Secondary button text
  - Secondary button path

2. Feature cards
- repeatable items with:
  - Icon (emoji)
  - Title
  - Description
  - Link path
  - Link text
- actions:
  - Add feature
  - Delete feature

3. Why buy section
- repeatable items with:
  - Icon
  - Title
  - Description
- actions:
  - Add item
  - Delete item

4. CTA section (bottom)
- Title
- Description
- Button text
- Button path

S3 modal:

- tabs:
  - Browse S3 Images
  - Upload new image
- browse mode actions:
  - select image
  - Use this image
  - Cancel
- upload mode actions:
  - choose file
  - upload via presigned URL

Save action:

- Save changes

Data flow:

- load: `GET /api/content?section=home`
- save: `PUT /api/content` with section `home`
- S3: `/api/admin/s3`, `/api/admin/s3/upload`

### 5.9 Navigation Tab

Per section fields:

- Section title
- Section path
- Show checkbox

Per navigation item fields:

- Label
- Path
- Icon index
- Show checkbox

Actions:

- Save changes

Notes:

- no create/delete section UI
- no create/delete item UI
- editor only mutates existing nav structure

Data flow:

- load: `GET /api/content?section=navigation`
- save: `PUT /api/content` with section `navigation`

### 5.10 Reviews Tab

Per review fields:

- Rating
- Text
- Author
- Verified (`yes` / `no`)

Actions:

- Add review
- Save changes
- Delete review

Data flow:

- load: `GET /api/content?section=reviews`
- save: `PUT /api/content` with section `reviews`
- delete single review: `DELETE /api/reviews/[id]`

### 5.11 Promotions Tab

1. Top info bar
- Enabled checkbox
- repeatable text items
- actions:
  - Add item
  - Remove item

2. Offer categories
- category name
- actions:
  - Add category
  - Delete category

3. Offers
- Name
- Category
- Discount (%)
- Applies to (`all`, `car`, `garage`)
- Start date
- End date
- Enabled checkbox
- global flag:
  - Stack with member discount
- actions:
  - Add offer
  - Delete offer

Save action:

- Save changes

Data flow:

- load: `GET /api/content?section=promotions`
- save: `PUT /api/content` with section `promotions`

### 5.12 Settings Tab

General Settings fields:

- Site Name
- Site Email
- Items Per Page
- Currency
- Timezone

Feature Toggles:

- Maintenance Mode
- Enable User Registration
- Enable Reviews

Read-only System Information:

- Version
- Environment
- Database
- Persistence
- Reset policy
- Note

Actions:

- Save Settings
- Reset Test Data

Data flow:

- load: `GET /api/content?section=settings`
- save: `PUT /api/content` with section `settings`
- reset: `POST /api/admin/reset`

### 5.13 `/admin/upload-products`

Separate admin page, but operationally part of the admin toolset.

Fields:

- CSV file picker

Actions:

- Download template CSV
- Upload

Result blocks:

- Rows processed
- Created
- Updated
- Failed

Failure table columns:

- Row
- Product Code
- Description
- Errors

Data flow:

- template: `GET /api/admin/upload-products/template.csv`
- upload: `POST /api/admin/upload-products`
- refreshes product store after success

## 6. Key Findings

- The storefront and admin are not on the same visual system. The storefront is teal/red brand-led; the admin is a separate blue/purple glass UI.
- The app is only partially backend-driven:
  - products, orders, and content sections can persist server-side
  - user management and most account tools are still browser-only
- `/api/content` and `/api/content/[key]` overlap.
- `/api/admin/orders` exists but the current admin page no longer uses it.
- OAuth user persistence exists, but regular email/password auth is still localStorage-only.
- `/api/users` assumes MongoDB is available and has no JSON/local fallback, so OAuth persistence is not symmetrical with the rest of the app.
- Account order-history panels expect server-side email filtering, but `GET /api/orders` currently returns all orders.
- The footer exposes a `/privacy` link that is not implemented.
- `CarFinder` is present in the codebase but not mounted anywhere.
