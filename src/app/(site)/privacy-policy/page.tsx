import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-neutral-600">
              This Privacy Policy explains how ALL REMOTES PTY LTD (ABN 23 679 611 351) ("we", "us", "our") collects, uses, stores and protects your personal information when you visit or purchase from our website.
            </p>
          </div>

          <div className="mt-10 space-y-8 text-neutral-700">
            <section>
              <h2 className="text-xl font-bold text-neutral-900">1. Information We Collect</h2>
              <p className="mt-3">
                We collect information that you provide directly to us, such as your name, email address, phone number, billing and shipping address, and payment details. We also collect information automatically when you use our site, including your IP address, browser type, device information, and pages visited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">2. How We Use Your Information</h2>
              <p className="mt-3">
                We use your information to process orders, deliver products, communicate with you, improve our website, prevent fraud, and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">3. Storage and Security</h2>
              <p className="mt-3">
                We take reasonable steps to protect your personal information from misuse, loss, unauthorised access, modification or disclosure. All payment information is processed through PCI DSS compliant providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">4. Third Parties</h2>
              <p className="mt-3">
                We may share your information with trusted service providers who help us operate our business, such as payment processors, shipping carriers, and marketing platforms. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">5. Cookies</h2>
              <p className="mt-3">
                Our website uses cookies to enhance your browsing experience, analyse site traffic, and personalise content. You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">6. Your Rights</h2>
              <p className="mt-3">
                You have the right to access, correct, or request deletion of your personal information. To make a request, contact us at{" "}
                <a href="mailto:shane@allremotes.com.au" className="font-semibold text-primary hover:underline">
                  shane@allremotes.com.au
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">7. Contact</h2>
              <p className="mt-3">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:shane@allremotes.com.au" className="font-semibold text-primary hover:underline">
                  shane@allremotes.com.au
                </a>
                {" "}or by mail at 32 Bell Street, Yarra Glen, Victoria 3775.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-neutral-900">8. Updates</h2>
              <p className="mt-3">
                We may update this Privacy Policy from time to time. The latest version will be posted on this page with the effective date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
