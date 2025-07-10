import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/app/(app)/billing/actions"
import { PricingCard } from "@/components/pricing-card"

export default function SubscriptionGate() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <PricingCard
        cta={
          <form action={createCheckoutSession} className="w-full">
            <Button type="submit" className="w-full text-lg py-6">
              Subscribe to Unlock
            </Button>
          </form>
        }
      />
    </div>
  )
}
