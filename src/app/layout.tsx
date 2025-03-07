import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Build and customize your resume',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
