import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellmart - Your Trusted Online Store',
  description: 'Discover quality products at great prices. Shop electronics, fashion, home & garden, and more.',
  keywords: 'online store, shopping, electronics, fashion, home, garden, Bangladesh',
  authors: [{ name: 'Wellmart Team' }],
  creator: 'Wellmart',
  publisher: 'Wellmart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://wellmart.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Wellmart - Your Trusted Online Store',
    description: 'Discover quality products at great prices. Shop electronics, fashion, home & garden, and more.',
    url: 'https://wellmart.com',
    siteName: 'Wellmart',
    images: [
      {
        url: '/opengraph-image.webp',
        width: 1200,
        height: 630,
        alt: 'Wellmart - Your Trusted Online Store',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellmart - Your Trusted Online Store',
    description: 'Discover quality products at great prices. Shop electronics, fashion, home & garden, and more.',
    images: ['/opengraph-image.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#000',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <main className="flex-1 text-black bg-gray-50">
            {children}
          </main>
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
