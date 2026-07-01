import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Apply Pannu Bro – Premium Digital Service Center',
  description: 'One Stop Solution For All Your Needs – Government, Education, Business, Utility & Travel services.',
  openGraph: {
    title: 'Apply Pannu Bro',
    description: 'One Stop Solution For All Your Needs',
    images: ['/og-image.png'],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
