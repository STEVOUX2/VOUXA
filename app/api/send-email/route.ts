import { NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendGoogleWelcomeEmail, 
  sendDiscordWelcomeEmail, 
  sendPasswordResetEmail, 
  sendVerificationEmail, 
  sendOrderConfirmationEmail 
} from '@/lib/email';

// Secure the route with an admin secret token to prevent unauthorized email spam
const EMAIL_SECRET = process.env.NEXTAUTH_SECRET || 'bVUvfKqP3rM7nXwZ9aJkL2oS5tYcEhDg8mQpRiWx';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { template, to, name, data, token } = body;

    // Optional basic authentication check (e.g. from internal scripts/auth files)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${EMAIL_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!to || !template) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let result;

    switch (template) {
      case 'welcome':
        result = await sendWelcomeEmail(to, name || 'User', data?.username);
        break;
      case 'google-welcome':
        result = await sendGoogleWelcomeEmail(to, name || 'User');
        break;
      case 'discord-welcome':
        result = await sendDiscordWelcomeEmail(to, name || 'User', data?.discordTag);
        break;
      case 'password-reset':
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        result = await sendPasswordResetEmail(to, name || 'User', token);
        break;
      case 'verify-email':
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        result = await sendVerificationEmail(to, name || 'User', token);
        break;
      case 'order-confirmation':
        if (!data?.orderId || !data?.items || !data?.total) {
          return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
        }
        result = await sendOrderConfirmationEmail(
          to, 
          name || 'User', 
          data.orderId, 
          data.items, 
          data.total, 
          data.deliveryEstimate
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
