import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ViaPool" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info("Email sent", { messageId: info.messageId, to });
    return info;
  } catch (error) {
    logger.error("Error sending email", error);
    throw error;
  }
};

export { sendEmail };
