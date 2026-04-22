import { notFound } from "next/navigation";
import { getDocBySlug, getAllDocSlugs } from "@/lib/docs";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export async function generateStaticParams() {
  const locales = ["en", "ru"];
  const params: { locale: string; slug: string[] }[] = [];

  for (const locale of locales) {
    const slugs = getAllDocSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export default async function DocPage(props: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await props.params;
  const doc = getDocBySlug(slug, locale);

  if (!doc) {
    notFound();
  }

  return (
    <div className="docs-page">
      <Header language={locale as "ru" | "en"} />
      <main className="docs-container">
        <aside className="docs-sidebar">
          {/* TODO: Implement sidebar navigation */}
          <nav>
            <ul>
              <li>
                <a href={`/${locale}/docs/introduction`}>Introduction</a>
              </li>
            </ul>
          </nav>
        </aside>
        <article className="docs-content">
          <header className="docs-header">
            <h1>{doc.data.title}</h1>
            {doc.data.description && <p>{doc.data.description}</p>}
          </header>
          <div className="prose prose-invert max-w-none">
            <MDXRemote source={doc.content} />
          </div>
        </article>
      </main>
      <Footer language={locale as "ru" | "en"} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .docs-page {
          background: #000;
          color: #fff;
          min-height: 100vh;
        }
        .docs-container {
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          gap: 2rem;
        }
        .docs-sidebar {
          width: 250px;
          flex-shrink: 0;
          border-right: 1px solid #333;
          padding-right: 2rem;
        }
        .docs-content {
          flex-grow: 1;
          min-width: 0;
        }
        .docs-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #333;
          padding-bottom: 1rem;
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: #ccc;
        }
        .prose ul {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style: disc;
        }
      `}} />
    </div>
  );
}
