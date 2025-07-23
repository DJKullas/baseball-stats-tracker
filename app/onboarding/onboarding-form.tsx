"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XIcon, Loader2 } from "lucide-react"
import { completeOnboarding } from "./actions"
import { toast } from "sonner"
import { normalizePhoneNumber } from "@/lib/utils"

type OnboardingData = {
  teamName: string
  phoneNumbers: string[]
}

export default function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [isPending, setIsPending] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    teamName: "",
    phoneNumbers: [],
  })
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("")

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, teamName: e.target.value })
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPhoneNumber(e.target.value)
  }

  const addPhoneNumber = () => {
    if (!currentPhoneNumber) return
    const normalized = normalizePhoneNumber(currentPhoneNumber)
    if (data.phoneNumbers.includes(normalized)) {
      toast.info("This phone number has already been added.")
    } else {
      setData({ ...data, phoneNumbers: [...data.phoneNumbers, normalized] })
    }
    setCurrentPhoneNumber("")
  }

  const removePhoneNumber = (numberToRemove: string) => {
    setData({ ...data, phoneNumbers: data.phoneNumbers.filter((num) => num !== numberToRemove) })
  }

  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  const handleSubmit = async () => {
    const finalPhoneNumbers = [...data.phoneNumbers]

    // If there's a number in the input that hasn't been added, add it now.
    if (currentPhoneNumber.trim()) {
      const normalized = normalizePhoneNumber(currentPhoneNumber)
      if (!finalPhoneNumbers.includes(normalized)) {
        finalPhoneNumbers.push(normalized)
      }
    }

    if (finalPhoneNumbers.length === 0) {
      toast.error("Please add at least one phone number.")
      return
    }

    setIsPending(true)
    toast.loading("Finalizing setup...")

    try {
      const result = await completeOnboarding({
        teamName: data.teamName,
        phoneNumbers: finalPhoneNumbers,
      })
      toast.dismiss()

      if (result.success && result.data?.checkoutUrl) {
        toast.success("Redirecting to start your free trial...")
        // Use window.location.href for external redirects
        window.location.href = result.data.checkoutUrl
      } else {
        toast.error("Onboarding Failed", {
          description: result.error || "An unknown error occurred.",
        })
        setIsPending(false)
      }
    } catch (error) {
      toast.dismiss()
      console.error(error)
      toast.error("Onboarding Failed", {
        description: "A network or server error occurred. Please try again.",
      })
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      {step === 1 && (
        <>
          <CardHeader>
            <CardTitle>Step 1: Create Your Team</CardTitle>
            <CardDescription>What is the name of your team?</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              placeholder="e.g., The All-Stars"
              value={data.teamName}
              onChange={handleTeamNameChange}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={nextStep} disabled={!data.teamName}>
              Next
            </Button>
          </CardFooter>
        </>
      )}

      {step === 2 && (
        <>
          <CardHeader>
            <CardTitle>Step 2: Whitelist Phone Numbers</CardTitle>
            <CardDescription>Add the phone numbers that are authorized to submit stats for this team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., +15551234567"
                value={currentPhoneNumber}
                onChange={handlePhoneNumberChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addPhoneNumber()
                  }
                }}
              />
              <Button type="button" onClick={addPhoneNumber}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.phoneNumbers.map((num) => (
                <Badge key={num} variant="secondary" className="flex items-center gap-1">
                  {num}
                  <button
                    type="button"
                    onClick={() => removePhoneNumber(num)}
                    className="ml-1 rounded-full hover:bg-muted"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Finish & Start Trial
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
