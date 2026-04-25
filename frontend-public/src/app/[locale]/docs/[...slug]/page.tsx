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
    </div>
  );
}
