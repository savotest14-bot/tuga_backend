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
}