import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPopup from '@/components/AuthLoginPopup';
import ogImage from './opengraph-image.webp';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellmart - Your Trusted Shopping Destination',
  description: 'Discover quality products at great prices. Shop the latest trends with secure payment and fast delivery.',
  keywords: 'ecommerce, online shopping, retail, products, deals',
  authors: [{ name: 'Wellmart Team' }],
  creator: 'Wellmart',
  publisher: 'Wellmart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://wellmart.com.bd'),
  openGraph: {
    title: 'Wellmart - Your Trusted Shopping Destination',
    description: 'Discover quality products at great prices. Shop the latest trends with secure payment and fast delivery.',
    url: 'https://wellmart.com.bd',
    siteName: 'Wellmart',
    images: [
      {
        url: ogImage.src,
        width: 1200,
        height: 630,
        alt: 'Wellmart - Online Shopping',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wellmart - Your Trusted Shopping Destination',
    description: 'Discover quality products at great prices. Shop the latest trends with secure payment and fast delivery.',
    images: [ogImage.src],
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
  // verification: {
  //   google: 'your-google-verification-code',
  // },
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
            
            <LoginPopup />
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
