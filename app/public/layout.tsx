import type React from "react"
import Link from "next/link"
import { BeerIcon as Baseball } from "lucide-react"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Baseball className="h-6 w-6" />
          <span className="">StatTrack</span>
        </Link>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
      <footer className="text-center p-4 text-xs text-muted-foreground">
        <p>Powered by StatTrack. &copy; 2025. All rights reserved.</p>
      </footer>
    </div>
  )
}
