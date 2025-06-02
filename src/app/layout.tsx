import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2D1B4E"
};

export const metadata: Metadata = {
  title: "Asteria - Luxury AI Concierge",
  description: "Where Energy Meets Experience - Your Personal Luxury Concierge",
  keywords: "luxury, concierge, AI, personal assistant, exclusive, premium",
  authors: [{ name: 'TAG Development Team' }],
  creator: 'TAG',
  publisher: 'TAG',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
    date: false,
    url: false
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Asteria',
    startupImage: '/icon-512x512.png'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no, date=no, address=no, email=no',
    'msapplication-tap-highlight': 'no'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen`}>
      <head>
        {/* FIX: Additional iOS/Mobile Safari optimizations */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="date=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* FIX: Prevent auto-zoom on inputs in iOS */}
        <style suppressHydrationWarning>{`
          @media screen and (-webkit-min-device-pixel-ratio: 0) {
            select,
            textarea,
            input {
              font-size: 16px !important;
            }
          }
          
          /* Prevent unwanted selections */
          .prevent-select {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Improve touch scrolling */
          * {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
