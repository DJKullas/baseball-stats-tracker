import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const features = [
  "AI-Powered Scorebook Scanning",
  "Unlimited Teams & Players",
  "Detailed Game & Season Stats",
  "Publicly Sharable Team Pages",
  "Manual & AI-Assisted Data Entry",
]

export function PricingCard({ cta, period = "month" }: { cta: React.ReactNode; period?: string }) {
  return (
    <Card className="border-purple-500 border-2 shadow-lg shadow-purple-500/20 w-full max-w-md mx-auto">
      <CardHeader className="text-center bg-muted/30 p-6">
        <CardDescription className="text-purple-600 font-semibold text-lg">Pro Plan</CardDescription>
        <div className="flex items-baseline justify-center gap-2 mt-2">
          <span className="text-5xl font-bold tracking-tighter text-purple-600">$9.99</span>
          <span className="text-xl font-medium text-muted-foreground line-through">$19.99</span>
        </div>
        <p className="text-muted-foreground">per {period}</p>
        <div className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-2 text-sm">
          <p className="font-bold">Limited Time Offer!</p>
          <p>50% off sale ends July 31st.</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="font-semibold text-center">Includes a 7-day free trial. Cancel anytime.</p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>{cta}</CardFooter>
    </Card>
  )
}
