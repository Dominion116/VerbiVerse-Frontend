import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import Web3Provider from "@/components/providers/web3-provider"

export const metadata: Metadata = {
  title: "Translation Quiz App",
  description: "Test your translation skills and earn rewards with blockchain integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Web3Provider>
          <Suspense>
            {children}
            <Analytics />
          </Suspense>
        </Web3Provider>
      </body>
    </html>
  )
}
