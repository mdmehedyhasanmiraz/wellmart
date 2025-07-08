import React from 'react';

export const metadata = {
  title: "Terms of Services",
  description: "Read the terms of services for using Wellmart's website and services.",
  keywords: ["wellmart", "terms of services", "wellmart terms of services", "wellmart terms of services page"],
  metadataBase: new URL("https://wellmart.com.bd"),
  alternates: {
    canonical: `/terms`,
  },
};

export default function TermsOfServices() {
  return (
    <section className="space-y-6">
      <div className="max-w-3xl mx-auto py-16 px-3 sm:px-8 space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Terms of Services</h1>

        <p className="">
          Welcome to Wellmart! These terms of services outline the rules and regulations for the use of {`Wellmart's`} website and services.
        </p>
        
        <h2 className="text-xl md:text-2xl font-semibold">1. Acceptance of Terms</h2>
        <p className="">
          By accessing and using this website, you agree to comply with and be bound by these terms of services. If you do not agree to these terms, please do not use our services.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">2. Use of Services</h2>
        <p className="">
          You agree to use our website and services only for lawful purposes. You are responsible for ensuring that your use of the website complies with all applicable laws and regulations.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">3. Intellectual Property</h2>
        <p className="">
          All content provided on this website, including but not limited to text, images, logos, and videos, is the property of Wellmart and protected by copyright laws. You may not use, reproduce, or distribute any of our content without prior written permission.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">4. User Accounts</h2>
        <p className="">
          If you create an account on our website, you are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately if you suspect any unauthorized access to your account.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">5. Prohibited Activities</h2>
        <p className="">
          You may not use our website or services for any illegal or prohibited activity. This includes, but is not limited to, the following:
        </p>
        <ul className="list-inside list-disc space-y-2 pl-4">
          <li>Engaging in any form of fraud or illegal activities.</li>
          <li>Transmitting malicious content such as viruses or malware.</li>
          <li>Interfering with or disrupting the operation of our website.</li>
          <li>Violating any intellectual property rights or third-party rights.</li>
        </ul>

        <h2 className="text-xl md:text-2xl font-semibold">6. Limitation of Liability</h2>
        <p className="">
          Wellmart will not be held liable for any damages arising from your use or inability to use the website, including but not limited to indirect, incidental, or consequential damages.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">7. Third-Party Links</h2>
        <p className="">
          Our website may contain links to third-party websites. These links are provided for your convenience and do not signify our endorsement of such websites. We have no control over the content or practices of third-party websites and are not responsible for them.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">8. Changes to Terms of services</h2>
        <p className="">
          We reserve the right to update or modify these terms of services at any time. Any changes will be posted on this page with the updated “Last updated” date.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">9. Governing Law</h2>
        <p className="">
          These terms of services are governed by and construed in accordance with the laws of the jurisdiction in which Wellmart operates. Any disputes arising out of these terms will be resolved in the courts of that jurisdiction.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">10. Contact Information</h2>
        <p className="">
          If you have any questions regarding these terms of services, please contact us at <a href="mailto:info@wellmart.com.bd" className="text-blue-500">info@wellmart.com.bd</a>.
        </p>

        <p className="">
          Last updated: May 14, 2025
        </p>
      </div>
    </section>
  );
}
