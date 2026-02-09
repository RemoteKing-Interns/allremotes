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
   - **Navigation** – Edit menu item labels and links (and icon index 0–29).
   - **Reviews** – Edit customer review text, author, rating, and verified badge.

## Saving changes

- **Products:** Click **“Save all changes”** after editing.
- **Home content / Navigation / Reviews:** Click **“Save changes”** in that section.

Changes are stored in this browser. They appear on the site immediately. Other devices or browsers will not see these changes unless you use a real backend later.

## Bulk upload products (CSV)

There is also a backend-powered bulk upload tool that writes products to a local JSON file (no database).

1. Install dependencies (first time only): `npm install`
2. Start the upload server: `npm run server`
3. Open the upload page: `http://localhost:3001/admin/upload-products`
4. Download the template CSV from the page, fill it out, then upload it.

### CSV requirements

- File must be `.csv`
- Required columns (headers): `Product Code`, `Product Description`
- Optional columns (supported): `Product Group`, `Base Pack`, `On Hand` (others are ignored)
- If `Base Pack` is provided, it must be a number greater than 0
- Upsert rule: if a product with the same **Brand + Name** already exists in `products.json`, it is updated (duplicates in a single upload are rejected)

### Where products are stored

- Products are saved to `products.json` in the project root.

## Changing the admin password

The admin password is set in the code. To change it, a developer must update `src/context/AuthContext.js` (search for `adminPassword`).
