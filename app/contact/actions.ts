"use server"

import { z } from "zod"
import { Resend } from "resend"
import ContactFormEmail from "@/components/emails/contact-form-email"

const resend = new Resend(process.env.RESEND_API_KEY)
const contactEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL
const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
})

export type ContactFormState = {
  message: string
  errors?: {
    name?: string[]
    email?: string[]
    message?: string[]
  }
  success: boolean
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!recaptchaSecret) {
    console.error("reCAPTCHA secret key is not set.")
    return false
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${recaptchaSecret}&response=${token}`,
    })
    const data = await response.json()
    return data.success && data.score >= 0.5
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error)
    return false
  }
}

export async function submitContactForm(prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  if (!contactEmail || !process.env.RESEND_API_KEY) {
    console.error("Missing environment variables for contact form.")
    return {
      message: "An unexpected server error occurred. Please try again later.",
      success: false,
    }
  }

  const token = formData.get("g-recaptcha-response") as string
  const isHuman = await verifyRecaptcha(token)

  if (!isHuman) {
    return {
      message: "Failed to verify you are human. Please try again.",
      success: false,
    }
  }

  const validatedFields = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  })

  if (!validatedFields.success) {
    return {
      message: "Please correct the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    }
  }

  const { name, email, message } = validatedFields.data

  try {
    await resend.emails.send({
      from: "StatTrack Contact Form <onboarding@resend.dev>",
      to: contactEmail,
      reply_to: email,
      subject: `New message from ${name} via StatTrack`,
      react: ContactFormEmail({ name, email, message }),
    })

    return {
      message: "Thank you for your message! We will get back to you soon.",
      success: true,
      errors: {},
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return {
      message: "There was an error sending your message. Please try again.",
      success: false,
    }
  }
}
