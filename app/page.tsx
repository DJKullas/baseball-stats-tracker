import { Button } from "@/components/ui/button"
import LandingHeader from "@/components/landing/header"
import Link from "next/link"
import { PricingCard } from "@/components/pricing-card"
import { BarChartIcon, BotIcon, SmartphoneIcon } from "@/components/icons"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          <div className="container justify-self-center p-5">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-balance">
                    Snap. Text. Done.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl text-balance">
                    ScorebookSnap uses AI to instantly digitize your paper scorebooks. Just text a photo to upload and
                    spend less time on data entry.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                </div>
              </div>
              <img
                src="/hero-image.png"
                width="700"
                height="434"
                alt="Illustration showing a scorebook on a phone being transformed into a digital stats dashboard on a computer."
                className="mx-auto overflow-hidden rounded-xl object-contain sm:w-full"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container justify-self-center p-5">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A New Era of Stat Tracking</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-balance">
                  Our platform is designed to be simple and intuitive. Focus on the game, not on data entry.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <SmartphoneIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Snap & Text</h3>
                <p className="text-muted-foreground text-balance">
                  After the game, take a clear picture of your scorebook and text it to your team's unique number.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BotIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">2. AI-Powered Digitization</h3>
                <p className="text-muted-foreground text-balance">
                  Our AI gets to work, reading the stats from the image, identifying players, and calculating key
                  metrics.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BarChartIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">3. View & Share Stats</h3>
                <p className="text-muted-foreground text-balance">
                  Access detailed player stats like batting average, hits, and RBIs. View leaderboards and share public
                  links with your team.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container justify-self-center p-5">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Unlimited Access</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Start with a free 7-day trial. No commitments. Cancel anytime.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-md pt-12">
              <PricingCard
                cta={
                  <Button asChild className="w-full text-lg py-6">
                    <Link href="/signup">Start Your Free Trial</Link>
                  </Button>
                }
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full shrink-0 border-t py-6">
          <div className="container flex flex-col items-center gap-2 sm:flex-row justify-self-center p-5">
            <p className="text-xs text-muted-foreground">&copy; 2025 ScorebookSnap. All rights reserved.</p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
              <Link href="/contact" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                Contact
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  )
}
