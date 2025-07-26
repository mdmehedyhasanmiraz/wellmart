import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Sale - Wellmart',
  description: 'Limited time offers with amazing discounts! Don\'t miss out on our flash sale products with up to 70% off.',
  keywords: ['flash sale', 'discounts', 'offers', 'limited time', 'deals', 'sale'],
  openGraph: {
    title: 'Flash Sale - Wellmart',
    description: 'Limited time offers with amazing discounts! Don\'t miss out on our flash sale products.',
    type: 'website',
  },
};

export default function FlashSaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 