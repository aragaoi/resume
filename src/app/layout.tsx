import type { Metadata } from 'next';
import { TooltipProvider } from '@/components/ui/tooltip';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Build and customize your resume',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
