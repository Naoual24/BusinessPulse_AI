import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: 'BusinessPulse - Intelligent Business Analytics',
    description: 'Transform your Excel sales data into dashboards, forecasts, and actionable insights.',
}

import { LanguageProvider } from '@/lib/LanguageContext'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans antialiased text-surface-900 bg-surface-50">
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    )
}
