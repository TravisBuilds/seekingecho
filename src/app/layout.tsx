import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import ClientLayout from '@/app/ClientLayout'

// Force optimization settings
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// This ensures fresh builds
export const revalidate = 0

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whale Sightings',
  description: 'Track and view whale sightings data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
} 