import { Resend } from 'resend';
export async function sendMail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  const from = process.env.RESEND_FROM_EMAIL ?? 'Shield X <onboarding@resend.dev>';
  const result = await new Resend(apiKey).emails.send({ from, to, subject, html });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
