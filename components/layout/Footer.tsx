'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FacebookIcon, InstagramIcon, MailIcon } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { name: 'All Products', href: '/shop' },
        { name: 'Categories', href: '/categories' },
        { name: 'Best Sellers', href: '/shop?sort=bestsellers' },
        { name: 'Deals & Offers', href: '/shop?sort=offers' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { name: 'Contact Us', href: '/contact' },
        { name: 'Order Tracking', href: '/dashboard/track-order' },
        { name: 'Shipping Info', href: '/shipping' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Refund Policy', href: '/refund-policy' },
      ]
    },
    {
      title: 'Contact',
      links: [
        { name: 'WhatsApp', href: 'https://wa.me/8801234567890' },
        { name: 'Email', href: 'mailto:info@wellmart.com.bd' },
      ]
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/wellmartbd',
      icon: (
        <FacebookIcon /> 
      )
    },
    {
      name: 'Email',
      href: 'mailto:info@wellmart.com.bd',
      icon: (
        <MailIcon />
      )
    }
  ];

  return (
    <footer className="bg-white text-gray-800 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Image src="/logos/logo-wellmart.png" alt="Wellmart" width={150} height={150} />
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your trusted destination for quality products. We&apos;re committed to providing exceptional 
              customer service and a seamless shopping experience.
            </p>
            
            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Connect with us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-lime-600 transition-colors"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-lime-600 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-500 text-sm">
              © {currentYear} <Link href="/" className="text-lime-600 hover:text-lime-700 transition-colors">Wellmart</Link>. All rights reserved. Technology by <a href="https://agency.oimi.io" className="text-lime-600 hover:text-lime-700 transition-colors">Oimi Web Agency</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 