import nodemailer, { type Transporter } from "nodemailer";

import { config } from "../config.js";

let transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!config.SMTP_URL) return null;
  transporter = nodemailer.createTransport(config.SMTP_URL);
  return transporter;
}

export async function sendEmailVerification(opts: {
  to: string;
  verifyUrl: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t || !config.EMAIL_FROM) return false;
  await t.sendMail({
    from: config.EMAIL_FROM,
    to: opts.to,
    subject: "Verify your dalkong-cam account",
    text:
      `Welcome to dalkong-cam.\n\n` +
      `Please confirm your email by clicking the link below.\n` +
      `This link expires in 24 hours.\n\n` +
      `${opts.verifyUrl}\n\n` +
      `If you did not sign up, you can ignore this email.`,
  });
  return true;
}
