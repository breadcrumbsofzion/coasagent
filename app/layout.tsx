import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "COASAGENT - AI RSS Agent Labs",
  description:
    "Configure your AI RSS Agent to scan the internet and daily RSS feeds with highly relevant context based on dynamic outputs. Experimental AI Labs project.",
  generator: "v0.app",
  keywords: ["AI", "RSS", "Agent", "Machine Learning", "Data Collection", "Automation"],
  authors: [{ name: "COASAGENT Labs" }],
  openGraph: {
    title: "COASAGENT - AI RSS Agent Labs",
    description: "Configure your AI RSS Agent to scan the internet and daily RSS feeds with highly relevant context",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
