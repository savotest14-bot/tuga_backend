import {
  Injectable,
} from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter =
    nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user: process.env.MAIL_USER,

        pass: process.env.MAIL_PASS,
      },
    });

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;

    subject: string;

    html: string;
  }) {
    await this.transporter.sendMail({
      from: process.env.MAIL_USER,

      to,

      subject,

      html,
    });
  }

  async sendForgotPasswordOtp(
    email: string,

    otp: string,
  ) {
    await this.sendMail({
      to: email,

      subject: 'Forgot Password OTP',

      html: `
        <div style="font-family: Arial, sans-serif; padding:20px;">
          
          <h2>Password Reset Request</h2>

          <p>Your OTP for password reset is:</p>

          <h1 style="letter-spacing:4px;">
            ${otp}
          </h1>

          <p>
            This OTP is valid for 
            <b>10 minutes</b>.
          </p>

        </div>
      `,
    });
  }

  async sendVerificationOtp(
    email: string,
    otp: string,
  ) {
    await this.sendMail({
      to: email,

      subject: 'Verify Your Email Address',

      html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:0 auto; padding:30px; border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;">

        <div style="text-align:center; margin-bottom:30px;">
          <h2 style="color:#2563eb; margin:0;">
            Email Verification
          </h2>
        </div>

        <p style="font-size:16px; color:#374151;">
          Hello,
        </p>

        <p style="font-size:16px; color:#374151; line-height:1.6;">
          Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address.
        </p>

        <div style="text-align:center; margin:30px 0;">
          <div style="
            display:inline-block;
            padding:16px 32px;
            background:#f3f4f6;
            border:2px dashed #2563eb;
            border-radius:8px;
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            color:#111827;
          ">
            ${otp}
          </div>
        </div>

        <p style="font-size:15px; color:#374151;">
          This OTP is valid for <strong>10 minutes</strong>.
        </p>

        <p style="font-size:15px; color:#374151;">
          If you did not create an account, you can safely ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #e5e7eb; margin:30px 0;" />

        <p style="font-size:13px; color:#6b7280; text-align:center;">
          This is an automated email. Please do not reply.
        </p>

      </div>
    `,
    });
  }
}