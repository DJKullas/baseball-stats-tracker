"use server"

import { Resend } from "resend"
import ContactFormEmail from "@/components/emails/contact-form-email"

/** The shape returned to the client after a form submission */
export interface ContactResponse {
  ok: boolean
  error?: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * NOTE:
 * Make sure you configure the CONTACT_FORM_RECIPIENT_EMAIL env-var
 * in the Vercel dashboard. That address will receive contact-form
 * submissions.
 */
const RECIPIENT = process.env.CONTACT_FORM_RECIPIENT_EMAIL ?? ""

/**
 * Send a message from the contact form.
 * – Validates required fields
 * – Sends an email via Resend
 * – Returns a status object consumed by the client component
 */
export async function submitContact(_prev: ContactResponse, formData: FormData): Promise<ContactResponse> {
  const name = formData.get("name")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim() ?? ""
  const message = formData.get("message")?.toString().trim() ?? ""

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." }
  }
  if (!RECIPIENT) {
    console.error("CONTACT_FORM_RECIPIENT_EMAIL is not set.")
    return { ok: false, error: "Server mis-configuration. Please try later." }
  }

  try {
    await resend.emails.send({
      from: "StatTrack Contact Form <contact@stat-track.app>", // replace with your verified domain
      to: RECIPIENT,
      reply_to: email,
      subject: "New message from StatTrack contact form",
      react: <ContactFormEmail name={name} email={email} message={message} />,
    })
    return { ok: true }
  } catch (err) {
    console.error("Resend error:", err)
    return { ok: false, error: "Failed to send email. Please try again later." }
  }
}

/* keep legacy import name working */
export { submitContact as submitContactForm }
