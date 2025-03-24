import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../styles/globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Build and customize your resume',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        {/* Script to detect dark mode before React hydration */}
        <Script id="dark-mode-detector" strategy="beforeInteractive">
          {`
            (function() {
              try {
                // Check if user prefers dark mode
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  document.documentElement.setAttribute('native-dark-active', '');
                } else {
                  document.documentElement.removeAttribute('native-dark-active');
                }
              } catch (e) {
                console.error('Error in dark mode script:', e);
              }
            })();
          `}
        </Script>
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
