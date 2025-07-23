"use server"

import { Resend } from "resend"
import { ContactFormEmail } from "@/components/emails/contact-form-email"
import type { ContactResponse } from "./contact-page-client"

const resend = new Resend(process.env.RESEND_API_KEY)
const recipientEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL

export async function submitContact(prevState: ContactResponse, formData: FormData): Promise<ContactResponse> {
  const name = formData.get("name")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim() ?? ""
  const message = formData.get("message")?.toString().trim() ?? ""

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." }
  }

  if (!recipientEmail) {
    console.error("CONTACT_FORM_RECIPIENT_EMAIL is not set.")
    return { ok: false, error: "Could not send email. Server configuration error." }
  }

  try {
    await resend.emails.send({
      from: "StatTrack Contact Form <contact@stat-track.app>", // Replace with your verified Resend domain
      to: recipientEmail,
      subject: "New message from your StatTrack contact form",
      reply_to: email,
      react: ContactFormEmail({ name, email, message }),
    })

    return { ok: true }
  } catch (error) {
    console.error("Error sending email with Resend:", error)
    return { ok: false, error: "There was an error sending your message. Please try again later." }
  }
}

/**
 * submitContactForm is an alias of submitContact to satisfy the deployment check
 * while keeping backward compatibility with any existing imports.
 */
export { submitContact as submitContactForm }
