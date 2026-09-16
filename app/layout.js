import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { siteDescription } from '@/lib/site-content.mjs'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Vijaya Engineering Works (VEW) — Custom Gear Manufacturing',
  description: siteDescription,
  metadataBase: new URL('https://www.vijayaengineeringworks.com'),
  alternates: { canonical: '/' },
  openGraph: { title: 'Vijaya Engineering Works — Custom Gear Manufacturing', description: siteDescription, url: '/', siteName: 'Vijaya Engineering Works', type: 'website' },
  twitter: { card: 'summary', title: 'Vijaya Engineering Works', description: siteDescription },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
