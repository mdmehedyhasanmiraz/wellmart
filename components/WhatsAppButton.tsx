// components/WhatsAppButton.tsx
// import { MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/8801711997285"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 pl-4 py-2 pr-2 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-all duration-300"
      aria-label="Chat on WhatsApp"
    >
      {/* <MessageCircle size={32} /> */}
      <span className="font-medium text-sm">Message us!</span>
      <Image src="/logos/logo-whatsapp.svg" alt="WhatsApp" width={28} height={28} />
    </Link>
  );
}
