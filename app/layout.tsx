import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Traffic Hours Tracker',
    description: 'A web app for tracking traffic hours',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      url: 'https://traffichourstracker.vercel.app/',
      title: 'Traffic Hours Tracker',
      description: 'A web app for tracking traffic hours',
      images: [
        {
          url: '/android-chrome-512x512.png',
          width: 512,
          height: 512,
          alt: 'Traffic Hours Tracker Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Traffic Hours Tracker',
      description: 'A web app for tracking traffic hours',
      images: ['/android-chrome-512x512.png'],
    },
  };
  
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
