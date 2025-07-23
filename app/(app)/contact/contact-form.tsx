"use client"

import { useState, useRef, type FormEvent } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { submitContact } from "./actions" // existing server action

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const { toast } = useToast()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return

    try {
      setPending(true)

      // Build FormData from the REAL form element
      const formData = new FormData(formRef.current)

      // Get reCAPTCHA token and append to the form data
      if (executeRecaptcha) {
        const token = await executeRecaptcha("contact_form")
        formData.append("g-recaptcha-response", token)
      }

      const result = await submitContact(formData)

      if (result?.error) {
        toast({
          title: "Submission failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Message sent",
          description: "We’ll reply as soon as possible.",
        })
        formRef.current.reset()
      }
    } catch (err) {
      toast({
        title: "Unexpected error",
        description: "Please try again later.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={6} required />
      </div>

      {/* Hidden input for reCAPTCHA token (filled in handleSubmit) */}
      <input type="hidden" name="g-recaptcha-response" />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
