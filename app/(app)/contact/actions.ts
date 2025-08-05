"use server"

import { Resend } from "resend"
import ContactFormEmail from "@/components/emails/contact-form-email"

export interface ContactResponse {
  ok: boolean
  error?: string
}

const resend = new Resend(process.env.RESEND_API_KEY)
const RECIPIENT = process.env.CONTACT_FORM_RECIPIENT_EMAIL ?? ""

/** Server Action: handle contact-form submission and email via Resend */
export async function submitContact(_prev: ContactResponse, formData: FormData): Promise<ContactResponse> {
  const name = formData.get("name")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim() ?? ""
  const message = formData.get("message")?.toString().trim() ?? ""

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." }
  }
  if (!RECIPIENT) {
    console.error("CONTACT_FORM_RECIPIENT_EMAIL is not set")
    return { ok: false, error: "Server configuration error." }
  }

  try {
    await resend.emails.send({
      from: "ScoreBook Snap Support <contact@support.scorebooksnap.com>",
      to: RECIPIENT,
      reply_to: email,
      subject: "New message from ScoreBook Snap contact form",
      react: ContactFormEmail({ name, email, message }),
    })
    return { ok: true }
  } catch (err) {
    console.error("Resend error:", err)
    return { ok: false, error: "Failed to send message. Please try again later." }
  }
}

/**
 * submitContactForm is an alias of submitContact to maintain backward compatibility
 */
export const submitContactForm = submitContact
