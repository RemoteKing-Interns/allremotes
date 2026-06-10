# Email Integration Setup Guide

This guide explains how to set up email notifications for your All Remotes store.

## Overview

The email system uses **Nodemailer** with SMTP to send transactional emails including:
- Order confirmations
- Shipping updates
- Delivery notifications
- Password reset emails
- Welcome emails for new users
- Low stock alerts (admin)
- Return request notifications (admin)
- New order notifications (admin)

## Configuration

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                       # 587 for TLS, 465 for SSL
SMTP_USER=your-email@gmail.com      # Your SMTP username/email
SMTP_PASS=your-app-password         # Your SMTP password or app password
SMTP_FROM=noreply@allremotes.com.au # From email address
SMTP_FROM_NAME=All Remotes          # From name displayed in emails

# Site URL (for links in emails)
NEXT_PUBLIC_SITE_URL=https://allremotes.com.au

# Admin email for notifications
ADMIN_EMAIL=shane@allremotes.com.au
```

### 2. SMTP Provider Options

#### Gmail
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **User**: Your Gmail address
- **Pass**: Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- Enable "Less secure app access" or use OAuth2 (recommended for production)

#### Outlook/Hotmail
- **Host**: `smtp-mail.outlook.com`
- **Port**: `587`
- **User**: Your Outlook email
- **Pass**: Your Outlook password or app password

#### SendGrid
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **User**: `apikey`
- **Pass**: Your SendGrid API key

#### Mailgun
- **Host**: `smtp.mailgun.org`
- **Port**: `587`
- **User**: Your Mailgun SMTP username
- **Pass**: Your Mailgun SMTP password

#### AWS SES
- **Host**: `email-smtp.[region].amazonaws.com` (e.g., `email-smtp.ap-southeast-2.amazonaws.com`)
- **Port**: `587`
- **User**: Your SES SMTP username
- **Pass**: Your SES SMTP password

### 3. Testing the Configuration

You can test your email configuration in two ways:

#### Option A: API Test
Make a GET request to:
```
GET /api/email
```

Or test with a specific email:
```
POST /api/admin/email-settings/test
{
  "testEmail": "your-test-email@example.com"
}
```

#### Option B: Admin Panel (coming soon)
An email settings page will be added to the admin panel for easy testing.

## API Usage

### Send a Custom Email

```javascript
POST /api/email
{
  "type": "custom",
  "data": {
    "to": "customer@example.com",
    "subject": "Your Subject",
    "html": "<h1>Hello</h1><p>Your message</p>"
  }
}
```

### Send Order Confirmation

```javascript
POST /api/email
{
  "type": "order-confirmation",
  "data": {
    "to": "customer@example.com",
    "orderId": "ORD-123456",
    "customerName": "John Doe",
    "items": [
      { "name": "Garage Remote", "quantity": 1, "price": 35.00 }
    ],
    "total": 35.00,
    "shippingAddress": "123 Main St\nSydney NSW 2000"
  }
}
```

### Send Shipping Update

```javascript
POST /api/email
{
  "type": "shipping-update",
  "data": {
    "to": "customer@example.com",
    "orderId": "ORD-123456",
    "customerName": "John Doe",
    "trackingNumber": "TRK123456789",
    "carrier": "Australia Post",
    "status": "Shipped",
    "estimatedDelivery": "2024-12-25"
  }
}
```

### Send Welcome Email

```javascript
POST /api/email
{
  "type": "welcome",
  "data": {
    "to": "customer@example.com",
    "customerName": "John Doe"
  }
}
```

## Available Email Types

| Type | Description | Use Case |
|------|-------------|----------|
| `order-confirmation` | Order placed confirmation | Customer notification |
| `shipping-update` | Shipping status update | Customer notification |
| `order-delivered` | Package delivered | Customer notification |
| `password-reset` | Password reset link | Customer notification |
| `welcome` | Welcome new user | Customer notification |
| `low-stock` | Low inventory alert | Admin notification |
| `return-request` | Return initiated | Admin notification |
| `new-order` | New order received | Admin notification |
| `custom` | Any custom email | Flexible use |

## Email Templates

All emails use a base template with All Remotes branding. The templates are located in:
- `src/lib/email.ts`

You can customize:
- Colors (currently using emerald green #10b981)
- Logo/header
- Footer text
- Font styles

## Troubleshooting

### Common Issues

#### "Email service not configured"
- Check that all SMTP environment variables are set
- Verify the `.env.local` file is in the project root
- Restart the Next.js server after adding env vars

#### Authentication failed
- For Gmail: Use an App Password, not your regular password
- Check that your email provider allows SMTP access
- Verify username and password are correct

#### Connection timeout
- Check that `SMTP_HOST` and `SMTP_PORT` are correct
- Some providers block port 587, try 465 with `secure: true`
- Check firewall settings

#### Emails going to spam
- Set up SPF, DKIM, and DMARC records for your domain
- Use a dedicated email service (SendGrid, Mailgun) instead of personal email
- Ensure `SMTP_FROM` matches your domain

### Debug Mode

To debug email issues, check the server console for logs. The email service logs:
- Successful sends with message ID
- Errors with detailed messages
- Configuration warnings

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use App Passwords** - For Gmail, never use your main password
3. **Rate Limiting** - Consider implementing rate limiting for the email API
4. **Input Validation** - All email addresses are validated before sending
5. **HTTPS Only** - Always use HTTPS in production for API calls

## Next Steps

1. Add your SMTP credentials to `.env.local`
2. Test the configuration using `/api/email` (GET request)
3. Send a test email to verify everything works
4. Update notification settings in the user account area
5. Hook up email sending to order events in your application

## Support

For issues or questions:
- Check the [Nodemailer documentation](https://nodemailer.com/)
- Review your SMTP provider's documentation
- Contact your email service provider for account-specific issues
