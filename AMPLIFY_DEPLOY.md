# AWS Amplify Deployment Guide

## Build Configuration
Amplify auto-detects Next.js. The `amplify.yml` in the root specifies:
- `npm ci` for install
- `npm run build` for build
- `.next` as the artifacts directory

## Environment Variables
Set these in Amplify Console > App settings > Environment variables:

### Required
- `MONGODB_URI` — MongoDB Atlas connection string
- `MONGODB_DB` — Database name (e.g., `allremotes`)
- `PII_ENCRYPTION_KEY` — 32-byte hex key for AES-256-GCM encryption
- `NEXT_PUBLIC_SITE_URL` — Your production URL (e.g., `https://allremotes.com.au`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `NEXT_PUBLIC_APPLE_SERVICE_ID` — Apple Sign In service ID
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_SECRET_KEY` — Stripe secret key

### AWS
- `AWS_ACCESS_KEY_ID` — IAM access key for S3
- `AWS_SECRET_ACCESS_KEY` — IAM secret key
- `AWS_REGION` — S3 region (e.g., `ap-southeast-2`)
- `S3_BUCKET_NAME` — S3 bucket for product images
- `S3_BUCKET_URL` — S3 bucket URL

### Email
- `SMTP_HOST` — SMTP server host
- `SMTP_PORT` — SMTP server port
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password
- `EMAIL_FROM` — From email address

### SMS
- `CLICKSEND_USERNAME` — ClickSend username
- `CLICKSEND_API_KEY` — ClickSend API key
- `CLICKSEND_FROM` — Sender ID

### Shipping
- `STARSHIPIT_API_KEY` — Starshipit API key
- `STARSHIPIT_SUBSCRIPTION_KEY` — Starshipit subscription key

### Inventory
- `UNLEASHED_API_ID` — Unleashed API ID
- `UNLEASHED_API_KEY` — Unleashed API key
- `UNLEASHED_WAREHOUSE_CODE` — Warehouse code (default: MAIN)
- `UNLEASHED_CUSTOMER_CODE` — Customer code

### Channels
- `EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_REDIRECT_URI`, etc.
- `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, etc.
- `TEMU_APP_KEY`, `TEMU_APP_SECRET`, etc.
- `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, etc.
- `CHANNEL_ENCRYPTION_KEY` — Channel credentials encryption key

### Optional
- `PICKOPS_MONGODB_URI` — Separate PickOps MongoDB (if used)
- `PICKOPS_MONGODB_DB` — PickOps database name
- `AGNES_AI_API_KEY` — AI image generation key
- `GSC_SERVICE_ACCOUNT_EMAIL` — Google Search Console
- `GSC_PRIVATE_KEY` — GSC private key
- `ALLOW_ADMIN_ORDERS` — Set to `1` to enable admin order access

## Generate PII Encryption Key
```bash
openssl rand -hex 32
```

## Post-Deployment
1. Run the PII migration script once to encrypt existing data:
   ```bash
   npx tsx scripts/encrypt-existing-pii.ts
   ```
2. Update OAuth redirect URIs (Google, Apple) to point to the Amplify domain
3. Update Stripe webhook endpoints to the new domain
4. Update eBay/Amazon/Temu/AliExpress callback URLs to the new domain
5. Update `NEXT_PUBLIC_SITE_URL` to your custom domain after pointing DNS
