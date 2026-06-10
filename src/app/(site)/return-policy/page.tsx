import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white w-full">
      <div className="w-full px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-7xl">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-100"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mt-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              Returns & Refund Policy
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-neutral-600">
              Our comprehensive return policy ensures a smooth and transparent process
            </p>
          </div>

        {/* Policy Content */}
        <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {/* How to Start Your Return */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8 lg:col-span-2 xl:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900">How to Start Your Return</h2>
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-blue-800">
                <strong>Email us at</strong> <a href="mailto:shane@allremotes.com.au" className="text-accent-dark hover:underline">shane@allremotes.com.au</a> with the order details or simply use "return this product" in your orders and we will respond back via email within 1-2 business days.
              </p>
            </div>
          </section>

          {/* Returning Faulty Items */}
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-panel sm:p-8">
            <h2 className="text-xl font-bold text-red-900">Returning Faulty Items</h2>
            <p className="mt-3 text-red-800">
              If your return involves a faulty item, please contact us immediately. To assist with the warranty process, we may request photos or videos of the issue.
            </p>
          </section>

          {/* Packaging Your Return */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900">Packaging Your Return</h2>
            <p className="mt-3 text-neutral-700">
              It's important to securely package your return to prevent any damage in transit. Damaged items may affect the resolution offered, which could include repairs, replacement, or store credit at our discretion. Refunds may take up to 10 business days to process after we receive your return.
            </p>
          </section>

          {/* Return Shipping Details */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8 lg:col-span-2 xl:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900">Return Shipping Details</h2>
            <p className="mt-3 text-neutral-700">
              Buyers are responsible for returning items at their expense. Items must be sent to the correct return location, which will be provided during the return process. Please note, items sent to our Brisbane or Sydney locations will need to be forwarded to the appropriate address, potentially delaying processing.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <h3 className="font-semibold text-blue-900">Prepaid Return Labels</h3>
                <p className="mt-2 text-blue-800 text-sm">
                  For convenience, our Return Portal may offer a prepaid return label. The cost of this label will be deducted from your refund, making it easy and cost-effective for you. If the value of your return is under $75, you can choose to purchase your own shipping label from your local post office.
                </p>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <h3 className="font-semibold text-green-900">Using Your Own Label</h3>
                <p className="mt-2 text-green-800 text-sm">
                  If a prepaid label isn't available, our Return Portal will provide the correct return address to send your item(s) to directly.
                </p>
              </div>
            </div>
          </section>

          {/* Inspection & Resolution Timeline */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900">Inspection & Resolution Timeline</h2>
            <p className="mt-3 text-neutral-700">
              Once we receive your return, our service team will inspect the item. Inspection and resolution typically take no longer than 10 business days (subject to variations).
            </p>
          </section>

          {/* Terms and Conditions */}
          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-panel sm:p-8">
            <h2 className="text-xl font-bold text-orange-900">Terms and Conditions</h2>
            <p className="mt-3 text-orange-800">
              If your purchase was made in error or you've changed your mind, you may still be eligible for a refund, subject to the following conditions:
            </p>
            <ul className="mt-4 space-y-3 text-orange-800">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>You must notify us within 30 days of receiving the item if you intend to return it. We will provide all relevant return instructions at that time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>The item must be returned at the buyer's expense, in its original, resaleable condition, including all tags and packaging, ready for restocking.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>Ensure the item is securely packed to maintain its original condition during transit.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>The item must not be opened, used, worn, or damaged and must be received in perfect, resaleable condition.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>Do not stick or write directly on the item or its original packaging. Postage labels or any writing should only be placed on the outer shipping packaging.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>All Remotes does not accept returns outside of Australia.</span>
              </li>
            </ul>
          </section>

          {/* Additional Notes */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8 lg:col-span-2 xl:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900">Additional Notes</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <h3 className="font-semibold text-amber-900">Transit Damage or Condition Issues</h3>
                <p className="mt-2 text-amber-800 text-sm">If the item is damaged during transit or fails to meet the return conditions outlined above, the refund amount may be adjusted to reflect the item's condition upon receipt.</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <h3 className="font-semibold text-red-900">Non-Returnable Items</h3>
                <p className="mt-2 text-red-800 text-sm">Certain items such as motor parts, including but not limited to control boards, motor lights, motor covers, springs, and weather seals, are not eligible for return. These items are ordered specifically for your request at the time of purchase and cannot be restocked.</p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-panel sm:p-8 lg:col-span-2 xl:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900">Need Help?</h2>
            <p className="mt-3 text-neutral-700">
              If you have any questions about our return policy or need assistance with a return, please don't hesitate to contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-neutral-700">
                <strong>Email:</strong> <a href="mailto:shane@allremotes.com.au" className="text-accent-dark hover:underline">shane@allremotes.com.au</a>
              </p>
              <p className="text-neutral-700">
                <strong>Phone:</strong> Available during business hours
              </p>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}
