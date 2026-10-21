
import "server-only";

import { Resend } from "resend";

type ConnectionEmailInput = {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
};

export async function sendConnectionRequestEmail({
  recipientEmail,
  recipientName,
  senderName,
}: ConnectionEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Missing Resend email configuration.");
  }

  const resend = new Resend(apiKey);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const connectionsUrl = new URL("/connections", appUrl).toString();

  const result = await resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: "New connection request on Find-a-Founder",
    text: [
      `Hi ${recipientName},`,
      "",
      `${senderName} sent you a connection request on Find-a-Founder!`,
      "",
      "Sign in to view their profile, read their message, and accept or decline.",
      "",
      `View your request: ${connectionsUrl}`,
      "",
      "Find-a-Founder | USC TIE Hub",
    ].join("\n"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}
