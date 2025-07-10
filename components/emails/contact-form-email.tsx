import type * as React from "react"
import { Html, Body, Head, Heading, Container, Text, Section, Preview } from "@react-email/components"

interface ContactFormEmailProps {
  name: string
  email: string
  message: string
}

export const ContactFormEmail: React.FC<Readonly<ContactFormEmailProps>> = ({ name, email, message }) => (
  <Html>
    <Head />
    <Preview>New message from your StatTrack contact form</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Contact Form Submission</Heading>
        <Section>
          <Text style={paragraph}>You've received a new message from your website's contact form.</Text>
          <Text style={label}>From:</Text>
          <Text style={value}>{name}</Text>
          <Text style={label}>Email:</Text>
          <Text style={value}>{email}</Text>
          <Text style={label}>Message:</Text>
          <Text style={messageBox}>{message}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ContactFormEmail

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #f0f0f0",
  borderRadius: "4px",
}

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  textAlign: "center" as const,
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  padding: "0 20px",
}

const label = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#484848",
  padding: "0 20px",
  marginBottom: "0px",
}

const value = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  padding: "0 20px",
  marginTop: "0px",
}

const messageBox = {
  border: "1px solid #cccccc",
  borderRadius: "5px",
  padding: "10px",
  margin: "0 20px",
  backgroundColor: "#f8f8f8",
  whiteSpace: "pre-wrap" as const,
  wordWrap: "break-word" as const,
}
