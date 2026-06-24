import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white w-full">
      <div className="w-full px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-100"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="mt-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              Warranty & Returns Policy
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-neutral-600">
              All products come with a 12-month warranty against faults and defects
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">

            {/* What's Covered */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-emerald-900">What&apos;s Covered — 12-Month Warranty</h2>
              <p className="mt-3 text-emerald-800">
                All Remotes products are covered by a <strong>12-month warranty from the date of shipment</strong>.
                We accept warranty claims for:
              </p>
              <ul className="mt-4 space-y-2 text-emerald-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span><strong>Faulty / Defective Products</strong> — item arrived not working as expected</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span><strong>Stopped Working</strong> — item ceased functioning within 12 months with no physical damage</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-emerald-700">
                Resolution will be an <strong>exchange of the product</strong> or a refund at our discretion after inspection.
              </p>
            </section>

            {/* What's NOT Covered */}
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-red-900">What&apos;s Not Covered</h2>
              <ul className="mt-4 space-y-2 text-red-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>Change of mind or incorrect purchase</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>Physical damage caused by misuse, drops, or water</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>Items outside the 12-month warranty window</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>Returns from outside Australia</span>
                </li>
              </ul>
            </section>

            {/* How to Start a Claim */}
            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-blue-900">How to Start a Warranty Claim</h2>
              <ol className="mt-4 space-y-3 text-blue-800">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                  <span><strong>Logged-in customers:</strong> Go to <strong>My Account → Orders</strong>, find your order, and click <strong>&quot;Request Warranty / Return&quot;</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                  <span><strong>Guest / no account:</strong> Visit our <Link href="/returns" className="underline hover:text-blue-900">Returns page</Link> and enter your order number and email address.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                  <span>Select the item(s), choose your reason, describe the issue, and attach up to <strong>5 photos</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">4</span>
                  <span>Submit — we&apos;ll review within <strong>1–2 business days</strong> and email you next steps.</span>
                </li>
              </ol>
            </section>

            {/* Timeline */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-neutral-900">Process Timeline</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">1</span>
                  <div><p className="text-sm font-semibold text-neutral-800">Claim submitted</p><p className="text-xs text-neutral-500">You submit via Orders tab or guest lookup</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">2</span>
                  <div><p className="text-sm font-semibold text-neutral-800">Review — 1–2 business days</p><p className="text-xs text-neutral-500">We assess your claim and email you the outcome</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">3</span>
                  <div><p className="text-sm font-semibold text-neutral-800">Return shipping — your expense</p><p className="text-xs text-neutral-500">If approved, we email the return address. You ship the item back.</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">4</span>
                  <div><p className="text-sm font-semibold text-neutral-800">Inspection — 10–15 business days</p><p className="text-xs text-neutral-500">After we receive the item, we inspect and provide resolution</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">5</span>
                  <div><p className="text-sm font-semibold text-neutral-800">Resolution</p><p className="text-xs text-neutral-500">Exchange of product or refund at our discretion</p></div>
                </div>
              </div>
            </section>

            {/* Return Shipping */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-amber-900">Return Shipping</h2>
              <p className="mt-3 text-amber-800">
                Customers are responsible for all return shipping costs. Once your claim is approved, we will email you the correct return address.
                Please ensure the item is securely packaged to avoid damage in transit — any damage that occurs during return shipping may affect the resolution offered.
              </p>
              <p className="mt-3 text-sm text-amber-700">
                Do not write or stick labels directly on the product or its original packaging. Labels should only be placed on the outer shipping packaging.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-neutral-900">Need Help?</h2>
              <p className="mt-3 text-neutral-700">
                If you have questions about a warranty claim or our policy, contact us:
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <a
                  href="mailto:info@allremotes.com.au"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition"
                >
                  info@allremotes.com.au
                </a>
                <Link
                  href="/returns"
                  className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-accent/20 transition"
                >
                  Guest Return Lookup →
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
