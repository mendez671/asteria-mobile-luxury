import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
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

export const viewport = { width: "device-width", initialScale: 1.0, maximumScale: 1.0, userScalable: false, themeColor: "#000000" };

export const metadata: Metadata = {
  title: "Asteria - Luxury AI Concierge",
  description: "Your personal AI concierge for extraordinary experiences. Exclusively for TAG members.",
  keywords: "luxury concierge, AI assistant, TAG, premium services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* CRITICAL: Force scroll to top immediately before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediate scroll to top enforcement
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              
              // Disable scroll restoration
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              
              // Additional enforcement after DOM is ready
              document.addEventListener('DOMContentLoaded', function() {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
              });
              
              // Handle page visibility changes (back/forward navigation)
              document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                  }, 50);
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
