// Send one of every email type to a test address
// Usage: npx tsx scripts/send-test-emails.ts <to>
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TO = process.argv[2] || "ajay@remoteking.com.au";

async function main() {
  const email = await import("../src/lib/email");

  const jobs: Array<[string, () => Promise<any>]> = [
    ["order-confirmation", () => email.sendOrderConfirmationEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay",
      items: [
        { name: "Vicway VR55S Genuine Remote 4 Button", quantity: 2, price: 59 },
        { name: "Panasonic CR2032 Battery", quantity: 1, price: 6.5 },
      ],
      total: 124.5,
      shippingAddress: "Ajay Kumar\n254 Archer St\nShepparton VIC 3630\nAustralia",
    })],
    ["shipping-update", () => email.sendShippingUpdateEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay",
      trackingNumber: "33ATP000123456", carrier: "Australia Post",
      status: "Shipped", estimatedDelivery: "Thu 12 Sep",
    })],
    ["order-delivered", () => email.sendOrderDeliveredEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay",
      deliveredDate: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
    })],
    ["password-reset", () => email.sendPasswordResetEmail({
      to: TO, resetToken: "TESTTOKEN1234567890abcdef", customerName: "Ajay",
    })],
    ["welcome", () => email.sendWelcomeEmail({ to: TO, customerName: "Ajay" })],
    ["verify-email", () => email.sendVerificationEmail({
      to: TO, customerName: "Ajay", verificationToken: "TESTVERIFYTOKEN1234567890",
    })],
    ["payment-request", () => email.sendPaymentRequestEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay", total: 124.5,
      paymentUrl: "https://checkout.stripe.com/c/pay/test_session_123",
      message: "Hi Ajay, your order is packed and ready — please complete payment and we'll ship it today.\nThanks!",
    })],
    ["low-stock", () => email.sendLowStockNotification({
      to: TO, productName: "Panasonic CR2032 Battery", sku: "AR-BAT-CR2032", currentStock: 3,
    })],
    ["return-request", () => email.sendReturnRequestEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay Kumar",
      customerEmail: TO, reason: "Remote not pairing with receiver",
      items: ["Vicway VR55S Genuine Remote 4 Button ×2"],
    })],
    ["new-order", () => email.sendNewOrderNotification({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay Kumar",
      customerEmail: TO, total: 124.5,
      items: ["Vicway VR55S Genuine Remote 4 Button ×2", "Panasonic CR2032 Battery ×1"],
    })],
    ["review-request", () => email.sendReviewRequestEmail({
      to: TO, orderId: "AR-TEST-1001", customerName: "Ajay",
    })],
  ];

  for (const [name, fn] of jobs) {
    const r = await fn();
    console.log(`${name}: ${r?.success ? "OK" : "FAIL — " + r?.error}`);
  }

  // Abandoned-cart email lives behind an API route — hit the dev server if up
  try {
    const resp = await fetch("http://localhost:3000/api/abandoned-cart-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: TO, couponCode: "TEST15OFF", discountPercent: 15,
        items: [
          { name: "Hyundai M4B Key Cover", quantity: 2, price: 14 },
          { name: "Vicway VR55S Genuine Remote 4 Button", quantity: 1, price: 59 },
        ],
      }),
    });
    console.log(`abandoned-cart: ${resp.ok ? "OK" : "FAIL — " + (await resp.text())}`);
  } catch {
    console.log("abandoned-cart: SKIPPED — dev server not running on :3000");
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
