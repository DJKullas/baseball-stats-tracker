"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
]

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-self-center p-5">
        {/* Logo + name */}
        <Link href="/" className="mr-6 flex items-center space-x-2" prefetch={false}>
          <Image src="/logo.png" alt="ScorebookSnap logo" width={24} height={24} priority />
          <span className="font-bold">ScorebookSnap</span>
        </Link>

        {/* Wrapper for all right-side elements on desktop */}
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
                prefetch={false}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="pl-6 pt-6">
                <Link href="/" className="flex items-center space-x-2" prefetch={false}>
                  <Image src="/logo.png" alt="ScorebookSnap logo" width={24} height={24} />
                  <span className="font-bold">ScorebookSnap</span>
                </Link>
              </div>
              <div className="mt-6 space-y-4 pl-6">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block text-muted-foreground" prefetch={false}>
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-2 pl-6 pr-6">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
