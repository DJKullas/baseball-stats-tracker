"use client"

import ContactPageClient from "./contact-page-client"

/**
 * Server Component – safe to access `process.env`.
 */

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""

  return <ContactPageClient siteKey={siteKey} />
}
