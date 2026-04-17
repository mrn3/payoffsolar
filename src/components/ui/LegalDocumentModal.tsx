'use client';

import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function LegalDocumentModal({ isOpen, onClose, type }: LegalDocumentModalProps) {
  if (!isOpen) return null;

  const isTerms = type === 'terms';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {isTerms ? (
              <>
                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 mb-3">
                    By accessing and using the Payoff Solar website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">2. Services Description</h2>
                  <p className="text-gray-700 mb-3">
                    Payoff Solar provides solar energy solutions including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>Solar panel sales and installation</li>
                    <li>Energy storage systems</li>
                    <li>Solar system design and consultation</li>
                    <li>Maintenance and support services</li>
                    <li>Online ordering and e-commerce services</li>
                  </ul>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
                  <p className="text-gray-700 mb-3">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">4. Orders and Payments</h2>
                  <p className="text-gray-700 mb-3">
                    All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason. Payment terms and conditions will be specified at the time of purchase. All prices are subject to change without notice.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">5. Installation Services</h2>
                  <p className="text-gray-700 mb-3">
                    Installation services are provided by licensed professionals. Installation timelines are estimates and may vary based on weather conditions, permit approvals, and other factors beyond our control. A separate installation agreement will be provided for installation services.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">6. Warranties and Returns</h2>
                  <p className="text-gray-700 mb-3">
                    Product warranties are provided by the respective manufacturers. Installation workmanship is warranted according to our installation agreement. Return policies will be specified at the time of purchase and may vary by product type.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
                  <p className="text-gray-700 mb-3">
                    In no event shall Payoff Solar be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
                  <p className="text-gray-700 mb-3">
                    The service and its original content, features, and functionality are and will remain the exclusive property of Payoff Solar and its licensors. The service is protected by copyright, trademark, and other laws.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">9. Prohibited Uses</h2>
                  <p className="text-gray-700 mb-3">
                    You may not use our service:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                    <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                    <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                    <li>To submit false or misleading information</li>
                  </ul>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">10. Termination</h2>
                  <p className="text-gray-700 mb-3">
                    We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
                  <p className="text-gray-700 mb-3">
                    These Terms shall be interpreted and governed by the laws of the State of Utah, United States, without regard to its conflict of law provisions. Any disputes arising from these terms will be resolved in the courts of Utah.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
                  <p className="text-gray-700 mb-3">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact Information</h2>
                  <p className="text-gray-700 mb-3">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Payoff Solar</strong></p>
                    <p className="text-gray-700 mb-2">11483 S Wexford Way, South Jordan, UT 84009</p>
                    <p className="text-gray-700 mb-2">Email: matt@payoffsolar.com</p>
                    <p className="text-gray-700">Phone: (801) 448-6396</p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                  <p className="text-gray-700 mb-3">
                    We collect information you provide directly to us, such as when you:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>Create an account or make a purchase</li>
                    <li>Contact us for support or inquiries</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Fill out forms on our website</li>
                  </ul>
                  <p className="text-gray-700 mb-3">
                    This may include your name, email address, phone number, mailing address, payment information, and any other information you choose to provide.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                  <p className="text-gray-700 mb-3">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>Process and fulfill your orders</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Send you important updates about your orders and our services</li>
                    <li>Improve our website and services</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
                  <p className="text-gray-700 mb-3">
                    We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>With service providers who assist us in operating our website and conducting business</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transfer or merger</li>
                    <li>With your explicit consent</li>
                  </ul>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
                  <p className="text-gray-700 mb-3">
                    We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies and Tracking</h2>
                  <p className="text-gray-700 mb-3">
                    Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and understand where our visitors are coming from. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
                  <p className="text-gray-700 mb-3">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your personal information</li>
                    <li>Opt out of marketing communications</li>
                    <li>Request a copy of the information we have about you</li>
                  </ul>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">7. Third-Party Links</h2>
                  <p className="text-gray-700 mb-3">
                    Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">8. Children's Privacy</h2>
                  <p className="text-gray-700 mb-3">
                    Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
                  <p className="text-gray-700 mb-3">
                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services after any changes constitutes acceptance of the new policy.
                  </p>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact Us</h2>
                  <p className="text-gray-700 mb-3">
                    If you have any questions about this privacy policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Payoff Solar</strong></p>
                    <p className="text-gray-700 mb-2">11483 S Wexford Way, South Jordan, UT 84009</p>
                    <p className="text-gray-700 mb-2">Email: matt@payoffsolar.com</p>
                    <p className="text-gray-700">Phone: (801) 448-6396</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
