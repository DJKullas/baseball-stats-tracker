"use client"

import ContactForm from "./contact-form"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default function ContactPageClient({ siteKey }: { siteKey: string }) {
  return (
    <div className="flex flex-col items-center justify-start pt-10">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Contact Support</h1>
        <p className="mb-8 text-muted-foreground">
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
