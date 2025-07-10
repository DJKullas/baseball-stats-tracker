"use client"

import ContactForm from "./contact-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""

  return (
    <div className="flex flex-col items-center justify-start pt-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Contact Support</h1>
        <p className="text-muted-foreground mb-8">
          Have a question or need help? Fill out the form below and we'll get back to you as soon as possible.
        </p>
        {siteKey ? (
          <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
            <ContactForm />
          </GoogleReCaptchaProvider>
        ) : (
          <Alert variant="destructive" className="max-w-lg">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              The reCAPTCHA feature is not configured correctly. The site key is missing. Please contact the site
              administrator.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
