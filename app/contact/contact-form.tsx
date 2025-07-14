"use client"

import { useActionState, useEffect, useState } from "react"
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { submitContactForm, type ContactFormState } from "./actions"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Terminal } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  siteKey: string
}

const INITIAL_STATE: ContactFormState = {
  message: "",
  success: false,
}

function ContactFormInner() {
  const [state, formAction, isPending] = useActionState(submitContactForm, INITIAL_STATE)
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [token, setToken] = useState("")

  /* Fetch a fresh token on mount */
  useEffect(() => {
    if (!executeRecaptcha) return
    const getToken = async () => setToken(await executeRecaptcha("contactForm"))
    getToken()
  }, [executeRecaptcha])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Contact&nbsp;Us</CardTitle>
        <CardDescription>
          Have a question or feedback? Send us a message and we'll get back to you shortly.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Hidden reCAPTCHA token */}
          <input type="hidden" name="g-recaptcha-response" value={token} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your name" required />
            {state.errors?.name && <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" placeholder="Your message..." required className="min-h-[100px]" />
            {state.errors?.message && <p className="text-sm font-medium text-destructive">{state.errors.message[0]}</p>}
          </div>

          {/* Status alerts */}
          {state.message && !state.success && !state.errors && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {state.success && (
            <Alert
              variant="default"
              className="bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
            >
              <Terminal className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending || state.success || !token}>
            {isPending ? "Sending..." : "Send&nbsp;Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Client wrapper that injects the reCAPTCHA provider.
 */
export default function ContactForm({ siteKey }: Props) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {siteKey ? (
        <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
          <ContactFormInner />
        </GoogleReCaptchaProvider>
      ) : (
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>The reCAPTCHA site key is missing. Please contact the site administrator.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
