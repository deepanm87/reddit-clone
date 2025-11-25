import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reddish Sanity Admin Panel",
  description: "admin panel for making changes"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}