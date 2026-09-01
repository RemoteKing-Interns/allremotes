import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import CategoryPageClient from "../../_components/CategoryPageClient";
import { getSiteUrl } from "@/lib/site-url";

type FAQ = { question: string; answer: string };

type HowToStep = { name: string; text: string };

type SupportArticle = {
  title: string;
  description: string;
  keywords: string[];
  Component: () => React.ReactNode;
  faqs?: FAQ[];
  howToSteps?: HowToStep[];
};

function WhichRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "How do I know which garage door remote I need?",
      answer:
        "Check the motor unit for the brand name and model number, then match the remote to that model on our brand pages. If unsure, email us a photo of your motor and existing remote.",
    },
    {
      question: "Can I use a universal remote for any garage door?",
      answer:
        "Some universal remotes work across many brands, but compatibility depends on frequency and rolling-code technology. Universal remotes work best with fixed-code motors on 433MHz.",
    },
    {
      question: "What frequency does my garage door remote use?",
      answer:
        "Most Australian garage door remotes operate on 433MHz. Some older models may use 27MHz or 315MHz. Check the label on your existing remote or motor unit.",
    },
    {
      question: "How do I find my garage door opener model number?",
      answer:
        "The model number is usually on a label on the motor unit mounted on your garage ceiling. It may also be printed on the back of your existing remote or inside the battery compartment.",
    },
  ];
  return (
    <SupportArticleLayout title="Which Garage Door Remote Do I Need?" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        Choosing the right garage door remote starts with identifying your motor brand and model. Most remotes are matched to specific opener series, so the sticker on your motor unit is the best place to begin.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 1: Identify Your Motor Brand</h2>
      <p className="mb-3 text-neutral-700">
        Look at the motor unit mounted on your garage ceiling. The brand name will be prominently displayed. The most common Australian garage door opener brands are:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li><Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link> — Australia&apos;s most popular garage door opener brand</li>
        <li><Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link> — Known for Controll-A-Door and Tri-Tran+ technology</li>
        <li><Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link> — SecuraCode rolling code remotes</li>
        <li><Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link> — Also sold under LiftMaster brand</li>
        <li><Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link> — Popular for roller doors</li>
        <li>Steel-Line — Australian-made openers</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 2: Find the Model Number</h2>
      <p className="mb-3 text-neutral-700">
        On the motor unit, look for a label or sticker with the model number. Common model numbers include:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li><strong>Merlin:</strong> MR800A, MR850, MT100EVO, MT800A, Silent Drive, Merlin+ 2.0</li>
        <li><strong>B&amp;D:</strong> Controll-A-Door S, Controll-A-Door 4, Controll-A-Door 5, Panel Lift</li>
        <li><strong>ATA:</strong> PTX5, PTX4, PTX6, SecuraCode</li>
        <li><strong>Chamberlain:</strong> various model numbers under LiftMaster/MotorLift</li>
        <li><strong>Gliderol:</strong> GTS, GTA, GRD series</li>
      </ul>
      <p className="mb-4 text-neutral-700">
        You can also check the back of your existing remote — the model number is often printed there.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 3: Check the Frequency</h2>
      <p className="mb-3 text-neutral-700">
        Most Australian garage door remotes operate on <strong>433MHz</strong>. Some older models may use 27MHz or 315MHz. The frequency is usually printed on the remote or motor unit label. If you can&apos;t find it, don&apos;t worry — if you match the brand and model, the frequency will be correct.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 4: Match Your Remote</h2>
      <p className="mb-3 text-neutral-700">
        Once you have the brand and model, browse the matching brand page to find your remote:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li>Visit our <Link href="/shop-by-brand" className="font-semibold text-primary hover:underline">brand pages</Link> to see all remotes for your brand</li>
        <li>Compare button count and shape with your old remote</li>
        <li>Check the compatibility list on each product page</li>
        <li>Use the search bar on our <Link href="/products/all" className="font-semibold text-primary hover:underline">all products page</Link> to search by model number</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Still Not Sure?</h2>
      <p className="mb-4 text-neutral-700">
        If you can&apos;t identify your remote, <Link href="/contact" className="font-semibold text-primary hover:underline">email us</Link> a photo of:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li>The front and back of your existing remote</li>
        <li>The label on your motor unit</li>
        <li>Any numbers printed inside the battery compartment</li>
      </ul>
      <p className="mb-4 text-neutral-700">
        We&apos;ll identify the correct replacement for you, usually within one business day.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Original vs Replacement Remotes</h2>
      <p className="mb-4 text-neutral-700">
        Original remotes are made by the motor manufacturer. Replacement (compatible) remotes are made by third-party manufacturers using the same frequency and coding technology. Our replacement remotes are quality-tested, come with a 12-month warranty, and cost less than originals. They program the same way and provide the same range and reliability.
      </p>
    </SupportArticleLayout>
  );
}

function MerlinTroubleshootingArticle() {
  const faqs: FAQ[] = [
    {
      question: "Why won't my Merlin remote program?",
      answer:
        "Most issues are caused by a flat battery, being out of range, or incorrect programming steps. Replace the battery and follow the motor manual's learn-button procedure.",
    },
    {
      question: "Do Merlin remotes need a specific battery?",
      answer:
        "Yes, typically a CR2032 coin cell. Always check the battery markings inside the remote casing.",
    },
  ];
  const howToSteps: HowToStep[] = [
    { name: "Replace the battery", text: "Replace the remote battery with a fresh CR2032 coin cell." },
    { name: "Stand close to the motor", text: "Stand within one metre of the motor when programming." },
    { name: "Press the learn button", text: "Press and release the learn button on the motor, then press the remote button within the timeout window." },
    { name: "Clear old remotes", text: "Clear old remotes from the motor if memory is full." },
    { name: "Check antenna", text: "Check for antenna damage or interference that could block the signal." },
  ];
  return (
    <SupportArticleLayout title="Merlin Remote Won't Program?" faqs={faqs} howToSteps={howToSteps}>
      <p className="mb-4 text-neutral-700">
        A Merlin remote that refuses to program is usually a quick fix. Before assuming a faulty remote, work through the checklist below.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Quick troubleshooting steps</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-neutral-700">
        <li>Replace the remote battery with a fresh CR2032.</li>
        <li>Stand within one metre of the motor when programming.</li>
        <li>Press and release the learn button, then press the remote button within the timeout window.</li>
        <li>Clear old remotes from the motor if memory is full.</li>
        <li>Check for antenna damage or interference.</li>
      </ol>
      <p className="mb-4 text-neutral-700">
        If the motor beeps but the door does not respond, the remote may be a compatible but incorrect frequency. Match the part number on your original remote or motor label to the replacement listing.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">When to replace the remote</h2>
      <p className="mb-4 text-neutral-700">
        Cracked cases, worn buttons, or water damage can prevent reliable operation. A new remote is often cheaper than repeated call-out fees.
      </p>
    </SupportArticleLayout>
  );
}

function AtaVsMerlinArticle() {
  return (
    <SupportArticleLayout title="ATA vs Merlin Remote: Which Is Right for You?">
      <p className="mb-4 text-neutral-700">
        ATA and Merlin are two of the biggest garage door brands in Australia. The right remote depends on your motor, not your preference, because each brand uses different rolling-code technology.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">ATA remotes</h2>
      <p className="mb-4 text-neutral-700">
        ATA remotes are popular in domestic sectional and roller-door motors. They are generally identified by the SecuraCode range and are programmed through the motor's learn button.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Merlin remotes</h2>
      <p className="mb-4 text-neutral-700">
        Merlin remotes cover the Chamberlain and Merlin+ product lines. Look for the part number on the back of your existing remote (e.g., E960M, E945M) and match it exactly.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Cross-brand compatibility</h2>
      <p className="mb-4 text-neutral-700">
        Some aftermarket remotes work on multiple brands, but using an exact-match replacement is the safest way to keep your warranty and guarantee range.
      </p>
    </SupportArticleLayout>
  );
}

function LostGateRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "Can I replace a lost gate remote without the original?",
      answer:
        "Yes. The motor brand and model number are enough for us to identify a compatible replacement.",
    },
    {
      question: "Should I erase the lost remote from the motor?",
      answer:
        "Yes. Erasing lost remotes from the motor memory prevents the missing remote from opening your gate.",
    },
  ];
  const howToSteps: HowToStep[] = [
    { name: "Locate the motor box", text: "Locate the motor box and note the brand and model number." },
    { name: "Count the buttons", text: "Count the buttons you need (one per gate or pedestrian access)." },
    { name: "Order a compatible remote", text: "Order a compatible remote from our brand pages matching your motor model." },
    { name: "Program the new remote", text: "Program the new remote using the motor's learn button." },
    { name: "Erase the lost remote", text: "Erase the lost remote from motor memory for security." },
  ];
  return (
    <SupportArticleLayout title="How to Replace a Lost Gate Remote" faqs={faqs} howToSteps={howToSteps}>
      <p className="mb-4 text-neutral-700">
        Losing a gate remote is frustrating, but replacing it is straightforward once you identify your motor system.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step-by-step replacement</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-neutral-700">
        <li>Locate the motor box and note the brand and model.</li>
        <li>Count the buttons you need (one per gate or pedestrian access).</li>
        <li>Order a compatible remote from our brand pages.</li>
        <li>Program the new remote using the motor's learn button.</li>
        <li>Erase the lost remote from memory for security.</li>
      </ol>
      <p className="mb-4 text-neutral-700">
        For gated communities or commercial systems, check with the installer before clearing all stored remotes, as this may affect other users.
      </p>
      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Security tip</h2>
      <p className="mb-4 text-neutral-700">
        If the remote is missing and not just broken, clear the motor memory and reprogram every remaining remote. This ensures the lost remote cannot be used by anyone else.
      </p>
    </SupportArticleLayout>
  );
}

function HowToProgramGarageRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "How long does it take to program a garage door remote?",
      answer:
        "Most garage door remotes can be programmed in under five minutes. The process involves pressing a learn button on the motor and then pressing a button on the new remote.",
    },
    {
      question: "Do I need any tools to program my remote?",
      answer:
        "Usually no tools are required. Some motor units may need a small step ladder to reach the learn button. A flathead screwdriver may be needed to open the remote's battery compartment.",
    },
    {
      question: "What if the learn button doesn't work?",
      answer:
        "Check that the motor has power and that the learn button is not stuck. If the motor's memory is full, you may need to clear all remotes first and reprogram them. See our Merlin troubleshooting guide for detailed steps.",
    },
  ];
  const howToSteps: HowToStep[] = [
    { name: "Locate the learn button", text: "Find the learn button on your garage door motor unit, usually behind a light cover or on the back panel." },
    { name: "Press the learn button", text: "Press and release the learn button. An LED will typically start flashing to indicate the motor is in learn mode." },
    { name: "Press the remote button", text: "Within 10-30 seconds, press and hold a button on your new remote until the motor light flashes or clicks." },
    { name: "Test the remote", text: "Test the remote by pressing the button to open or close the door. Repeat for additional buttons if needed." },
  ];
  return (
    <SupportArticleLayout title="How to Program a Garage Door Remote" faqs={faqs} howToSteps={howToSteps}>
      <p className="mb-4 text-neutral-700">
        Programming a replacement garage door remote is a simple process that takes less than five minutes. The exact steps vary slightly by brand, but the general procedure is the same for most Australian garage door openers.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">General Programming Steps</h2>
      <ol className="mb-4 list-decimal space-y-2 pl-5 text-neutral-700">
        <li>Locate the <strong>learn button</strong> on your motor unit — it&apos;s usually behind the light cover or on the back panel.</li>
        <li>Press and release the learn button. An LED will start flashing to show the motor is in learn mode.</li>
        <li>Within 10-30 seconds, press and hold a button on your new remote.</li>
        <li>The motor light will flash or click to confirm the remote has been paired.</li>
        <li>Test the remote by pressing the button to operate the door.</li>
      </ol>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Brand-Specific Instructions</h2>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Merlin</h3>
      <p className="mb-3 text-neutral-700">
        Press the learn button on the Merlin motor (often purple or orange). The LED will flash. Press a button on the remote within 10 seconds. The motor light will flash to confirm. For detailed troubleshooting, see our{" "}
        <Link href="/support/merlin-remote-wont-program" className="font-semibold text-primary hover:underline">Merlin troubleshooting guide</Link>.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">B&amp;D</h3>
      <p className="mb-3 text-neutral-700">
        Press and hold the learn button on the B&amp;D motor until the LED flashes. Press a button on the remote. The motor will click to confirm. Release the remote button.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">ATA</h3>
      <p className="mb-3 text-neutral-700">
        Press the learn button on the ATA motor (usually behind the light lens). The LED will illuminate. Press a button on the remote. The LED will flash to confirm pairing.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Chamberlain / LiftMaster</h3>
      <p className="mb-3 text-neutral-700">
        Press and release the learn button. Within 30 seconds, press and hold the remote button until the motor light clicks. Test the remote.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Gliderol</h3>
      <p className="mb-3 text-neutral-700">
        Press the learn button on the Gliderol motor. The LED will flash. Press a button on the remote. The motor will confirm with a flash or click.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Clearing All Remotes</h2>
      <p className="mb-4 text-neutral-700">
        If your motor&apos;s memory is full or you&apos;ve lost a remote, you can clear all remotes by pressing and holding the learn button for 6-10 seconds until the LED goes out. You&apos;ll then need to reprogram all your remotes.
      </p>

      <p className="mb-4 text-neutral-700">
        Ready to buy? Browse our range of{" "}
        <Link href="/products/garage" className="font-semibold text-primary hover:underline">garage door remotes</Link>{" "}
        or visit our{" "}
        <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
        <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link>, or{" "}
        <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>{" "}
        brand pages.
      </p>
    </SupportArticleLayout>
  );
}

function AreUniversalRemotesReliableArticle() {
  const faqs: FAQ[] = [
    {
      question: "Are universal garage door remotes reliable?",
      answer:
        "Universal remotes can be reliable for fixed-code motors on 433MHz. However, for rolling code motors (like Merlin and ATA), brand-specific replacements are more reliable and easier to program.",
    },
    {
      question: "What is the difference between fixed code and rolling code?",
      answer:
        "Fixed code remotes transmit the same code every time. Rolling code remotes generate a new code each press, providing better security. Most modern Australian garage door openers use rolling code.",
    },
    {
      question: "Will a universal remote work with my Merlin opener?",
      answer:
        "Most universal remotes do not support Merlin's rolling code technology. We recommend using a Merlin-compatible replacement remote instead for reliable operation.",
    },
  ];
  return (
    <SupportArticleLayout title="Are Universal Garage Door Remotes Reliable?" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        Universal garage door remotes promise to work with any opener, but the reality is more nuanced. Whether a universal remote is reliable depends on your motor&apos;s coding technology, frequency, and age.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Fixed Code vs Rolling Code</h2>
      <p className="mb-3 text-neutral-700">
        Garage door remotes use one of two coding technologies:
      </p>
      <ul className="mb-4 list-disc space-y-2 pl-5 text-neutral-700">
        <li><strong>Fixed code:</strong> The remote transmits the same code every time. Universal remotes work well with these. Older openers and some gate motors use fixed code.</li>
        <li><strong>Rolling code:</strong> The remote generates a new code each time the button is pressed, preventing code grabbing. Most modern Australian openers (Merlin, ATA, B&amp;D) use rolling code. Universal remotes often can&apos;t replicate this.</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">When Universal Remotes Work</h2>
      <p className="mb-3 text-neutral-700">
        Universal remotes are a good option when:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li>Your motor uses fixed code on 433MHz</li>
        <li>You have multiple gates or doors with different brands</li>
        <li>You can&apos;t find a brand-specific replacement</li>
        <li>Your opener is older and uses dip switches for coding</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">When to Choose a Brand-Specific Remote</h2>
      <p className="mb-3 text-neutral-700">
        For modern Australian garage door openers, a brand-specific replacement is almost always the better choice:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li><Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link> — Uses proprietary rolling code; universal remotes rarely work</li>
        <li><Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link> — SecuraCode rolling code; brand-specific required</li>
        <li><Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link> — Tri-Tran+ rolling code; brand-specific required</li>
        <li><Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link> — Security+ rolling code; brand-specific required</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Security Considerations</h2>
      <p className="mb-4 text-neutral-700">
        Rolling code technology exists to prevent unauthorised access. Universal remotes that bypass rolling code may reduce your garage&apos;s security. If security is a concern, always choose a brand-specific replacement that uses the same rolling code technology as your original remote.
      </p>

      <p className="mb-4 text-neutral-700">
        Not sure which remote you need? Use our{" "}
        <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">remote finder guide</Link>{" "}
        or browse our{" "}
        <Link href="/products/garage" className="font-semibold text-primary hover:underline">garage remotes range</Link>.
      </p>
    </SupportArticleLayout>
  );
}

function GarageRemoteRangeArticle() {
  const faqs: FAQ[] = [
    {
      question: "What is the range of a typical garage door remote?",
      answer:
        "Most garage door remotes have a range of 20-50 metres in open air. In practice, walls, doors, and interference can reduce this to 10-30 metres.",
    },
    {
      question: "Why has my garage remote range decreased?",
      answer:
        "The most common cause is a weak battery. Other causes include interference from LED lights, Wi-Fi routers, or metal objects near the motor antenna.",
    },
    {
      question: "How can I improve my garage remote range?",
      answer:
        "Replace the battery first. Then check the antenna on the motor unit is fully extended and not touching metal. Move any sources of interference (LED lights, routers) away from the motor.",
    },
  ];
  return (
    <SupportArticleLayout title="What Is the Range of a Typical Garage Door Remote?" faqs={faqs}>
      <p className="mb-4 text-neutral-700">
        The range of a garage door remote depends on several factors including frequency, battery condition, environmental interference, and the motor&apos;s antenna. Understanding these factors can help you troubleshoot range issues.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Typical Range</h2>
      <p className="mb-3 text-neutral-700">
        Most Australian garage door remotes operating on 433MHz have a range of:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li><strong>Open air:</strong> 30-50 metres</li>
        <li><strong>Through one wall:</strong> 20-30 metres</li>
        <li><strong>Through multiple walls:</strong> 10-20 metres</li>
        <li><strong>From inside a car:</strong> 15-25 metres</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Factors That Affect Range</h2>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Battery Condition</h3>
      <p className="mb-3 text-neutral-700">
        A weak battery is the #1 cause of reduced range. Most remotes use a CR2032 coin cell. If your range has dropped significantly, replace the battery first — it&apos;s the cheapest and most common fix.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Environmental Interference</h3>
      <p className="mb-3 text-neutral-700">
        Common sources of interference include:
      </p>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-neutral-700">
        <li>LED light fixtures near the motor</li>
        <li>Wi-Fi routers and Bluetooth devices</li>
        <li>Metal garage doors and foil insulation</li>
        <li>Other 433MHz devices (gate remotes, weather stations)</li>
        <li>Power lines and electrical panels</li>
      </ul>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Antenna Position</h3>
      <p className="mb-3 text-neutral-700">
        Check the antenna on your motor unit. It should hang straight down and not touch any metal parts. If the antenna is damaged or coiled up, range will be significantly reduced.
      </p>

      <h3 className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Frequency</h3>
      <p className="mb-3 text-neutral-700">
        Most Australian remotes use 433MHz, which penetrates walls reasonably well. Older 27MHz remotes may have shorter range, while 2.4GHz remotes (rare in Australia) have shorter range through walls but higher data rates.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">How to Improve Range</h2>
      <ol className="mb-4 list-decimal space-y-2 pl-5 text-neutral-700">
        <li>Replace the remote battery with a fresh CR2032</li>
        <li>Ensure the motor antenna is fully extended and hanging straight down</li>
        <li>Move LED light fixtures away from the motor unit</li>
        <li>Relocate Wi-Fi routers at least 1 metre from the motor</li>
        <li>Check for metal objects touching the antenna</li>
        <li>If range is still poor, consider a replacement remote — old remotes can degrade</li>
      </ol>

      <p className="mb-4 text-neutral-700">
        Need a new remote? Browse our{" "}
        <Link href="/products/garage" className="font-semibold text-primary hover:underline">garage remotes range</Link>{" "}
        or use our{" "}
        <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">remote finder guide</Link>.
      </p>
    </SupportArticleLayout>
  );
}

function ReplaceLostGarageRemoteArticle() {
  const faqs: FAQ[] = [
    {
      question: "What should I do if I lose my garage door remote?",
      answer:
        "First, clear all remotes from your motor unit to prevent unauthorised access. Then identify your motor brand and model, order a replacement, and reprogram all remaining remotes.",
    },
    {
      question: "Can someone use my lost remote to open my garage?",
      answer:
        "Yes, if the remote is still programmed to your motor. Clear all remotes from the motor immediately by holding the learn button for 6-10 seconds, then reprogram your remaining remotes.",
    },
    {
      question: "How do I clear a lost remote from my garage door motor?",
      answer:
        "Press and hold the learn button on the motor unit for 6-10 seconds until the LED goes out. This erases all remote codes. You'll need to reprogram all your remotes afterwards.",
    },
  ];
  const howToSteps: HowToStep[] = [
    { name: "Clear all remotes", text: "Press and hold the learn button on the motor for 6-10 seconds until the LED goes out. This erases all remote codes." },
    { name: "Identify your motor", text: "Check the motor unit for the brand name and model number." },
    { name: "Order a replacement", text: "Browse our brand pages to find a compatible replacement remote." },
    { name: "Program the new remote", text: "Press the learn button, then press a button on the new remote to pair it." },
    { name: "Reprogram remaining remotes", text: "Repeat the programming process for any other remotes you still have." },
  ];
  return (
    <SupportArticleLayout title="How to Replace a Lost Garage Door Remote" faqs={faqs} howToSteps={howToSteps}>
      <p className="mb-4 text-neutral-700">
        Losing your garage door remote is stressful, but replacing it is straightforward. Follow these steps to secure your garage and get a new remote working.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 1: Secure Your Garage</h2>
      <p className="mb-3 text-neutral-700">
        The lost remote can still open your garage. <strong>Clear all remotes immediately</strong> by pressing and holding the learn button on your motor unit for 6-10 seconds until the LED goes out. This erases all remote codes, including the lost one.
      </p>
      <p className="mb-4 text-neutral-700">
        You&apos;ll need to reprogram any remotes you still have after doing this.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 2: Identify Your Motor</h2>
      <p className="mb-3 text-neutral-700">
        Check the motor unit on your garage ceiling for the brand name and model number. Common Australian brands include{" "}
        <Link href="/brands/Merlin" className="font-semibold text-primary hover:underline">Merlin</Link>,{" "}
        <Link href="/brands/B%26D" className="font-semibold text-primary hover:underline">B&amp;D</Link>,{" "}
        <Link href="/brands/ATA" className="font-semibold text-primary hover:underline">ATA</Link>,{" "}
        <Link href="/brands/Chamberlain" className="font-semibold text-primary hover:underline">Chamberlain</Link>{" "}
        and{" "}
        <Link href="/brands/Gliderol" className="font-semibold text-primary hover:underline">Gliderol</Link>.
      </p>
      <p className="mb-4 text-neutral-700">
        For detailed identification help, see our{" "}
        <Link href="/support/which-garage-door-remote-do-i-need" className="font-semibold text-primary hover:underline">remote finder guide</Link>.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 3: Order a Replacement</h2>
      <p className="mb-3 text-neutral-700">
        Browse our{" "}
        <Link href="/products/garage" className="font-semibold text-primary hover:underline">garage remotes range</Link>{" "}
        or visit the brand page for your motor. All our remotes come with a 12-month warranty and ship Australia-wide with same-day dispatch for orders before 2pm AEST.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 4: Program the New Remote</h2>
      <p className="mb-3 text-neutral-700">
        Once your replacement arrives, program it by pressing the learn button on the motor, then pressing a button on the new remote. See our{" "}
        <Link href="/support/how-to-program-a-garage-door-remote" className="font-semibold text-primary hover:underline">programming guide</Link>{" "}
        for brand-specific instructions.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold text-neutral-900">Step 5: Reprogram Remaining Remotes</h2>
      <p className="mb-4 text-neutral-700">
        Since you cleared all remotes in Step 1, you&apos;ll need to reprogram any other remotes you still have. Follow the same learn button process for each remote.
      </p>

      <p className="mb-4 text-neutral-700">
        Need help identifying your remote?{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">Email us</Link>{" "}
        a photo of your motor unit and we&apos;ll identify the correct replacement.
      </p>
    </SupportArticleLayout>
  );
}

const SUPPORT_ARTICLES: Record<string, SupportArticle> = {
  "which-garage-door-remote-do-i-need": {
    title: "Which Garage Door Remote Do I Need? | ALLREMOTES Australia",
    description:
      "Find out which garage door remote you need. Match your motor brand and model to a compatible replacement from ALLREMOTES Australia.",
    keywords: [
      "garage door remote",
      "which remote do i need",
      "garage door opener remote",
      "Merlin remote",
      "ATA remote",
    ],
    Component: WhichRemoteArticle,
  },
  "merlin-remote-wont-program": {
    title: "Merlin Remote Won't Program? Troubleshooting Guide | ALLREMOTES",
    description:
      "Troubleshoot a Merlin garage remote that won't program. Battery, learn button and range fixes from ALLREMOTES Australia.",
    keywords: [
      "Merlin remote wont program",
      "Merlin remote not working",
      "program Merlin remote",
      "garage door remote troubleshooting",
    ],
    Component: MerlinTroubleshootingArticle,
  },
  "ata-vs-merlin-remote": {
    title: "ATA vs Merlin Remote: Which Is Right for You? | ALLREMOTES",
    description:
      "Compare ATA and Merlin garage door remotes. Learn which replacement remote fits your motor at ALLREMOTES Australia.",
    keywords: [
      "ATA vs Merlin",
      "ATA remote",
      "Merlin remote",
      "garage door remote comparison",
    ],
    Component: AtaVsMerlinArticle,
  },
  "replace-lost-gate-remote": {
    title: "How to Replace a Lost Gate Remote | ALLREMOTES Australia",
    description:
      "Replace a lost gate remote quickly. Identify your motor brand, order a compatible remote and secure your gate with ALLREMOTES.",
    keywords: [
      "lost gate remote",
      "replace gate remote",
      "gate remote replacement",
      "garage gate remote lost",
    ],
    Component: LostGateRemoteArticle,
  },
  "how-to-program-a-garage-door-remote": {
    title: "How to Program a Garage Door Remote | ALLREMOTES Australia",
    description:
      "Step-by-step guide to programming a garage door remote. Learn button instructions for Merlin, B&D, ATA, Chamberlain and Gliderol openers.",
    keywords: [
      "program garage door remote",
      "how to program garage remote",
      "garage remote programming",
      "learn button garage door",
      "pair garage remote",
    ],
    Component: HowToProgramGarageRemoteArticle,
  },
  "are-universal-garage-remotes-reliable": {
    title: "Are Universal Garage Door Remotes Reliable? | ALLREMOTES",
    description:
      "Universal vs brand-specific garage remotes. Fixed code vs rolling code explained. Find out which remote type is right for your opener.",
    keywords: [
      "universal garage remote",
      "universal garage door remote",
      "are universal remotes reliable",
      "fixed code vs rolling code",
      "universal remote australia",
    ],
    Component: AreUniversalRemotesReliableArticle,
  },
  "garage-remote-range": {
    title: "What Is the Range of a Garage Door Remote? | ALLREMOTES",
    description:
      "Typical garage door remote range and factors that affect it. Learn how to improve your remote range with battery, antenna and interference tips.",
    keywords: [
      "garage remote range",
      "garage door remote range",
      "how far does garage remote work",
      "improve garage remote range",
      "garage remote not working from far",
    ],
    Component: GarageRemoteRangeArticle,
  },
  "replace-lost-garage-remote": {
    title: "How to Replace a Lost Garage Door Remote | ALLREMOTES Australia",
    description:
      "Lost your garage door remote? Follow these steps to secure your garage, identify your motor, order a replacement and program it.",
    keywords: [
      "lost garage door remote",
      "replace lost garage remote",
      "garage remote lost",
      "what to do if garage remote lost",
      "garage remote replacement",
    ],
    Component: ReplaceLostGarageRemoteArticle,
  },
};

function BreadcrumbJsonLd({ slug }: { slug: string }) {
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/support/${slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Support",
          item: `${siteUrl}/support`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: SUPPORT_ARTICLES[slug]?.title.split(" | ")[0] || "Article",
          item: articleUrl,
        },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}

function FaqJsonLd({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function HowToJsonLd({ steps, title }: { steps: HowToStep[]; title: string }) {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function SupportArticleLayout({
  title,
  children,
  faqs,
  howToSteps,
}: {
  title: string;
  children: React.ReactNode;
  faqs?: FAQ[];
  howToSteps?: HowToStep[];
}) {
  return (
    <article className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-16">
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {title}
          </h1>
        </header>
        <div className="prose prose-neutral max-w-none">{children}</div>
        {faqs && faqs.length > 0 && (
          <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Frequently asked questions
            </h2>
            <dl className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx}>
                  <dt className="font-semibold text-neutral-900">
                    {faq.question}
                  </dt>
                  <dd className="mt-1 text-neutral-700">{faq.answer}</dd>
                </div>
              ))}
            </dl>
            <FaqJsonLd faqs={faqs} />
          </section>
        )}
        {howToSteps && howToSteps.length > 0 && <HowToJsonLd steps={howToSteps} title={title} />}
      </div>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug?.[0] || "";
  const article = key ? SUPPORT_ARTICLES[key] : null;
  if (article) {
    const canonical = `/support/${key}`;
    return {
      title: article.title,
      description: article.description,
      keywords: article.keywords,
      alternates: { canonical },
      openGraph: {
        title: article.title,
        description: article.description,
        type: "article",
        locale: "en_AU",
        siteName: "ALLREMOTES Australia",
        url: canonical,
        images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.description,
        images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
      },
    };
  }
  return {
    title: "Support | ALLREMOTES Australia",
    description:
      "Get help with garage door, gate, car and home remotes at ALLREMOTES Australia.",
    keywords: ["remote support", "garage door remote help", "remote programming"],
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const key = slug?.[0] || "";
  const article = key ? SUPPORT_ARTICLES[key] : null;

  if (article) {
    const ArticleComponent = article.Component;
    return (
      <>
        <ArticleComponent />
        <BreadcrumbJsonLd slug={key} />
      </>
    );
  }

  return <CategoryPageClient category="support" />;
}

