import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vanta - Financial Management Platform',
  description: 'AI-powered financial management for modern businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
