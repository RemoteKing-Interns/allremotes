import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-50 to-white">
      <div className="w-full px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-100"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="mt-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-4 text-neutral-600">
              These Terms & Conditions govern your use of the ALLREMOTES website and any purchase you make from us. By using this website, you agree to these terms.
            </p>
          </div>

          <div className="mt-10 space-y-8 text-neutral-700">
            <section>
              <h2 className="text-xl font-bold text-neutral-900">1. Business Information</h2>
              <p className="mt-3">
                This website is operated by <strong>ALL REMOTES PTY LTD</strong> (ABN 23 679 611 351). Our registered business address is 32 Bell Street, Yarra Glen, Victoria 3775. We are GST registered. Contact: {" "}
                <a href="mailto:shane@allremotes.com.au" className="font-semibold text-primary hover:underline">
                  shane@allremotes.com.au
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">2. Prices and Currency</h2>
              <p className="mt-3">
                All prices are displayed in <strong>Australian Dollars (AUD)</strong> and include GST unless otherwise stated. The total cost of your order, including shipping, will be shown at checkout before you place your order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">3. Orders and Acceptance</h2>
              <p className="mt-3">
                Placing an order through our website is an offer to purchase. We reserve the right to accept or decline any order for any reason, including product availability, errors in pricing or product descriptions, or suspected fraud.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">4. Shipping and Delivery</h2>
              <p className="mt-3">
                We ship Australia-wide only. Delivery timeframes are estimates from dispatch and are not guaranteed. We are not responsible for delays caused by our shipping partners or events outside our control. Please see our{" "}
                <Link href="/shipping-delivery" className="font-semibold text-primary hover:underline">
                  Shipping & Delivery
                </Link>
                {" "}page for full details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">5. Returns and Warranty</h2>
              <p className="mt-3">
                Our products are covered by a 12-month warranty against defects. Please see our{" "}
                <Link href="/return-policy" className="font-semibold text-primary hover:underline">
                  Warranty & Returns Policy
                </Link>
                {" "}for details on how to make a claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">6. Payment</h2>
              <p className="mt-3">
                We accept Mastercard, Visa, eftpos, American Express, JCB, Apple Pay and Google Pay, subject to card scheme availability. Payments are processed securely through PCI DSS compliant providers. Eligible multi-network debit cards may be routed through the eftpos network.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">7. Product Descriptions</h2>
              <p className="mt-3">
                We make every effort to ensure product descriptions, images and prices are accurate. However, we do not warrant that all descriptions are complete, current or error-free. Aftermarket products are designed to be compatible with original equipment; brand names and trademarks are used for compatibility purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">8. Limitation of Liability</h2>
              <p className="mt-3">
                To the extent permitted by Australian consumer law, our liability is limited to the value of the product or service in question. We are not liable for indirect, incidental or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">9. Governing Law</h2>
              <p className="mt-3">
                These terms are governed by the laws of Victoria, Australia. Any disputes will be resolved in the courts of Victoria.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">10. Changes</h2>
              <p className="mt-3">
                We may update these Terms & Conditions at any time. Your continued use of the website after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
