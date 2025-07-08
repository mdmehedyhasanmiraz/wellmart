'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent!');
      setLoading(false);
      setForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="border rounded px-4 py-2 focus:ring-2 focus:ring-green-200"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email"
              className="border rounded px-4 py-2 focus:ring-2 focus:ring-green-200"
              required
            />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your Message"
              rows={5}
              className="border rounded px-4 py-2 focus:ring-2 focus:ring-green-200"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white font-semibold rounded px-6 py-2 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          {/* Business Info & Map */}
          <div className="flex flex-col gap-4 justify-center">
            <div>
              <h2 className="text-lg font-bold mb-1">Our Office</h2>
              <p className="text-gray-700">123 Main Street<br />Dhaka, Bangladesh</p>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">Email</h2>
              <p className="text-green-700">info@wellmart.com</p>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">Phone</h2>
              <p className="text-green-700">+880 1234-567890</p>
            </div>
            <div className="mt-4">
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                [Map Placeholder]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 