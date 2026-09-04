import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Vijaya Engineering Works (VEW) — Custom Gear Manufacturing',
  description: 'Precision spiral bevel, helical, spur, and custom gears manufactured to your specifications.',
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
