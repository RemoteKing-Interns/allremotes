import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Garage Door Remote Guides & Troubleshooting | ALLREMOTES Blog",
  description:
    "Step-by-step programming guides, troubleshooting tips, and buying advice for garage door remotes, gate remotes and access control products. Learn from Australia's remote specialists.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Garage Door Remote Guides & Troubleshooting | ALLREMOTES Blog",
    description:
      "Step-by-step programming guides, troubleshooting tips, and buying advice for garage door remotes, gate remotes and access control products.",
    type: "website",
    locale: "en_AU",
    siteName: "ALLREMOTES Australia",
    url: "/blog",
  },
};

function BlogJsonLd() {
  const siteUrl = getSiteUrl();
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "ALLREMOTES Blog",
    url: `${siteUrl}/blog`,
    description:
      "Step-by-step programming guides, troubleshooting tips, and buying advice for garage door remotes and gate remotes.",
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.date,
      author: { "@type": "Organization", name: post.author },
      publisher: {
        "@type": "Organization",
        name: "ALLREMOTES Australia",
        logo: { "@type": "ImageObject", url: `${siteUrl}/images/mainlogo.png` },
      },
      description: post.metaDescription,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema).replace(/</g, "\\u003C") }}
    />
  );
}

export default function BlogIndexPage() {
  return (
    <>
      <BlogJsonLd />
      <main className="animate-fadeIn">
        <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
          <div className="container">
            <nav className="mb-6 text-sm text-neutral-500">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900">Blog</span>
            </nav>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Garage Door Remote Guides & Troubleshooting
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
              Step-by-step programming guides, troubleshooting tips, and expert advice for replacing and
              programming your garage door and gate remotes.
            </p>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-4xl space-y-10">
              {BLOG_POSTS.map((post) => (
                <article key={post.slug} className="border-b border-neutral-200 pb-10 last:border-0">
                  <div className="mb-3 flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent">
                      {post.category}
                    </span>
                    <time className="text-neutral-500">
                      {new Date(post.date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-4 text-base leading-8 text-neutral-600">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Read full guide →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
