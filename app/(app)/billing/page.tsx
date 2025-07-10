import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createPortalSession } from "./actions"
import { Badge } from "@/components/ui/badge"
import { PricingCard } from "@/components/pricing-card"

export default async function BillingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_status")
    .eq("id", user.id)
    .single()

  const status = profile?.stripe_subscription_status
  const isSubscribed = status === "active" || status === "trialing"

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {isSubscribed ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your billing and subscription details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="font-medium">Pro Plan</p>
              {status && (
                <Badge variant={isSubscribed ? "default" : "destructive"} className="capitalize">
                  {status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">You have access to all features.</p>
          </CardContent>
          <CardFooter>
            <form action={createPortalSession} className="w-full">
              <Button className="w-full">Manage Subscription</Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <PricingCard
          cta={
            <form action={createCheckoutSession} className="w-full">
              <Button className="w-full text-lg py-6">Start Your 7-Day Free Trial</Button>
            </form>
          }
        />
      )}
    </div>
  )
}
