import Link from "next/link";
import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { getPublicProducts, getHomeContentServer, getReviewsServer } from "@/lib/public-site";
import HeroSlider, { type HeroSlide } from "./_components/HeroSlider";
import FeaturesSection, { type Feature } from "./_components/FeaturesSection";
import FeaturedProducts from "./_components/FeaturedProducts";

export const revalidate = 60;

const DEFAULT_HERO_IMAGES = [
  "/images/3.jpg",
  "/images/1.jpg",
  "/images/5.png",
  "/images/2.jpg",
  "/images/6.png",
  "/images/4.png",
  "/images/7.png",
  "/images/8.png",
  "/images/9.png",
  "/images/10.png",
];

const DEFAULT_FEEDBACK_REVIEWS = [
  { rating: 5, text: "Fast dispatch and clear compatibility notes. The remote paired in minutes.", author: "Daniel S.", verified: true },
  { rating: 5, text: "Exactly what we needed for workshop reorders. Product quality is consistent.", author: "Mia L.", verified: true },
  { rating: 4, text: "Good pricing and support replied quickly with programming guidance.", author: "Cooper R.", verified: true },
  { rating: 5, text: "Ordered two gate remotes and both worked perfectly. Packaging was secure.", author: "Harper T.", verified: true },
  { rating: 5, text: "Trade account workflow is smooth and reordering is much faster now.", author: "Ava K.", verified: true },
  { rating: 4, text: "Reliable stock levels and straightforward checkout. Will buy again.", author: "Noah P.", verified: true },
];

const WHY_BUY_ICON_MAP: Record<string, any> = {
  qa: ShieldCheck,
  shieldcheck: ShieldCheck,
  shield: ShieldCheck,
  fs: Truck,
  truck: Truck,
  shipping: Truck,
  wr: RotateCcw,
  returns: RotateCcw,
  warranty: RotateCcw,
  cs: Headset,
  support: Headset,
  pm: CreditCard,
  payment: CreditCard,
  securepayments: CreditCard,
  tr: Users,
  trusted: Users,
  reviews: Star,
};

const DEFAULT_WHY_BUY = [
  { title: "Quality Guaranteed", description: "Every remote is checked for fit, finish, and reliable day-to-day use before it reaches your cart." },
  { title: "Fast Shipping", description: "Responsive dispatch and clear communication for retail buyers, workshops, and trade customers." },
  { title: "Support That Knows Remotes", description: "Practical help for identifying the right model, checking compatibility, and reordering quickly." },
];

function resolveWhyBuyIcon(card: any, index: number) {
  const keyFromIcon = String(card?.icon || "").toLowerCase().replace(/[^a-z]/g, "");
  const keyFromTitle = String(card?.title || "").toLowerCase().replace(/[^a-z]/g, "");
  if (WHY_BUY_ICON_MAP[keyFromIcon]) return WHY_BUY_ICON_MAP[keyFromIcon];
  if (WHY_BUY_ICON_MAP[keyFromTitle]) return WHY_BUY_ICON_MAP[keyFromTitle];
  const fallbackIcons = [ShieldCheck, Truck, RotateCcw, Headset, CreditCard, Users];
  return fallbackIcons[index % fallbackIcons.length];
}

export default async function Home() {
  const [products, homeRaw, reviewsRaw] = await Promise.all([
    getPublicProducts(),
    getHomeContentServer(),
    getReviewsServer(),
  ]);

  const home = homeRaw || {};
  const hero = home.hero || {};
  const features: Feature[] = Array.isArray(home.features) ? home.features : [];
  const whyBuy = Array.isArray(home.whyBuy) ? home.whyBuy : [];
  const cta = home.ctaSection || {};
  const heroImages =
    home.heroImages && Array.isArray(home.heroImages) && home.heroImages.length > 0
      ? home.heroImages
      : DEFAULT_HERO_IMAGES;

  const whyBuyCards = whyBuy.length > 0 ? whyBuy : DEFAULT_WHY_BUY;
  const heroReasons = whyBuyCards.slice(0, 3);
  const heroLeadReason = heroReasons[0] || DEFAULT_WHY_BUY[0];
  const heroSideReasons = heroReasons.slice(1);

  const carProductsCount = products.filter((p: any) => p?.category === "car").length;
  const garageProductsCount = products.filter((p: any) => p?.category === "garage").length;

  const defaultHeroHighlights = [
    heroSideReasons[0] || { title: "Fast Shipping", description: "Responsive dispatch and practical support for trade and retail buyers." },
    heroSideReasons[1] || { title: "Support That Knows Remotes", description: "Practical guidance for matching remotes, keys, and compatible accessories." },
  ];

  const configuredHeroSlides = Array.isArray(home.heroSlides) ? home.heroSlides : [];
  const fallbackHeroSlides = [
    {
      subtitle: hero.subtitle || "Quality is Guaranteed",
      title: hero.title || "Garage Door & Gate Remotes",
      description: hero.description || "Your trusted source for car and garage remotes. Browse reliable replacements and accessories.",
      primaryCta: hero.primaryCta || "Shop Car Remotes",
      primaryCtaPath: hero.primaryCtaPath || "/products/car",
      secondaryCta: hero.secondaryCta || "Shop Garage Remotes",
      secondaryCtaPath: hero.secondaryCtaPath || "/products/garage",
      sideKicker: "Business-grade service",
      sideTitle: heroLeadReason.title,
      sideDescription: heroLeadReason.description,
      highlights: defaultHeroHighlights,
    },
    {
      subtitle: "Automotive remote keys",
      title: "Replacement Car Keys & Smart Remotes",
      description:
        (carProductsCount > 0
          ? `Browse ${carProductsCount}+ automotive remote options across smart keys, shells, and replacement key solutions.`
          : "Browse automotive remote options across smart keys, shells, and replacement key solutions.") +
        " Built for fitment and fast reordering.",
      primaryCta: "Shop Automotive",
      primaryCtaPath: "/products/car",
      secondaryCta: "See Full Range",
      secondaryCtaPath: "/products/all",
      sideKicker: "Automotive focus",
      sideTitle: "Vehicle-ready replacements",
      sideDescription: "Find the right remote key solution faster with a catalog focused on popular automotive formats and dependable stock.",
      highlights: [
        { title: "Fitment-first range", description: "Organized for faster browsing across common vehicle remote and smart key styles." },
        { title: "Clearer buying path", description: "Category-led navigation helps retail buyers and workshops locate automotive options quickly." },
      ],
    },
    {
      subtitle: "Garage & gate access",
      title: "Garage, Gate & Access Remotes",
      description:
        (garageProductsCount > 0
          ? `Explore ${garageProductsCount}+ garage and gate remote options for home, building, and access automation needs.`
          : "Explore garage and gate remote options for home, building, and access automation needs.") +
        " A practical range backed by responsive support.",
      primaryCta: "Shop Garage & Gate",
      primaryCtaPath: "/products/garage",
      secondaryCta: "Browse Best Sellers",
      secondaryCtaPath: "/products/all",
      sideKicker: "Access control range",
      sideTitle: "Reliable everyday control",
      sideDescription: "From household remotes to trade supply, the garage and gate range is designed for clean selection and repeat ordering.",
      highlights: [
        { title: "Home and trade ready", description: "Suitable for homeowners, installers, locksmiths, and repeat trade customers." },
        { title: "Support beyond checkout", description: "Get help with product identification, reordering, and general remote selection." },
      ],
    },
  ];

  const heroSlides: HeroSlide[] = heroImages.map((image: string, index: number) => {
    const fallback = fallbackHeroSlides[index % fallbackHeroSlides.length];
    const configured = configuredHeroSlides[index] || {};
    const configuredHighlights =
      Array.isArray(configured.highlights) && configured.highlights.length > 0
        ? configured.highlights.slice(0, 2)
        : fallback.highlights;
    return { image, ...fallback, ...configured, highlights: configuredHighlights };
  });

  // Merge server reviews with defaults
  const normalizedReviews = (reviewsRaw || [])
    .map((r: any, idx: number) => ({
      rating: Math.max(1, Math.min(5, Number(r?.rating) || 5)),
      text: String(r?.text || "").trim(),
      author: String(r?.author || "").trim() || `Customer ${idx + 1}`,
      verified: Boolean(r?.verified),
    }))
    .filter((r: any) => r.text);

  const seenKeys = new Set(normalizedReviews.map((r: any) => `${r.text}__${r.author}`.toLowerCase()));
  const feedbackReviews = [...normalizedReviews];
  for (const review of DEFAULT_FEEDBACK_REVIEWS) {
    if (feedbackReviews.length >= 9) break;
    const key = `${review.text}__${review.author}`.toLowerCase();
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    feedbackReviews.push(review);
  }
  const finalReviews = feedbackReviews.length > 0 ? feedbackReviews : DEFAULT_FEEDBACK_REVIEWS;

  return (
    <div className="animate-fadeIn">
      <HeroSlider slides={heroSlides} />

      <FeaturesSection features={features} />

      <FeaturedProducts products={products} />

      {/* Why Buy — server-rendered, no client JS */}
      <section className="container py-10 sm:py-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Built for repeat orders and dependable support
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
            The store is designed for straightforward product discovery, cleaner
            reorder flows, and support that understands remote keys.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyBuyCards.map((b: any, i: number) => {
            const WhyBuyIcon = resolveWhyBuyIcon(b, i);
            return (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-panel backdrop-blur"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-dark">
                  <WhyBuyIcon size={22} strokeWidth={2.1} />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {b.title || ""}
                </h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  {b.description || ""}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reviews marquee — server-rendered, pure CSS animation */}
      <section className="container py-10 sm:py-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Trusted by homeowners, workshops, and trade buyers
          </h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
            Real reviews from customers ordering replacement remotes, smart
            keys, and access-control products.
          </p>
        </div>
        <div className="feedback-marquee mt-8" aria-live="polite">
          <div className="feedback-marquee-track">
            {finalReviews.map((r, i) => (
              <div
                key={`${r.author}-${i}`}
                className="w-[min(88vw,22rem)] shrink-0 pr-3 sm:w-[20rem] sm:pr-4 lg:w-[22rem]"
              >
                <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur">
                  <div className="text-sm font-extrabold text-gold">
                    <span className="text-primary">
                      {"★".repeat(r.rating || 5)}
                    </span>
                    <span className="text-neutral-300">
                      {"☆".repeat(5 - (r.rating || 5))}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-neutral-700">
                    &quot;{r.text || ""}&quot;
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <strong className="text-sm font-semibold text-neutral-900">
                      {r.author || ""}
                    </strong>
                    {r.verified && (
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-dark">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — server-rendered */}
      <section className="container py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 p-8 shadow-panel sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {cta.title || "Ready to Find Your Perfect Remote?"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-300 sm:text-base">
              {cta.description || "Browse our collection and find the perfect remote for your needs"}
            </p>
            <Link
              href={cta.buttonPath || "/products/all"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-extrabold text-white shadow-soft hover:bg-primary-dark sm:w-auto"
            >
              {cta.buttonText || "View All Products"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
