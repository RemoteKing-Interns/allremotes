# All Remotes Australia - Admin Guide & Documentation

**Version 1.0 | January 2025**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Login](#admin-login)
3. [Dashboard Overview](#dashboard-overview)
4. [Product Management](#product-management)
5. [Order Management](#order-management)
6. [Customer Management](#customer-management)
7. [CSV Import/Export](#csv-importexport)
8. [Analytics & Reports](#analytics--reports)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is All Remotes?

All Remotes is a complete e-commerce platform for selling car remotes, garage remotes, car keys, and key cutting equipment across Australia.

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Admin credentials

---

## Admin Login

### Access the Admin Panel

1. **Navigate to**: [Your Website URL]/login
2. **Enter credentials**:
   - Email: `admin@allremotes.com.au`
   - Password: `admin123`
3. **Click "Log In"**
4. **Navigate to Admin**: Click "Admin" in the top navigation

### First Time Setup

Change the default admin password:
1. Go to Dashboard
2. Update your profile information
3. Choose a strong password

---

## Dashboard Overview

### Main Metrics

The dashboard displays four key metrics:

1. **Total Revenue**: All-time revenue from paid orders
2. **Total Orders**: Number of completed orders
3. **Total Products**: Current product count
4. **Low Stock**: Products with less than 10 units

### Charts

- **Monthly Revenue Chart**: Line graph showing revenue trends
- **Top Products Chart**: Bar chart of best-selling items

---

## Product Management

### View All Products

1. Click **"Products"** tab in admin panel
2. View table with:
   - Product image and name
   - Category
   - Price
   - Current stock level

### Add Products (CSV Method - Recommended)

#### Step 1: Prepare CSV File

Create a CSV file with these columns:

```
name,description,category,brand,model,price,stock,images,featured
```

**Example Row:**
```
"Toyota Camry Remote Key","OEM quality remote for Toyota Camry 2012-2017","car-remotes","Toyota","Camry 2012-2017",95.00,20,"https://example.com/image1.jpg|https://example.com/image2.jpg",true
```

#### Step 2: Import CSV

1. Click **"Import CSV"** button
2. Select your prepared CSV file
3. Wait for confirmation message
4. Verify products appear in the table

### CSV Format Guide

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| name | Yes | Product name | "Holden Commodore Remote Key VE/VF" |
| description | Yes | Full description | "Genuine replacement remote key..." |
| category | Yes | One of: car-remotes, garage-remotes, car-keys, lock-keys, accessories, machinery, tools | "car-remotes" |
| brand | Yes | Manufacturer name | "Holden" |
| model | No | Model number | "Commodore VE/VF" |
| price | Yes | Price in dollars | 89.95 |
| stock | Yes | Quantity available | 15 |
| images | No | Image URLs separated by pipe (|) | "url1|url2|url3" |
| featured | No | Show on homepage (true/false) | true |

### Export Products

1. Click **"Export CSV"** button
2. File downloads automatically
3. Open with Excel or Google Sheets
4. Edit as needed
5. Re-import updated file

### Edit a Product

1. Export products to CSV
2. Find and edit the product row
3. Save the CSV file
4. Import the updated CSV

### Delete a Product

1. Find product in table
2. Click trash icon
3. Confirm deletion

---

## Order Management

### View Orders

1. Click **"Orders"** tab
2. View all customer orders with:
   - Order ID
   - Customer email
   - Total amount
   - Current status
   - Order date

### Update Order Status

1. Find the order in the table
2. Click the status dropdown
3. Select new status:
   - **Pending**: Awaiting payment
   - **Paid**: Payment received
   - **Processing**: Being prepared
   - **Shipped**: Sent to customer
   - **Delivered**: Received by customer
   - **Cancelled**: Order cancelled
4. Status updates automatically

### View Order Details

1. Click **"View"** button on any order
2. See order items and quantities

---

## Customer Management

### View Customers

1. Click **"Customers"** tab
2. View customer data:
   - Name
   - Email
   - Total orders
   - Total amount spent
   - Registration date

### Export Customer Data

1. Use browser developer tools
2. Or integrate with your CRM

---

## CSV Import/Export

### Download Template

Navigate to **Settings** tab to see the CSV format template.

### Best Practices

1. **Backup First**: Always export current products before importing
2. **Test Small**: Import 2-3 products first to test
3. **Check Images**: Ensure image URLs are accessible
4. **Validate Prices**: Double-check pricing before import
5. **Stock Levels**: Keep stock numbers updated

### Troubleshooting Import

**Error: "Import failed: Invalid format"**
- Check CSV has all required columns
- Ensure no extra commas in descriptions
- Use quotes around text fields

**Products Not Showing**
- Verify import success message
- Refresh the products page
- Check browser console for errors

---

## Analytics & Reports

### Overview Tab

Access comprehensive analytics:

1. **Revenue Trends**: Monthly revenue line chart
2. **Top Products**: Best sellers by quantity
3. **Stock Alerts**: Low inventory warnings

### Sales Reports

Export orders to CSV for custom reports:
1. Go to Orders tab
2. Use browser export functionality
3. Analyze in Excel/Google Sheets

### Key Metrics to Monitor

- **Conversion Rate**: Orders vs. website visits
- **Average Order Value**: Total revenue / number of orders
- **Top Categories**: Which product types sell best
- **Low Stock Items**: Products needing restocking

---

## Troubleshooting

### Can't Log In

1. Verify email: `admin@allremotes.com.au`
2. Check password: `admin123` (default)
3. Clear browser cache
4. Try incognito/private window

### Products Not Updating

1. Refresh the page
2. Clear browser cache
3. Check internet connection
4. Try different browser

### Images Not Loading

1. Verify image URLs are public
2. Check URL format (must include http:// or https://)
3. Test URL in browser directly
4. Use image hosting service (Cloudinary, AWS S3)

### CSV Import Issues

1. Save as UTF-8 encoding
2. Use proper CSV format
3. Check for special characters
4. Verify column headers match exactly

---

## Quick Reference

### Categories

- `car-remotes`: Car remote keys
- `garage-remotes`: Garage door remotes
- `car-keys`: Car keys and replacements
- `lock-keys`: Lock keys
- `accessories`: Batteries, cases, etc.
- `machinery`: Key cutting machines
- `tools`: Key cutting tools

### Admin Tasks Checklist

Daily:
- [ ] Check new orders
- [ ] Update order statuses
- [ ] Monitor low stock alerts

Weekly:
- [ ] Review sales analytics
- [ ] Update product inventory
- [ ] Export sales report

Monthly:
- [ ] Analyze top products
- [ ] Plan inventory restocking
- [ ] Review customer data

---

## Support

For technical support:
- Email: support@allremotes.com.au
- Phone: 1300 REMOTE

For product questions:
- Email: info@allremotes.com.au

---

## Appendix: Sample Products CSV

```csv
name,description,category,brand,model,price,stock,images,featured
"Holden Commodore Remote Key VE/VF","Genuine replacement remote key for Holden Commodore VE and VF models. 3 button design with lock, unlock, and boot release.","car-remotes","Holden","Commodore VE/VF",89.95,15,"https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",true
"Toyota Camry Remote Key","OEM quality remote key for Toyota Camry. Features 3 buttons with panic alarm function.","car-remotes","Toyota","Camry 2012-2017",95.00,20,"https://images.unsplash.com/photo-1710006548777-bb4c5c159f86",true
"Merlin E945M Garage Remote","Compatible remote for Merlin garage door openers. Works with most Merlin models.","garage-remotes","Merlin","E945M",45.00,30,"https://images.unsplash.com/photo-1675747158954-4a32e28812c0",true
```

---

**End of Documentation**

*Last Updated: January 2025*
*Version: 1.0*
