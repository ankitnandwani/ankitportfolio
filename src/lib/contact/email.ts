/**
 * Contact form email delivery.
 *
 * Sends contact form submissions via a transactional email provider.
 * Currently supports Resend (recommended) with a fallback for development.
 */

import type { ContactFormData } from '../../data/contact.ts';

/**
 * The result of sending an email.
 */
export interface EmailResult {
  /** Whether the email was sent successfully. */
  ok: boolean;
  /** Error message if failed. */
  error?: string;
  /** Provider-specific message ID. */
  messageId?: string;
}

/**
 * Email delivery configuration.
 */
export interface EmailConfig {
  /** The email provider to use. */
  provider: 'resend' | 'console';
  /** Resend API key (required when provider is 'resend'). */
  resendApiKey?: string;
  /** The email address to send contact form submissions to. */
  toEmail: string;
  /** The from email address. */
  fromEmail: string;
  /** The from name. */
  fromName?: string;
}

/**
 * Gets the email configuration from environment variables.
 */
function getEmailConfig(): EmailConfig {
  const provider = (process.env.CONTACT_EMAIL_PROVIDER as 'resend' | 'console') ?? 'console';

  return {
    provider,
    resendApiKey: process.env.RESEND_API_KEY,
    toEmail: process.env.CONTACT_TO_EMAIL ?? 'contact@ankitnandwani.com',
    fromEmail: process.env.CONTACT_FROM_EMAIL ?? 'noreply@ankitnandwani.com',
    fromName: process.env.CONTACT_FROM_NAME ?? 'Portfolio Contact Form',
  };
}

/**
 * Builds the HTML email content.
 */
function buildHtmlEmail(data: ContactFormData): string {
  const escapedName = escapeHtml(data.name);
  const escapedEmail = escapeHtml(data.email);
  const escapedCompany = escapeHtml(data.company);
  const escapedMessage = escapeHtml(data.message).replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f5f5f5; border-radius: 8px; padding: 24px;">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #1a1a1a;">New Contact Form Submission</h1>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666; width: 120px;">Name</td>
        <td style="padding: 8px 0;">${escapedName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Email</td>
        <td style="padding: 8px 0;"><a href="mailto:${escapedEmail}" style="color: #0066cc; text-decoration: none;">${escapedEmail}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Company</td>
        <td style="padding: 8px 0;">${escapedCompany || '<em>Not provided</em>'}</td>
      </tr>
    </table>

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #ddd;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #666;">Message</p>
      <div style="background: white; padding: 16px; border-radius: 4px; white-space: pre-wrap;">${escapedMessage}</div>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
      <p style="margin: 0;">This message was sent from the contact form on <a href="https://ankitnandwani.com" style="color: #0066cc;">ankitnandwani.com</a>.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Builds the plain text email content.
 */
function buildTextEmail(data: ContactFormData): string {
  return `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Company: ${data.company || 'Not provided'}

Message:
${data.message}

---
This message was sent from the contact form on https://ankitnandwani.com.
  `.trim();
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Sends an email using Resend.
 */
async function sendWithResend(
  data: ContactFormData,
  config: EmailConfig
): Promise<EmailResult> {
  if (!config.resendApiKey) {
    return { ok: false, error: 'Resend API key not configured' };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(config.resendApiKey);

    const { data: result, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: config.toEmail,
      subject: `Portfolio Contact: ${data.name}`,
      html: buildHtmlEmail(data),
      text: buildTextEmail(data),
      replyTo: data.email,
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, messageId: result?.id };
  } catch (error) {
    console.error('[email] Resend send failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Logs the email to console (for development/testing).
 */
async function sendToConsole(data: ContactFormData): Promise<EmailResult> {
  console.log('[email] Contact form submission (console mode):');
  console.log(buildTextEmail(data));
  return { ok: true, messageId: `console-${Date.now()}` };
}

/**
 * Sends a contact form submission email.
 *
 * @param data The validated contact form data.
 * @returns The result of the email delivery.
 */
export async function sendContactEmail(data: ContactFormData): Promise<EmailResult> {
  const config = getEmailConfig();

  switch (config.provider) {
    case 'resend':
      return sendWithResend(data, config);
    case 'console':
    default:
      return sendToConsole(data);
  }
}

/**
 * Validates that the email configuration is complete for production.
 */
export function validateEmailConfig(): { ok: boolean; error?: string } {
  const config = getEmailConfig();

  if (config.provider === 'resend' && !config.resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY is required when using Resend provider' };
  }

  return { ok: true };
}

export type { ContactFormData } from '../../data/contact.ts';