import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog-posts";
import { getSiteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post not found | ALLREMOTES" };

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      locale: "en_AU",
      siteName: "ALLREMOTES Australia",
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

function ArticleJsonLd({ post }: { post: ReturnType<typeof getBlogPost> }) {
  if (!post) return null;
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    url: articleUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "ALLREMOTES Australia",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/mainlogo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: post.keywords.join(", "),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003C") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003C") }}
      />
    </>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n");

  return (
    <>
      <ArticleJsonLd post={post} />
      <main className="animate-fadeIn">
        <article>
          <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
            <div className="container">
              <nav className="mb-6 text-sm text-neutral-500">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/blog" className="hover:text-primary">Blog</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-900">{post.category}</span>
              </nav>
              <div className="mb-4 flex items-center gap-3 text-sm">
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
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
                {post.excerpt}
              </p>
            </div>
          </section>

          <section className="bg-white py-12 sm:py-16 lg:py-20">
            <div className="container">
              <div className="mx-auto max-w-3xl">
                <div className="space-y-6 text-base leading-8 text-neutral-700 sm:text-lg">
                  {paragraphs.map((para, i) => {
                    const trimmed = para.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith("## ")) {
                      return (
                        <h2 key={i} className="pt-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                          {trimmed.slice(3)}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h3 key={i} className="pt-2 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                          {trimmed.slice(4)}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("- ")) {
                      const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
                      return (
                        <ul key={i} className="list-disc space-y-2 pl-6">
                          {items.map((item, j) => (
                            <li key={j} dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                          ))}
                        </ul>
                      );
                    }
                    if (/^\d+\.\s/.test(trimmed)) {
                      const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l));
                      return (
                        <ol key={i} className="list-decimal space-y-2 pl-6">
                          {items.map((item, j) => (
                            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, "").replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                          ))}
                        </ol>
                      );
                    }
                    return (
                      <p key={i} dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    );
                  })}
                </div>

                <div className="mt-12 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-neutral-900">Need a Replacement Remote?</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Browse our full range of compatible replacement remotes for all major brands.
                    Fast shipping Australia-wide, 12-month warranty, 30-day returns.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/products/garage"
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-dark"
                    >
                      Shop Garage & Gate Remotes
                    </Link>
                    <Link
                      href="/support/which-garage-door-remote-do-i-need"
                      className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-neutral-700 transition hover:border-neutral-400"
                    >
                      Which Remote Do I Need?
                    </Link>
                  </div>
                </div>

                <div className="mt-8">
                  <Link href="/blog" className="font-semibold text-primary hover:underline">
                    ← Back to all guides
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
