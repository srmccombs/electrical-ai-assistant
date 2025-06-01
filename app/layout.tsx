//updated 

import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Electrical AI Assistant',
  description: 'AI-powered assistant for electrical distributors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
