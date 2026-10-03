import { cn } from '@uk-open-data-lab/ui';
import '@uk-open-data-lab/ui/styles';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getDarkThemeInitScript } from '@/lib/dark-theme-init';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'uk-open-data-lab',
  description: 'Small experiments digging through UK public data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en-GB" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getDarkThemeInitScript() }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-[var(--color-bg)] focus:px-3 focus:py-2 focus:text-[var(--color-fg)] focus:shadow-md"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
