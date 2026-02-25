# Admin guide

Staff can manage the website content without touching any code.

## How to open the admin

1. In your browser, go to: **`/admin`** (e.g. `https://yoursite.com/admin` or `http://localhost:3000/admin`).
2. Sign in with the admin account:
   - **Email:** `admin@allremotes.com`
   - **Password:** `Admin123!`
3. Use the sidebar to switch between:
   - **Dashboard** – Overview of products, nav sections, and hero.
   - **Products** – Add, edit, or remove products. Change name, price, category, description, image, and stock.
   - **Home content** – Edit hero title/subtitle/description and buttons, feature cards, “Why buy” section, and bottom CTA.
   - **Promotions** – Edit the top info bar (scrolling messages) and manage offer categories + discount offers (e.g. Black Friday, Boxing Day).
   - **Navigation** – Edit menu item labels and links (and icon index 0–29).
   - **Reviews** – Edit customer review text, author, rating, and verified badge.

## Saving changes

- **Products:** Click **“Save all changes”** after editing.
- **Home content / Promotions / Navigation / Reviews:** Click **“Save changes”** in that section.

By default, changes are stored in this browser (localStorage) and appear on the site immediately.

If you run the backend with **MongoDB** configured, admin changes are also persisted to MongoDB so other devices/browsers can see them.

## Bulk upload products (CSV)

There is also a bulk upload tool at **`/admin/upload-products`**. It writes to MongoDB when configured.

1. Install dependencies (first time only): `npm install`
2. Configure MongoDB (recommended, and required on Vercel):
   - Set `MONGODB_URI`
   - Optionally set `MONGODB_DB` (default: `allremotes`)
3. Start the app: `npm run dev`
4. Open the upload page: `http://localhost:3000/admin/upload-products`
5. Download the template CSV from the page, fill it out, then upload it.

### Troubleshooting

- **Upload failed (HTTP 431):** Your browser is sending oversized request headers (usually large cookies like `cart_*`). Clear site cookies for `localhost` / your domain and retry.

### CSV requirements

- File must be `.csv`
- Required columns (headers): `Product Code`, `Product Description`
- Optional columns (supported): `Product Group`, `SellPrice`, `DefaultSellPrice`, `ImageUrl` (others are ignored)
- If a price column is provided, it must be a number greater than 0
- Upsert rule: if a product with the same **Product Code** already exists, it is updated (duplicates in a single upload are rejected)

### Where products are stored

- If `MONGODB_URI` is set, products are saved to MongoDB (recommended; required on Vercel for persistence).
- Otherwise, products may fall back to `products.json` during local development only.

## Changing the admin password

The admin password is set in the code. To change it, a developer must update `src/context/AuthContext.js` (search for `adminPassword`).
