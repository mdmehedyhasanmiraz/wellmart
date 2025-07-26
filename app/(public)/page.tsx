import HeroSection from "@/components/home/HeroSection";
import FlashSaleProducts from "@/components/home/FlashSaleProducts";
import FeaturedProductsArchive from '@/components/home/FeaturedProductsArchive';
import TopProductsArchive from '@/components/home/TopProductsArchive';
import RecentProductsArchive from '@/components/home/RecentProductsArchive';
import ogImage from '@/public/opengraph-image.webp';

export const metadata = {
  title: "Wellmart",
  description: "Your trusted online shop for all your medical needs.",
  keywords: ["medical", "health", "wellness", "pharmacy", "online pharmacy", "medical supplies", "medical equipment", "medical products", "medical equipment", "medical products", "medical equipment", "medical products"],
  openGraph: {
    title: "Wellmart",
    description: "Your trusted online shop for all your medical needs.",
    images: [ogImage.src],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wellmart",
    description: "Your trusted online shop for all your medical needs.",
    images: [ogImage.src],
  },
  icons: {
    icon: "/logos/logo-wellmart.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://wellmart.com.bd",
  },
  // verification: {
  //   google: "google-site-verification=1234567890",
  // },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Flash Sale Products */}
      <FlashSaleProducts />

      {/* CTA Section */}
      {/* <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of satisfied customers who trust Wellmart
          </p>
          <a
            href="/shop"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Products
          </a>
        </div>
      </section> */}
      <FeaturedProductsArchive />
      <TopProductsArchive />
      <RecentProductsArchive />
    </div>
  );
}
