import { NextResponse } from 'next/server';
import { getDb, mongoEnabled } from '../../../lib/mongo';
import { sendEmail } from '../../../lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'info@allremotes.com.au';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const { name, email, subject, message } = body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const doc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || '(no subject)',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    // Save to MongoDB
    if (mongoEnabled()) {
      const db = await getDb();
      await db.collection('contact_messages').insertOne({ ...doc });
    }

    // Send email notification to admin (non-blocking)
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Contact Form Message: ${doc.subject}`,
      html: `
        <h2>New message from the All Remotes contact form</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;font-weight:600;color:#374151;width:120px;">Name</td><td style="padding:8px;">${doc.name}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Email</td><td style="padding:8px;"><a href="mailto:${doc.email}">${doc.email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Subject</td><td style="padding:8px;">${doc.subject}</td></tr>
          <tr><td style="padding:8px;font-weight:600;color:#374151;">Received</td><td style="padding:8px;">${new Date(doc.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td></tr>
        </table>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-top:8px;">
          <p style="margin:0;white-space:pre-wrap;">${doc.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="margin-top:20px;font-size:13px;color:#6b7280;">Reply directly to this email to respond to the customer.</p>
      `,
    }).catch((err) => console.error('[Contact] Failed to send email notification:', err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Contact] Error:', err);
    return NextResponse.json(
      { error: 'Failed to submit message', details: err?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!mongoEnabled()) {
      return NextResponse.json([]);
    }
    const db = await getDb();
    const messages = await db
      .collection('contact_messages')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
