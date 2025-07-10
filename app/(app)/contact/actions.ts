"use server"

/**
 * Minimal stub so build-time static analysis succeeds.
 * Replace with your real implementation when ready.
 */
export async function submitContactForm(formData: FormData): Promise<{ ok: boolean }> {
  // Simulate sending an email (replace with actual email sending logic)
  const name = formData.get("name")
  const email = formData.get("email")
  const message = formData.get("message")

  if (!name || typeof name !== "string") {
    console.error("Invalid name")
    return { ok: false }
  }

  if (!email || typeof email !== "string") {
    console.error("Invalid email")
    return { ok: false }
  }

  if (!message || typeof message !== "string") {
    console.error("Invalid message")
    return { ok: false }
  }

  console.log("Form Data:", { name, email, message })

  try {
    // Replace this with your actual email sending logic (e.g., using Nodemailer, SendGrid, etc.)
    console.log("Simulating email sending...")
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate a delay

    console.log("Email sent successfully!")
    return { ok: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { ok: false }
  }
}
