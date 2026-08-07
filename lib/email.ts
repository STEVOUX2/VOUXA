import nodemailer from 'nodemailer';

// Initialize nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'info.vouxa@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'kimc pcql bjnc lnnn',
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || '"VOUXA <info.vouxa@gmail.com>"';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Global email wrapper for a premium, dark-themed presentation
function wrapTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            background-color: #080808;
            color: #B9B9B9;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0d0d0d;
            border: 1px solid #1a1a1a;
            border-radius: 16px;
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
          }
          .header {
            padding: 32px;
            text-align: center;
            background: linear-gradient(180deg, #160608 0%, #0d0d0d 100%);
            border-bottom: 1px solid #1a1a1a;
          }
          .logo {
            height: 36px;
            width: auto;
          }
          .content {
            padding: 40px 32px;
          }
          .footer {
            padding: 32px;
            text-align: center;
            border-top: 1px dashed #1a1a1a;
            font-size: 11px;
            color: #555555;
            background-color: #0b0b0b;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #7B1016 0%, #5D0F14 100%);
            color: #F2F2F0 !important;
            padding: 14px 28px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.02em;
            margin-top: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 14px rgba(123, 16, 22, 0.35);
          }
          h1, h2, h3 {
            color: #F2F2F0;
            font-weight: 700;
          }
          h1 {
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: -0.01em;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            margin-top: 0;
            margin-bottom: 16px;
          }
          a {
            color: #ff6b6b;
            text-decoration: none;
          }
          .highlight-box {
            background-color: #121212;
            border: 1px solid #1a1a1a;
            border-radius: 8px;
            padding: 20px;
            margin-top: 24px;
            margin-bottom: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Render SVG logo dynamically via hosted public link -->
            <img src="${SITE_URL}/logo.svg" alt="VOUXA" class="logo" />
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; color: #555555;">© ${new Date().getFullYear()} VOUXA. All rights reserved.</p>
            <p style="margin: 0; color: #444444; line-height: 1.4;">
              This email was sent to you because you created an account on VOUXA. If you did not register, please ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// 1. Welcome Email (General)
export async function sendWelcomeEmail(to: string, name: string, username?: string) {
  const title = 'Welcome to VOUXA';
  const html = wrapTemplate(title, `
    <h1>Welcome, ${name}!</h1>
    <p>We are absolutely thrilled to welcome you to VOUXA — the ultimate stylized hub for movies, TV shows, anime, and watch parties.</p>
    ${username ? `<p>Your official VOUXA username is: <strong>${username}</strong></p>` : ''}
    <p>You now have full access to explore catalogs, track your watchlist, and create watch party rooms to stream content live with your friends.</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}" class="button">Start Watching</a>
    </div>
    <p>If you have any questions or need support, don't hesitate to reply directly to this email or drop us a line at support@vouxa.app.</p>
    <p>See you in the stream,</p>
    <p><strong>The VOUXA Team</strong></p>
  `);

  const text = `Welcome, ${name}!\n\nWe are absolutely thrilled to welcome you to VOUXA — the ultimate stylized hub for movies, TV shows, anime, and watch parties.\n\n${username ? `Your official VOUXA username is: ${username}\n\n` : ''}You now have full access to explore catalogs, track your watchlist, and create watch party rooms to stream content live with your friends.\n\nStart Watching here: ${SITE_URL}\n\nIf you have any questions or need support, don't hesitate to reply directly to this email or drop us a line at support@vouxa.app.\n\nSee you in the stream,\nThe VOUXA Team`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to VOUXA!',
    text,
    html,
  });
}

// 2. Google Sign-In Welcome
export async function sendGoogleWelcomeEmail(to: string, name: string) {
  const title = 'Welcome to VOUXA via Google';
  const html = wrapTemplate(title, `
    <h1>Welcome to VOUXA, ${name}!</h1>
    <p>You have successfully logged in and linked your account using <strong>Google Sign-In</strong>.</p>
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Authentication Method:</strong> Google Oauth 2.0</p>
      <p style="margin: 8px 0 0 0;"><strong>Connected Email:</strong> ${to}</p>
    </div>
    <p>Your account is fully active. You can now use your Google login to access VOUXA instantly from any device without needing to remember another password.</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}" class="button">Explore VOUXA</a>
    </div>
    <p>Best regards,</p>
    <p><strong>The VOUXA Team</strong></p>
  `);

  const text = `Welcome to VOUXA, ${name}!\n\nYou have successfully logged in and linked your account using Google Sign-In.\n\nAuthentication Method: Google Oauth 2.0\nConnected Email: ${to}\n\nYour account is fully active. You can now use your Google login to access VOUXA instantly from any device without needing to remember another password.\n\nExplore VOUXA here: ${SITE_URL}\n\nBest regards,\nThe VOUXA Team`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to VOUXA! (Google Sign-In Connected)',
    text,
    html,
  });
}

// 3. Discord Sign-In Welcome
export async function sendDiscordWelcomeEmail(to: string, name: string, discordTag?: string) {
  const title = 'Welcome to VOUXA via Discord';
  const html = wrapTemplate(title, `
    <h1>Welcome to VOUXA, ${name}!</h1>
    <p>You have successfully connected and logged into VOUXA using your <strong>Discord</strong> account.</p>
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Authentication Method:</strong> Discord Oauth 2.0</p>
      ${discordTag ? `<p style="margin: 8px 0 0 0;"><strong>Discord Profile:</strong> ${discordTag}</p>` : ''}
      <p style="margin: 8px 0 0 0;"><strong>Connected Email:</strong> ${to}</p>
    </div>
    <p>Your account is ready. Join watch parties, create rooms, and connect with your friends today!</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}/watch-party" class="button">Go to Watch Parties</a>
    </div>
    <p>Best regards,</p>
    <p><strong>The VOUXA Team</strong></p>
  `);

  const text = `Welcome to VOUXA, ${name}!\n\nYou have successfully connected and logged into VOUXA using your Discord account.\n\nAuthentication Method: Discord Oauth 2.0\n${discordTag ? `Discord Profile: ${discordTag}\n` : ''}Connected Email: ${to}\n\nYour account is ready. Join watch parties, create rooms, and connect with your friends today!\n\nGo to Watch Parties here: ${SITE_URL}/watch-party\n\nBest regards,\nThe VOUXA Team`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to VOUXA! (Discord Connected)',
    text,
    html,
  });
}

// 4. Password Reset Email
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const resetLink = `${SITE_URL}/auth/reset-password?token=${resetToken}`;
  const title = 'Reset Your VOUXA Password';
  
  const html = wrapTemplate(title, `
    <h1>Hello, ${name}</h1>
    <p>We received a request to reset the password for your VOUXA account. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <div class="highlight-box" style="border-left: 4px solid #7B1016;">
      <p style="margin: 0; font-size: 13px;"><strong>Security Details:</strong></p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #888;">• This password reset link is valid for <strong>1 hour</strong>.</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #888;">• If you didn't request a password reset, you can safely ignore this email; your account remains secure.</p>
    </div>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; opacity: 0.7;"><a href="${resetLink}">${resetLink}</a></p>
  `);

  const text = `Hello, ${name}\n\nWe received a request to reset the password for your VOUXA account. To choose a new password, go to the following link:\n\n${resetLink}\n\nSecurity Details:\n- This password reset link is valid for 1 hour.\n- If you didn't request a password reset, you can safely ignore this email; your account remains secure.`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your VOUXA Password',
    text,
    html,
  });
}

// 5. Email Verification
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyLink = `${SITE_URL}/auth/verify-email?token=${token}`;
  const title = 'Verify Your VOUXA Email';

  const html = wrapTemplate(title, `
    <h1>Hello, ${name}</h1>
    <p>Thank you for registering on VOUXA! Please verify your email address to unlock all streaming features, watchlist tools, and watch parties.</p>
    <div style="text-align: center;">
      <a href="${verifyLink}" class="button">Verify Email</a>
    </div>
    <div class="highlight-box">
      <p style="margin: 0; font-size: 13px; color: #888;">• This link will expire in <strong>24 hours</strong>.</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #888;">• Once verified, your VOUXA account is fully activated.</p>
    </div>
    <p>If the button above does not work, copy and paste the following link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; opacity: 0.7;"><a href="${verifyLink}">${verifyLink}</a></p>
  `);

  const text = `Hello, ${name}\n\nThank you for registering on VOUXA! Please verify your email address to unlock all streaming features, watchlist tools, and watch parties by visiting the following link:\n\n${verifyLink}\n\n- This link will expire in 24 hours.\n- Once verified, your VOUXA account is fully activated.`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your VOUXA Account',
    text,
    html,
  });
}

// 6. Order Confirmation
export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

export async function sendOrderConfirmationEmail(
  to: string, 
  name: string, 
  orderId: string, 
  items: OrderItem[], 
  total: number, 
  deliveryEstimate?: string
) {
  const title = 'Your VOUXA Order Confirmation';

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #1a1a1a;">
      <td style="padding: 12px 0; color: #F2F2F0;">${item.name} x ${item.qty}</td>
      <td style="padding: 12px 0; text-align: right; color: #F2F2F0;">$${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = wrapTemplate(title, `
    <h1>Thank you for your purchase!</h1>
    <p>Hello, ${name}. Your order has been successfully placed. Here are your transaction details:</p>
    
    <div class="highlight-box">
      <p style="margin: 0; font-size: 14px;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #F2F2F0;">#${orderId}</span></p>
      ${deliveryEstimate ? `<p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Estimated Access:</strong> ${deliveryEstimate}</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #1a1a1a; text-align: left;">
          <th style="padding-bottom: 8px; color: #7E7E7E; font-size: 12px; text-transform: uppercase;">Item</th>
          <th style="padding-bottom: 8px; text-align: right; color: #7E7E7E; font-size: 12px; text-transform: uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr>
          <td style="padding: 16px 0 0 0; font-weight: 700; color: #F2F2F0; font-size: 16px;">Grand Total</td>
          <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; color: #ff6b6b; font-size: 16px;">$${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <p>Your items are now ready/processing. If you purchased virtual features or watch party themes, they have already been credited to your VOUXA profile.</p>
    <div style="text-align: center;">
      <a href="${SITE_URL}/profile" class="button">Go to Profile</a>
    </div>
    <p>If you have any questions regarding this order, please contact our transaction desk at billing@vouxa.app.</p>
  `);

  let textItems = items.map(item => `- ${item.name} x ${item.qty}: $${(item.price * item.qty).toFixed(2)}`).join('\n');
  const text = `Thank you for your purchase!\n\nHello, ${name}. Your order has been successfully placed. Here are your transaction details:\n\nOrder ID: #${orderId}\n${deliveryEstimate ? `Estimated Access: ${deliveryEstimate}\n` : ''}\nItems:\n${textItems}\n\nGrand Total: $${total.toFixed(2)}\n\nYour items are now ready/processing. If you purchased virtual features or watch party themes, they have already been credited to your VOUXA profile.\n\nGo to Profile here: ${SITE_URL}/profile\n\nIf you have any questions regarding this order, please contact our transaction desk at billing@vouxa.app.`;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `VOUXA Order Confirmation #${orderId}`,
    text,
    html,
  });
}
