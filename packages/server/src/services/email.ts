/**
 * Email Service
 *
 * Handles sending emails with multiple provider implementations:
 * - console: Logs to console (development)
 * - smtp: SMTP via nodemailer
 * - resend: Resend API (optional)
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Email Service Interface
 */
export interface EmailService {
  sendMagicLink(email: string, url: string, siteName: string): Promise<void>
}

/**
 * Console Email Service (Development)
 * Logs emails to console instead of sending
 */
export class ConsoleEmailService implements EmailService {
  async sendMagicLink(email: string, url: string, siteName: string): Promise<void> {
    console.log('\n=== Magic Link Email ===')
    console.log(`To: ${email}`)
    console.log(`Subject: Login to ${siteName}`)
    console.log(`\nHi there,\n`)
    console.log(`Click the link below to login to ${siteName}:\n`)
    console.log(`${url}\n`)
    console.log(`This link will expire in 15 minutes.\n`)
    console.log('========================\n')
  }
}

/**
 * SMTP Email Service (Nodemailer)
 * Sends emails via SMTP server
 */
export class SMTPEmailService implements EmailService {
  private transporter: Transporter

  constructor(
    private config: {
      host: string
      port: number
      user: string
      pass: string
      from: string
    }
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
  }

  async sendMagicLink(email: string, url: string, siteName: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: email,
      subject: `Login to ${siteName}`,
      text: this.getTextContent(url, siteName),
      html: this.getHTMLContent(url, siteName),
    })
  }

  private getTextContent(url: string, siteName: string): string {
    return `Hi there,

Click the link below to login to ${siteName}:

${url}

This link will expire in 15 minutes.

If you didn't request this email, you can safely ignore it.`
  }

  private getHTMLContent(url: string, siteName: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="margin-top: 0; color: #1a1a1a; font-size: 24px;">Login to ${siteName}</h1>
    <p style="margin-bottom: 25px; color: #666;">Hi there,</p>
    <p style="margin-bottom: 25px; color: #666;">Click the button below to login to ${siteName}:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">Login to ${siteName}</a>
    </div>
    <p style="margin-top: 25px; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #2563eb; word-break: break-all; font-size: 14px;">${url}</p>
    <p style="margin-top: 30px; color: #999; font-size: 13px;">This link will expire in 15 minutes.</p>
    <p style="color: #999; font-size: 13px;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>`
  }
}

/**
 * Resend Email Service
 * Sends emails via Resend API
 */
export class ResendEmailService implements EmailService {
  constructor(
    private config: {
      apiKey: string
      from: string
    }
  ) {}

  async sendMagicLink(email: string, url: string, siteName: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.from,
        to: email,
        subject: `Login to ${siteName}`,
        text: this.getTextContent(url, siteName),
        html: this.getHTMLContent(url, siteName),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }
  }

  private getTextContent(url: string, siteName: string): string {
    return `Hi there,

Click the link below to login to ${siteName}:

${url}

This link will expire in 15 minutes.

If you didn't request this email, you can safely ignore it.`
  }

  private getHTMLContent(url: string, siteName: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="margin-top: 0; color: #1a1a1a; font-size: 24px;">Login to ${siteName}</h1>
    <p style="margin-bottom: 25px; color: #666;">Hi there,</p>
    <p style="margin-bottom: 25px; color: #666;">Click the button below to login to ${siteName}:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">Login to ${siteName}</a>
    </div>
    <p style="margin-top: 25px; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #2563eb; word-break: break-all; font-size: 14px;">${url}</p>
    <p style="margin-top: 30px; color: #999; font-size: 13px;">This link will expire in 15 minutes.</p>
    <p style="color: #999; font-size: 13px;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>`
  }
}

/**
 * Create email service based on environment configuration
 */
export function createEmailService(): EmailService {
  const provider = process.env.LUMO_EMAIL_PROVIDER || 'console'

  switch (provider) {
    case 'smtp': {
      const host = process.env.LUMO_SMTP_HOST
      const port = process.env.LUMO_SMTP_PORT
      const user = process.env.LUMO_SMTP_USER
      const pass = process.env.LUMO_SMTP_PASS
      const from = process.env.LUMO_EMAIL_FROM

      if (!host || !port || !user || !pass || !from) {
        throw new Error('SMTP configuration incomplete. Required: LUMO_SMTP_HOST, LUMO_SMTP_PORT, LUMO_SMTP_USER, LUMO_SMTP_PASS, LUMO_EMAIL_FROM')
      }

      return new SMTPEmailService({
        host,
        port: parseInt(port, 10),
        user,
        pass,
        from,
      })
    }

    case 'resend': {
      const apiKey = process.env.LUMO_RESEND_API_KEY
      const from = process.env.LUMO_EMAIL_FROM

      if (!apiKey || !from) {
        throw new Error('Resend configuration incomplete. Required: LUMO_RESEND_API_KEY, LUMO_EMAIL_FROM')
      }

      return new ResendEmailService({
        apiKey,
        from,
      })
    }

    case 'console':
    default:
      return new ConsoleEmailService()
  }
}
