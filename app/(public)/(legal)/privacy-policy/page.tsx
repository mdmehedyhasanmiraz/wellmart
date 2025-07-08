import React from 'react';

export const metadata = {
  title: "Privacy Policy",
  description: "This page outlines the privacy practices of Wellmart, detailing how we collect, use, and protect your personal information.",
  keywords: ["wellmart", "privacy policy", "wellmart privacy policy", "wellmart privacy policy page"],
  metadataBase: new URL("https://wellmart.com.bd"),
  alternates: {
    canonical: `/privacy-policy`,
  },
};

export default function PrivacyPolicy() {
  return (    
    <section className="space-y-6">
      <div className="max-w-3xl mx-auto py-16 px-3 sm:px-8 space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>

        <p className="">
          Wellmart (“we”, “us”, or “our”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website https://wellmart.com.bd and engage with our services. Please read this policy carefully to understand our practices.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">1. Who We Are</h2>
        <p className="">
          Our website address is: <a href="https://wellmart.com.bd" className="text-blue-500">https://wellmart.com.bd</a>.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">2. Information We Collect</h2>
        <p className="">We may collect information from you in the following ways:</p>
        <ul className="list-inside list-disc space-y-2 pl-4">
          <li>
            <strong>a. Personal Data:</strong> When you contact us, leave comments, or subscribe to our services, we collect your name, email address, phone number, and business details.
          </li>
          <li>
            <strong>b. Comments:</strong> When visitors leave comments on the site, we collect the data shown in the comments form, as well as the visitor’s IP address and browser user agent string to help with spam detection. An anonymized string created from your email address (also called a hash) may be sent to the Gravatar service to see if you use it. After approval, your profile picture will be visible to the public in the context of your comment. The Gravatar service privacy policy is available here.
          </li>
          <li>
            <strong>c. Media:</strong> If you upload images to the website, avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract location data from images on the site.
          </li>
          <li>
            <strong>d. Cookies:</strong> We use cookies to improve your experience on our website. If you leave a comment, you may opt-in to save your name, email address, and website in cookies for convenience. These cookies will last for one year. When you visit our login page, a temporary cookie will be set to determine if your browser accepts cookies. Login cookies last for two days, and screen options cookies last for a year.
          </li>
          <li>
            <strong>e. Usage Data:</strong> Automatically collected information includes your IP address, browser type, device information, pages visited, and time spent on the site.
          </li>
        </ul>

        <h2 className="text-xl md:text-2xl font-semibold">3. How We Use Your Information</h2>
        <p className="">
          We use your data to:
        </p>
        <ul className="list-inside list-disc space-y-2 pl-4">
          <li>Provide and improve our services</li>
          <li>Respond to inquiries and provide customer support</li>
          <li>Monitor website performance and usage</li>
          <li>Send newsletters and marketing communications (with your consent)</li>
          <li>Ensure security and prevent fraudulent activity</li>
        </ul>

        <h2 className="text-xl md:text-2xl font-semibold">4. Embedded Content from Other Websites</h2>
        <p className="">
          Articles on this site may include embedded content (e.g., videos, images, articles). Embedded content from other websites behaves the same as if the visitor has visited that website. These websites may collect data about you, use cookies, and monitor your interaction with embedded content, including tracking your interactions if you are logged in to their website.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">5. Who We Share Your Data With</h2>
        <p className="">
          We do not sell, trade, or rent your personal information to third parties. However, we may share your data:
        </p>
        <ul className="list-inside list-disc space-y-2 pl-4">
          <li>With Service Providers: Trusted third-party service providers who assist us in operating our website or delivering our services.</li>
          <li>For Legal Reasons: To comply with legal obligations or protect our rights.</li>
          <li>Spam Detection: Visitor comments may be checked through an automated spam detection service.</li>
          <li>If you request a password reset, your IP address will be included in the reset email.</li>
        </ul>

        <h2 className="text-xl md:text-2xl font-semibold">6. Data Retention</h2>
        <p className="">
          If you leave a comment, the comment and its metadata are retained indefinitely to recognize and approve follow-up comments automatically. For registered users, we store the personal information provided in their user profile, which can be viewed, edited, or deleted at any time (except the username). Administrators can also view and edit this information.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">7. Your Rights Over Your Data</h2>
        <p className="">
          If you have an account or have left comments, you can request an exported file of the personal data we hold about you. You can also request that we erase your personal data, except for data we are required to keep for administrative, legal, or security purposes.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">8. Data Security</h2>
        <p className="">
          We use appropriate technical and organizational measures to safeguard your personal data from unauthorized access, use, or disclosure. While we strive to protect your personal data, no security measures are completely secure.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">9. Children’s Privacy</h2>
        <p className="">
          Our services are not intended for children under the age of 13, and we do not knowingly collect personal information from children.
        </p>

        <h2 className="text-xl md:text-2xl font-semibold">10. Changes to This Privacy Policy</h2>
        <p className="">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated “Last updated” date.
        </p>

        <p className="">
          Last updated: June 9, 2025
        </p>
      </div>
    </section>
  );
}
