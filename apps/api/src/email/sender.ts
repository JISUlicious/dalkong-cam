import nodemailer from "nodemailer";

import { config } from "../config.js";

const transporter = nodemailer.createTransport(config.SMTP_URL);

export async function sendEmailVerification(opts: {
  to: string;
  verifyUrl: string;
}): Promise<void> {
  const { to, verifyUrl } = opts;
  await transporter.sendMail({
    from: config.EMAIL_FROM,
    to,
    subject: "Verify your dalkong-cam account",
    text:
      `Welcome to dalkong-cam.\n\n` +
      `Please confirm your email by clicking the link below.\n` +
      `This link expires in 24 hours.\n\n` +
      `${verifyUrl}\n\n` +
      `If you did not sign up, you can ignore this email.`,
  });
}
