"use server"

import { Resend } from "resend"
import { ContactFormEmail } from "@/components/emails/contact-form-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ContactResponse {
  ok: boolean
  error?: string
}

export async function submitContact(formData: FormData): Promise<ContactResponse> {
  try {
    const name = formData.get("name")?.toString().trim()
    const email = formData.get("email")?.toString().trim()
    const message = formData.get("message")?.toString().trim()

    if (!name || !email || !message) {
      return { ok: false, error: "All fields are required." }
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      return { ok: false, error: "Email service is not configured." }
    }

    if (!process.env.CONTACT_FORM_RECIPIENT_EMAIL) {
      console.error("CONTACT_FORM_RECIPIENT_EMAIL is not configured")
      return { ok: false, error: "Recipient email is not configured." }
    }

    await resend.emails.send({
      from: "contact@support.scorebooksnap.com",
      to: process.env.CONTACT_FORM_RECIPIENT_EMAIL,
      subject: "New Contact Form Message - ScoreBook Snap",
      replyTo: email,
      react: ContactFormEmail({ name, email, message }),
    })

    return { ok: true }
  } catch (error) {
    console.error("Failed to send contact email:", error)
    return { ok: false, error: "Failed to send message. Please try again." }
  }
}

// Legacy export for backward compatibility
export { submitContact as submitContactForm }
