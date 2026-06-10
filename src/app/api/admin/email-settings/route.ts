import { NextResponse } from 'next/server';
import { testEmailConfiguration } from '../../../../lib/email';

// GET /api/admin/email-settings - Get current email configuration (without sensitive data)
export async function GET() {
  try {
    // Only return whether email is configured, not the actual credentials
    const isConfigured = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );

    return NextResponse.json({
      configured: isConfigured,
      from: process.env.SMTP_FROM || 'noreply@allremotes.com.au',
      fromName: process.env.SMTP_FROM_NAME || 'All Remotes',
      host: process.env.SMTP_HOST || '',
      port: process.env.SMTP_PORT || '587',
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    return NextResponse.json(
      { error: 'Failed to get email settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-settings/test - Test email configuration
export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json();
    
    // First test the connection
    const configTest = await testEmailConfiguration();
    
    if (!configTest.success) {
      return NextResponse.json(
        { error: configTest.error || 'Email configuration failed' },
        { status: 400 }
      );
    }

    // If test email provided, send a test message
    if (testEmail) {
      const { sendEmail } = await import('../../../../lib/email');
      const result = await sendEmail({
        to: testEmail,
        subject: 'Test Email from All Remotes',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from your All Remotes store.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <br>
          <p>Configuration details:</p>
          <ul>
            <li>From: ${process.env.SMTP_FROM || 'noreply@allremotes.com.au'}</li>
            <li>Host: ${process.env.SMTP_HOST}</li>
            <li>Port: ${process.env.SMTP_PORT || '587'}</li>
          </ul>
        `,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send test email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email configuration verified successfully' 
    });
  } catch (error) {
    console.error('Error testing email settings:', error);
    return NextResponse.json(
      { error: 'Failed to test email configuration' },
      { status: 500 }
    );
  }
}
