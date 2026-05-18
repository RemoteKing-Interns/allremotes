# Product Feed Documentation

## Overview

This project includes a Google Shopping compatible XML product feed that can be used for:
- Google Merchant Center
- Facebook Commerce Manager
- Other shopping comparison platforms

## Feed URL

The product feed is available at:
```
https://www.allremotes.com.au/api/feed/products
```

## Feed Format

The feed follows the Google Shopping RSS 2.0 specification with the following structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AllRemotes Products Feed</title>
    <link>https://www.allremotes.com.au</link>
    <description>Product feed for AllRemotes.com.au</description>
    <item>
      <g:id>123</g:id>
      <g:title>Toyota Hilux Remote Key</g:title>
      <g:description>Replacement remote...</g:description>
      <link>https://www.allremotes.com.au/product/123</g:link>
      <g:image_link>https://www.allremotes.com.au/image.jpg</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>79.00 AUD</g:price>
      <g:brand>ALLREMOTES</g:brand>
      <g:condition>new</g:condition>
      <g:sku>SKU123</g:sku>
      <g:product_category>garage-gate</g:product_category>
    </item>
  </channel>
</rss>
```

## Required Fields

- **g:id**: Unique product identifier
- **g:title**: Product title (Brand + Model)
- **g:description**: Product description
- **link**: Product page URL
- **g:image_link**: Product image URL
- **g:availability**: Stock status (in stock / out of stock)
- **g:price**: Price in AUD
- **g:brand**: Brand name
- **g:condition**: Product condition (always "new")

## Optional Fields

- **g:sku**: Product SKU
- **g:product_category**: Product category

## Data Source

The feed is automatically generated from the products stored in `products.json`. When you update products via the admin panel, the feed will reflect those changes.

## Caching

The feed is cached for 1 hour (3600 seconds) with stale-while-revalidate for 30 minutes (1800 seconds) to ensure good performance while keeping data reasonably fresh.

## Setup for Google Merchant Center

1. Go to [Google Merchant Center](https://merchants.google.com/)
2. Create a new account or sign in
3. Go to "Products" > "Feeds"
4. Click "Add primary feed"
5. Select "Scheduled fetch" as the feed type
6. Enter:
   - **File name**: `products`
   - **Feed URL**: `https://www.allremotes.com.au/api/feed/products`
   - **Fetch frequency**: Hourly or Daily
7. Click "Create feed"
8. Wait for Google to fetch and validate your feed

## Setup for Facebook Commerce Manager

1. Go to [Facebook Commerce Manager](https://www.facebook.com/commerce_manager/)
2. Create a new catalog or select existing
3. Go to "Data Sources" > "Data Feed"
4. Select "Scheduled Feed"
5. Enter:
   - **Feed name**: AllRemotes Products
   - **Upload schedule**: Daily
   - **Feed URL**: `https://www.allremotes.com.au/api/feed/products`
6. Map your feed fields to Facebook catalog fields
7. Click "Upload"

## Customization

To modify the feed, edit `src/app/api/feed/products/route.ts`:

- **Change base URL**: Modify the `BASE_URL` constant
- **Add more fields**: Extend the `generateProductXml` function
- **Filter products**: Modify the filter logic in the GET function
- **Change caching**: Adjust the `Cache-Control` headers

## Troubleshooting

### Feed not updating
- Check if products.json has been updated
- Clear the cache by waiting 1 hour or redeploying
- Check browser/network caching

### Products missing from feed
- Ensure products have required fields (id, price)
- Check that products are not hidden
- Verify stock field is set correctly

### Google Merchant Center errors
- Validate your feed at [Google Feed Validator](https://validator.google.com/feedvalidator/)
- Check that all required fields are present
- Ensure image URLs are accessible and valid
- Verify prices are in correct format (XX.XX AUD)

## API Endpoint

You can also access the feed programmatically:

```bash
curl https://www.allremotes.com.au/api/feed/products
```

## Security

The feed is publicly accessible but read-only. No authentication is required, which is standard for shopping feeds. The robots.txt file has been updated to allow access to this endpoint.
