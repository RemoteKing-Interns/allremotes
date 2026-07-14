import Link from "next/link";
import { ArrowLeft, Shield, CreditCard, Wallet, Globe } from "lucide-react";

export default function PaymentOptionsPage() {
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
              Payment Options
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 sm:text-lg">
              Secure, flexible payment methods for your convenience.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 lg:col-span-2">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CreditCard size={24} />
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Accepted Cards & Wallets</h2>
              <p className="mt-3 text-emerald-800">
                We accept the following payment methods on our secure checkout:
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["mastercard", "visa", "eftpos", "amex", "jcb", "apple-pay", "google-pay"].map((icon) => (
                  <img
                    key={icon}
                    src={`/icons/payments/${icon}.png`}
                    alt={icon}
                    className="h-10 w-auto rounded"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-emerald-700">
                American Express and JCB are accepted subject to separate card scheme agreements.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Shield size={24} />
              </div>
              <h2 className="text-xl font-bold text-blue-900">Security & Compliance</h2>
              <ul className="mt-4 space-y-2 text-blue-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>PCI DSS compliant payment processing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>3D Secure authentication for online card payments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>SSL encryption for all transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <span>Fraud monitoring and chargeback protection</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-purple-200 bg-purple-50 p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Wallet size={24} />
              </div>
              <h2 className="text-xl font-bold text-purple-900">Multi-Network Debit Cards</h2>
              <p className="mt-3 text-purple-800">
                If you pay with a debit card that displays both the Visa/Mastercard and eftpos logos, the transaction may be routed through the eftpos network.
              </p>
              <p className="mt-4 text-sm text-purple-700">
                This is a standard feature for eligible multi-network debit cards and helps keep fees low while keeping your payment secure.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 lg:col-span-2">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Globe size={24} />
              </div>
              <h2 className="text-xl font-bold text-amber-900">Currency & Pricing</h2>
              <p className="mt-3 text-amber-800">
                All transactions are processed in <strong>Australian Dollars (AUD)</strong>. All prices shown on our website include GST.
              </p>
              <p className="mt-4 text-sm text-amber-700">
                Your payment will be charged in AUD. If your card is issued in another currency, your bank may apply a conversion fee at the exchange rate determined by your card issuer.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 lg:col-span-2">
              <h2 className="text-xl font-bold text-neutral-900">Questions?</h2>
              <p className="mt-3 text-neutral-700">
                If you have any questions about payment methods, security, or transaction issues, please contact us at{" "}
                <a href="mailto:shane@allremotes.com.au" className="font-semibold text-primary hover:underline">
                  shane@allremotes.com.au
                </a>
                .
              </p>
              <p className="mt-4 text-xs text-neutral-400">
                Payment icons by{" "}
                <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-600">
                  Icons8
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
