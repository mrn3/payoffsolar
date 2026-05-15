import React from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const metadata = {
  title: 'Shipping & Returns | Payoff Solar',
  description: 'Shipping information and return policy for Payoff Solar. We ship solar panels and equipment via LTL freight nationwide, with local pickup available in West Jordan, UT.',
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Shipping & Returns' }]} className="mb-6" />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Returns</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We ship solar panels and equipment anywhere in the United States via LTL freight, and offer local pickup at our West Jordan, UT warehouse.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">

          {/* Shipping Methods */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Methods</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Pickup</h3>
                <p className="text-gray-700 text-sm mb-3">Pick up your order directly from our warehouse. No freight costs — ideal for Utah customers.</p>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Warehouse Location:</p>
                  <p>8224 S Industry Way, Suite 300</p>
                  <p>West Jordan, UT 84088</p>
                  <p className="mt-2">Monday – Friday: 8am – 4pm</p>
                  <p className="text-xs text-gray-500 mt-1">(Appointment required)</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">LTL Freight — Nationwide</h3>
                <p className="text-gray-700 text-sm mb-3">We ship pallets of solar panels and equipment to any address in the contiguous United States via LTL (Less-Than-Truckload) freight carriers.</p>
                <div className="text-sm text-gray-600">
                  <p>Shipping costs are calculated at checkout based on your location and order size.</p>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About LTL Freight Shipping</h3>
              <p className="mb-3">
                Solar panels and heavy equipment ship on pallets via freight carriers — not standard parcel carriers like UPS or FedEx. This is standard for the industry and allows us to ship large quantities at a fraction of retail shipping costs.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Delivery is to a loading dock or curbside — the freight carrier will call ahead to schedule a delivery window</li>
                <li>Residential delivery is available (liftgate service) for an additional fee</li>
                <li>You will need someone present to receive and sign for the shipment</li>
                <li>Typical transit time is 3–7 business days depending on destination</li>
              </ul>
            </div>
          </div>

          {/* Receiving Your Shipment */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Receiving Your Shipment — Important</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-medium text-sm">
                Please inspect your shipment carefully before signing the delivery receipt. Damage noted at delivery is much easier to claim than damage discovered afterward.
              </p>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="mb-3">Solar panels are fragile and freight shipping involves multiple handoffs. While we package all orders carefully, damage can occasionally occur in transit. Follow these steps to protect yourself:</p>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li><strong>Inspect the pallet before signing.</strong> Check for visible damage to boxes, broken straps, or a tipped pallet.</li>
                <li><strong>Note any damage on the delivery receipt</strong> before the driver leaves — write "subject to inspection" or describe specific damage.</li>
                <li><strong>Take photos immediately</strong> — photograph the pallet, all packaging, and any damaged panels before moving anything.</li>
                <li><strong>Contact us within 48 hours</strong> of delivery if you discover damage: <a href="mailto:matt@payoffsolar.com" className="text-green-600 hover:text-green-500">matt@payoffsolar.com</a> or <a href="tel:8014486396" className="text-green-600 hover:text-green-500">(801) 448-6396</a>.</li>
              </ol>
              <p className="text-sm text-gray-500">Damage claims submitted more than 48 hours after delivery, or without photos, may not be eligible for carrier reimbursement.</p>
            </div>
          </div>

          {/* Returns */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Policy</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="mb-4">
                We stand behind the products we sell. If you receive a defective or incorrect item, we will work with you to make it right.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligible Returns</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong>Defective products:</strong> Items that arrive with manufacturing defects or that fail to perform as specified</li>
                <li><strong>Incorrect items:</strong> Items shipped that do not match your order</li>
                <li><strong>Freight damage:</strong> Items damaged in transit (see receiving instructions above)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Non-Returnable Items</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Items that have been installed or used</li>
                <li>Items returned without prior authorization</li>
                <li>Buyer's remorse or order changes after shipment</li>
                <li>Custom or special-order items</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Start a Return</h3>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Contact us within <strong>30 days</strong> of delivery</li>
                <li>Provide your order number, photos of the issue, and a description</li>
                <li>We will issue a Return Merchandise Authorization (RMA) number and return shipping instructions</li>
                <li>Ship the item back in its original packaging with the RMA number clearly marked</li>
              </ol>
              <p className="text-sm text-gray-500">Return shipping costs for defective or incorrect items are covered by Payoff Solar. Return shipping for other approved returns is the responsibility of the customer.</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Questions?</h2>
            <p className="text-gray-700 mb-4">Contact us before placing your order if you have questions about freight delivery to your location, liftgate requirements, or local pickup scheduling.</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Payoff Solar</strong></p>
              <p className="text-gray-700 mb-2">8224 S Industry Way, Suite 300, West Jordan, UT 84088</p>
              <p className="text-gray-700 mb-2">Email: <a href="mailto:matt@payoffsolar.com" className="text-green-600 hover:text-green-500">matt@payoffsolar.com</a></p>
              <p className="text-gray-700">Phone: <a href="tel:8014486396" className="text-green-600 hover:text-green-500">(801) 448-6396</a></p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
