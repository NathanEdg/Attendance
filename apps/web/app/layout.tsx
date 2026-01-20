import { Geist, Geist_Mono, Figtree } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={figtree.variable}>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
