# All Remotes Australia - E-Commerce Platform

**Professional remote and key retail website for the Australian market**

---

## 🚀 Quick Start

### Access the Website

- **Main Website**: https://allremotes-shop.preview.emergentagent.com
- **Admin Panel**: https://allremotes-shop.preview.emergentagent.com/admin

### Default Login Credentials

**Admin Account:**
- Email: `admin@allremotes.com.au`
- Password: `admin123`

⚠️ **Important**: Change the default password after first login!

---

## 📋 Features

### For Customers
✅ Browse 25+ products across 7 categories
✅ Advanced search and filtering
✅ Product image zoom and gallery
✅ Shopping cart with quantity management
✅ Wishlist functionality
✅ Secure Stripe payment checkout
✅ Customer dashboard with order history
✅ Related products suggestions
✅ Mobile-responsive design

### For Administrators
✅ **Analytics Dashboard** - Revenue, orders, top products, monthly trends
✅ **Product Management** - Add, edit, delete products
✅ **CSV Import/Export** - Bulk product upload
✅ **Order Management** - Track and update order statuses
✅ **Customer Management** - View customer data and spending
✅ **Inventory Tracking** - Low stock alerts
✅ **Sales Reports** - Visual charts and data export

---

## 🛠️ Admin Guide

### 1. Product Management

#### Adding Products via CSV (Recommended)

1. **Download Template**: Use `/app/product_import_template.csv`
2. **Edit Template**: Add your products following the format
3. **Import**: Admin Panel → Products → Import CSV
4. **Verify**: Check products appear in the list

#### CSV Format

```csv
name,description,category,brand,model,price,stock,images,featured
"Product Name","Description here","car-remotes","Brand","Model",99.95,20,"url1|url2",true
```

**Categories:**
- `car-remotes` - Car remote keys
- `garage-remotes` - Garage door remotes
- `car-keys` - Car keys
- `lock-keys` - Lock keys
- `accessories` - Batteries, cases, etc.
- `machinery` - Key cutting machines
- `tools` - Key cutting tools

#### Multiple Images

Separate image URLs with pipe character: `url1|url2|url3`

### 2. Order Management

1. Go to **Orders** tab
2. View all customer orders
3. Update status using dropdown:
   - Pending → Paid → Processing → Shipped → Delivered
4. Track customer information and order details

### 3. Analytics

**Overview Tab** shows:
- Total revenue (all-time)
- Total paid orders
- Product count
- Low stock alerts (< 10 units)
- Monthly revenue chart
- Top selling products

**Export Data:**
- Products: CSV export button
- Orders: Browser export functionality
- Customers: Available in Customers tab

---

## 💳 Payment Integration

### Stripe Test Mode

The site uses Stripe test mode with key: `sk_test_emergent`

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires Authentication: `4000 0027 6000 3184`

Use any future expiry date and any CVC.

---

## 📦 Current Product Inventory

**25 Products across 7 categories:**

### Car Remotes (13 products)
- Holden Commodore VE/VF - $89.95
- Toyota Camry 2012-2017 - $95.00
- Ford Ranger PX Series - $125.00
- Mazda CX-5 Smart Key - $145.00
- Toyota Hilux 2015-2023 - $115.00
- And 8 more...

### Garage Remotes (5 products)
- Merlin E945M - $45.00
- B&D TB6 - $52.00
- Boss BOC-2 - $38.00
- ATA PTX-4 - $55.00
- Gliderol TM305C - $48.00

### Equipment (7 products)
- Key Cutting Machine KC-300 - $1,299.00
- Portable Duplicator KD-150 - $899.00
- Professional Tools Set - $189.00
- Universal Programmer - $599.00
- And 3 more accessories...

---

## 📖 Documentation Files

1. **ADMIN_GUIDE.md** - Complete admin instructions
2. **product_import_template.csv** - CSV import template
3. **USER_GUIDE.md** - This file

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready ✅
