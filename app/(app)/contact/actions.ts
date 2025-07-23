"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
})

export async function submitContact(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Submit.",
    }
  }

  try {
    // Simulate sending data to a database or external service
    console.log("Form data submitted:", validatedFields.data)
    // In a real application, you would save the data to a database here

    revalidatePath("/")
    return { message: "Form submitted successfully!" }
  } catch (e: any) {
    return { message: "Failed to submit form." }
  }
}

export { submitContact as submitContactForm }
