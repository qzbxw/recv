import { Metadata } from "next";
import { BlogIndexClient, type BlogPostSummary } from "@/components/blog/BlogIndexClient";
import { getPublishedBlogPosts } from "@/lib/blog";
import { FALLBACK_BLOG_POSTS } from "@/lib/blog-articles";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const description = metadataDescription(language,
    language === "ru"
      ? "Технические разборы и обновления инфраструктуры криптоплатежей recv."
      : "Insights, technical deep-dives, and updates on crypto payments infrastructure.");
  return {
    title: language === "ru" ? "Блог | recv" : "Blog | recv",
    description,
    alternates: {
      canonical: `/${language}/blog`,
      languages: languageAlternates("/blog"),
    },
    openGraph: {
      title: language === "ru" ? "Блог | recv" : "Blog | recv",
      description,
      images: socialImages(language, language === "ru" ? "Блог recv" : "recv Blog", language === "ru" ? "Блог" : "Blog"),
    },
  };
}

export default async function BlogIndex(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const posts = (await getPublishedBlogPosts(language)).filter((post) => post.slug) as BlogPostSummary[];
  const visiblePosts = posts.length > 0
    ? posts
    : FALLBACK_BLOG_POSTS[language] as BlogPostSummary[];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: language === "ru" ? "Главная" : "Home", href: `/${language}` },
          { name: language === "ru" ? "Блог" : "Blog", href: `/${language}/blog` },
        ]}
      />
      <BlogIndexClient language={language} posts={visiblePosts} />
    </>
  );
}
