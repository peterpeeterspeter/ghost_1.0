import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ghost Mannequin Pipeline API',
  description: 'AI-powered Ghost Mannequin Pipeline for professional product photography',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
