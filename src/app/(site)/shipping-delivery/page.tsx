import Link from "next/link";
import { ArrowLeft, Package, Truck, Rocket } from "lucide-react";

export default function ShippingDeliveryPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-50 to-white">
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
              Shipping & Delivery
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 sm:text-lg">
              Fast, reliable shipping across Australia. Choose the option that works best for you.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Package size={24} />
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Free Untracked Shipping</h2>
              <p className="mt-3 text-emerald-800">
                <strong>$0.00</strong>
              </p>
              <p className="mt-2 text-emerald-800">
                Estimated delivery: <strong>2–10 business days</strong>
              </p>
              <ul className="mt-4 space-y-2 text-emerald-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>Free on all non-bulky items</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>Sent via standard Australia Post letter service</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>No tracking available</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Truck size={24} />
              </div>
              <h2 className="text-xl font-bold text-blue-900">Tracked Shipping</h2>
              <p className="mt-3 text-blue-800">
                <strong>$12.00</strong>
              </p>
              <p className="mt-2 text-blue-800">
                Estimated delivery: <strong>2–6 business days</strong>
              </p>
              <ul className="mt-4 space-y-2 text-blue-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>Track your order from dispatch to delivery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>Signature on delivery may be required</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>Best for high-value items</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Rocket size={24} />
              </div>
              <h2 className="text-xl font-bold text-purple-900">Express Shipping</h2>
              <p className="mt-3 text-purple-800">
                <strong>$18.00</strong>
              </p>
              <p className="mt-2 text-purple-800">
                Estimated delivery: <strong>1–3 business days</strong>
              </p>
              <ul className="mt-4 space-y-2 text-purple-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                  <span>Track your order end-to-end</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                  <span>Priority processing and dispatch</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                  <span>Best for urgent orders</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 lg:col-span-3">
              <h2 className="text-xl font-bold text-amber-900">Important Delivery Information</h2>
              <ul className="mt-4 grid gap-3 text-amber-800 sm:grid-cols-2">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Shipping is available Australia-wide only.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Delivery timeframes are estimates from dispatch, not from the order date.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Orders placed before 2pm AEST on a business day are dispatched the same day.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Remote or regional areas may experience longer delivery times.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>We do not ship outside Australia.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>Public holidays and weekends may delay dispatch.</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
