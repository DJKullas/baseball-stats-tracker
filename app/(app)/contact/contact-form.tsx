"use client"

import type React from "react"

import { useActionState, useEffect, useRef, useCallback } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { submitContactForm, type FormState } from "./actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default function ContactForm() {
  const initialState: FormState = { message: "", status: "idle" }
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const { executeRecaptcha } = useGoogleReCaptcha()

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state])

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!executeRecaptcha) {
        console.error("Recaptcha not available")
        return
      }
      const token = await executeRecaptcha("contact_form")
      const formData = new FormData(event.currentTarget)
      formData.set("g-recaptcha-response", token)
      formAction(formData)
    },
    [executeRecaptcha, formAction],
  )

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Enter your name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Enter your email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" placeholder="Enter the subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" placeholder="Enter your message" className="min-h-[150px]" required />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === "success" && (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Message Sent!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending} className="w-full md:w-auto">
        {isPending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  )
}
