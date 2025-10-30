'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaSms, FaBuilding } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from '@/lib/utils/phone';


const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine(isValidPhoneNumber, 'Phone number must be 10 digits or 11 digits with +1'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get solar calculator parameters
  const systemType = searchParams.get('system');
  const panels = searchParams.get('panels');
  const savings = searchParams.get('savings');
  const cost = searchParams.get('cost');

  // Get pricing package parameters
  const packageName = searchParams.get('package');
  const packagePrice = searchParams.get('price');
  const packagePower = searchParams.get('power');
  const packagePanels = searchParams.get('panels');
  const source = searchParams.get('source');

  // Generate pre-filled message for solar calculator quotes
  const generateSolarMessage = () => {
    if (!systemType || !panels || !savings || !cost) return '';

    return `I'm interested in a solar system quote based on the following specifications from your calculator:

System Type: ${systemType}
Number of Panels: ${panels}
Monthly Savings Target: $${savings}
Estimated Cost: $${parseInt(cost).toLocaleString()}

Please provide me with a detailed quote and next steps for installation.`;
  };

  // Generate pre-filled message for pricing package quotes
  const generatePricingMessage = () => {
    if (!packageName) return '';

    let message = `I'm interested in getting a quote for the ${packageName}`;

    if (packagePrice || packagePower || packagePanels) {
      message += ' with the following specifications:';
      if (packagePrice) message += `\nPrice: ${packagePrice}`;
      if (packagePower) message += `\nSystem Size: ${packagePower}`;
      if (packagePanels) message += `\nPanels: ${packagePanels}`;
    }

    message += '\n\nPlease provide me with a detailed quote and next steps for installation.';
    return message;
  };

  // Generate general pricing inquiry message
  const generateGeneralPricingMessage = () => {
    if (source !== 'pricing') return '';
    return 'I\'m interested in learning more about your solar installation packages. Please provide me with information about pricing and next steps.';
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: systemType ? 'Solar System Quote Request' : packageName ? `${packageName} Quote Request` : source === 'pricing' ? 'Solar Package Inquiry' : '',
      message: '',
    },
  });

  // Pre-fill form when parameters are present
  useEffect(() => {
    if (systemType && panels && savings && cost) {
      // Solar calculator parameters
      setValue('subject', 'Solar System Quote Request');
      setValue('message', generateSolarMessage());
    } else if (packageName) {
      // Pricing package parameters
      setValue('subject', `${packageName} Quote Request`);
      setValue('message', generatePricingMessage());
    } else if (source === 'pricing') {
      // General pricing inquiry
      setValue('subject', 'Solar Package Inquiry');
      setValue('message', generateGeneralPricingMessage());
    }
  }, [systemType, panels, savings, cost, packageName, packagePrice, packagePower, packagePanels, source, setValue]);

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Submit to API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData._error || 'Failed to submit form');
      }

      setSubmitSuccess(true);
      reset();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error: unknown) {
      console.error('Error submitting contact form:', error);
      setSubmitError(error instanceof Error ? error.message : String(error) || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl mb-8">
              Have questions about solar energy or our services? We&apos;re here to help. Reach out to our team for more information or to schedule a consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPhone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <div className="text-gray-600">
                <p className="mb-2">(801) 448-6396</p>
                <p className="text-gray-600 mt-1">
                  Monday - Saturday: 9am - 7pm
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <a
                    href="tel:+18014486396"
                    className="inline-flex items-center gap-1 rounded-full border border-green-600 px-3 py-1 text-green-600 hover:bg-green-50 text-sm"
                    title="Call"
                  >
                    <FaPhone className="h-3 w-3" />
                    Call
                  </a>
                  <a
                    href="sms:+18014486396"
                    className="inline-flex items-center gap-1 rounded-full border border-blue-600 px-3 py-1 text-blue-600 hover:bg-blue-50 text-sm"
                    title="Text"
                  >
                    <FaSms className="h-3 w-3" />
                    Text
                  </a>
                </div>
              </div>

            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:matt@payoffsolar.com">matt@payoffsolar.com</a>
              </p>
              <p className="text-gray-600 mt-1">
                We&apos;ll respond within 24 hours
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <a
                  href="mailto:matt@payoffsolar.com"
                  className="inline-flex items-center gap-1 rounded-full border border-purple-600 px-3 py-1 text-purple-600 hover:bg-purple-50 text-sm"
                  title="Email"
                >
                  <FaEnvelope className="h-3 w-3" />
                  Email
                </a>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Office</h3>
              <p className="text-gray-600">
                11483 S Wexford Way
              </p>
              <p className="text-gray-600 mt-1">
                South Jordan, UT 84009
              </p>
              <p className="text-gray-600 mt-1">
                Monday - Saturday: 8am - 9pm
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=11483%20S%20Wexford%20Way%2C%20South%20Jordan%2C%20UT%2084009"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-green-600 px-3 py-1 text-green-600 hover:bg-green-50 text-sm"
                  title="Open in Google Maps"
                >
                  <FaMapMarkerAlt className="h-3 w-3" />
                  Directions
                </a>
              </div>

            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Warehouse</h3>
              <p className="text-gray-600">
                906 S 4400 W, Suite 290
              </p>
              <p className="text-gray-600 mt-1">
                Salt Lake City, UT 84104
              </p>
              <p className="text-gray-600 mt-1">
                Monday - Friday: 8am - 4pm
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=906%20S%204400%20W%2C%20Suite%20290%2C%20Salt%20Lake%20City%2C%20UT%2084104"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-green-600 px-3 py-1 text-green-600 hover:bg-green-50 text-sm"
                  title="Open in Google Maps"
                >
                  <FaMapMarkerAlt className="h-3 w-3" />
                  Directions
                </a>
              </div>

            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Send us a message</h2>

            {submitSuccess && (
              <div className="mb-6 bg-green-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Thank you for your message! We&apos;ll get back to you soon.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className={`w-full px-4 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300' } rounded-md focus:ring-green-500 focus:border-green-500`}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300' } rounded-md focus:ring-green-500 focus:border-green-500`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300' } rounded-md focus:ring-green-500 focus:border-green-500`}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className={`w-full px-4 py-2 border ${errors.subject ? 'border-red-300' : 'border-gray-300' } rounded-md focus:ring-green-500 focus:border-green-500`}
                  {...register('subject')}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className={`w-full px-4 py-2 border ${errors.message ? 'border-red-300' : 'border-gray-300' } rounded-md focus:ring-green-500 focus:border-green-500`}
                  {...register('message')}
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message' }
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>


    </div>
  );
}
