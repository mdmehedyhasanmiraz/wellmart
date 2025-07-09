'use client';

import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-0 md:p-8 flex flex-col md:flex-row gap-0 md:gap-8 overflow-hidden">
          {/* Left: Contact Info */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-lime-100 text-lime-600 p-3 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Address</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Shop 337, 3rd Floor, Grand Plaza Shopping Mall,<br />
                    Wireless, Moghbazar, Dhaka-1217
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-lime-100 text-lime-600 p-3 rounded-lg">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Cell</h2>
                  <a href="tel:+8801711997285" className="text-gray-700 hover:text-lime-700 font-medium transition-colors">
                    +8801711997285
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-lime-100 text-lime-600 p-3 rounded-lg">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Email</h2>
                  <a href="mailto:info@wellmart.com.bd" className="text-gray-700 hover:text-lime-700 font-medium transition-colors">
                    info@wellmart.com.bd
                  </a>
                </div>
              </div>
              {/* WhatsApp Button */}
              <div>
                <a
                  href="https://wa.me/8801711997285"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow transition-colors mt-2"
                >
                  <Image src="/logos/logo-whatsapp.svg" alt="WhatsApp" width={24} height={24} />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
          {/* Right: Google Map */}
          <div className="flex-1 min-h-[350px] md:min-h-[450px]">
            <iframe
              title="Wellmart Location"
              src="https://www.google.com/maps?q=Grand+Plaza+Shopping+Mall,+Wireless,+Moghbazar,+Dhaka-1217&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 350, width: '100%' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[350px] md:min-h-[450px] border-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
} 