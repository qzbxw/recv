import Link from "next/link";
import type { ReactNode } from "react";
import { LightboxImage } from "./LightboxImage";
import { LazyYouTube } from "./LazyYouTube";

// Renderer for TipTap structured documents (content_version 2). The node
// set mirrors the backend whitelist in admin_blog_structured.go — anything
// else was rejected at save time, so unknown nodes are silently skipped.

export type StructuredNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: StructuredNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

const CTA_COPY: Record<string, Record<"en" | "ru", { title: string; body: string; cta: string; href: string }>> = {
  checkout: {
    en: { title: "Accept crypto with recv Checkout", body: "Hosted payment pages with direct-to-wallet payouts and no turnover fees.", cta: "Explore Checkout", href: "/products/checkout" },
    ru: { title: "Принимайте криптовалюту с recv Checkout", body: "Готовые платёжные страницы с выплатами напрямую на ваш кошелёк без комиссий с оборота.", cta: "Подробнее о Checkout", href: "/products/checkout" },
  },
  api: {
    en: { title: "Build on the recv Payments API", body: "Create invoices, watch confirmations and receive signed webhooks from your own backend.", cta: "Explore the API", href: "/products/api" },
    ru: { title: "Стройте на recv Payments API", body: "Создавайте инвойсы, отслеживайте подтверждения и получайте подписанные вебхуки из своего бэкенда.", cta: "Подробнее об API", href: "/products/api" },
  },
  invoicing: {
    en: { title: "Send crypto invoices in seconds", body: "Shareable invoice links with automatic status tracking across networks.", cta: "Explore Invoicing", href: "/products/invoicing" },
    ru: { title: "Выставляйте крипто-инвойсы за секунды", body: "Ссылки на инвойсы с автоматическим отслеживанием статуса в разных сетях.", cta: "Подробнее об Invoicing", href: "/products/invoicing" },
  },
  mcp: {
    en: { title: "Let AI agents take payments", body: "The recv MCP server gives your agents safe, scoped access to payments.", cta: "Explore MCP", href: "/products/mcp" },
    ru: { title: "Платежи для AI-агентов", body: "MCP-сервер recv даёт агентам безопасный доступ к платежам с ограниченными правами.", cta: "Подробнее о MCP", href: "/products/mcp" },
  },
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function nodeText(node: StructuredNode): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(nodeText).join("");
}

export type TocEntry = { id: string; text: string; level: 2 | 3 };

export function extractToc(doc: StructuredNode): TocEntry[] {
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();
  for (const node of doc.content ?? []) {
    if (node.type !== "heading") continue;
    const level = Number(node.attrs?.level) === 3 ? 3 : 2;
    const text = nodeText(node);
    if (!text) continue;
    let id = slugifyHeading(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    entries.push({ id, text, level });
  }
  return entries;
}

export function extractFaq(doc: StructuredNode): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const walk = (node: StructuredNode) => {
    if (node.type === "faqItem") {
      const question = node.content?.find((child) => child.type === "faqQuestion");
      const answer = node.content?.find((child) => child.type === "faqAnswer");
      if (question && answer) {
        faqs.push({ question: nodeText(question), answer: nodeText(answer) });
      }
    }
    node.content?.forEach(walk);
  };
  walk(doc);
  return faqs;
}

function renderMarks(node: StructuredNode, language: "ru" | "en"): ReactNode {
  let element: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        element = <strong>{element}</strong>;
        break;
      case "italic":
        element = <em>{element}</em>;
        break;
      case "strike":
        element = <s>{element}</s>;
        break;
      case "underline":
        element = <u>{element}</u>;
        break;
      case "code":
        element = <code className="px-1.5 py-0.5 rounded bg-white/10 text-[0.9em]">{element}</code>;
        break;
      case "link": {
        const href = String(mark.attrs?.href ?? "");
        const isInternal = href.startsWith("/");
        element = isInternal ? (
          <Link href={href} className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">{element}</Link>
        ) : (
          <a href={href} rel="noopener noreferrer" target="_blank" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">{element}</a>
        );
        break;
      }
    }
  }
  return element;
}

function renderChildren(nodes: StructuredNode[] | undefined, language: "ru" | "en", headingIds: Map<StructuredNode, string>): ReactNode {
  return (nodes ?? []).map((child, index) => (
    <StructuredNodeView key={index} node={child} language={language} headingIds={headingIds} />
  ));
}

function StructuredNodeView({ node, language, headingIds }: { node: StructuredNode; language: "ru" | "en"; headingIds: Map<StructuredNode, string> }) {
  switch (node.type) {
    case "text":
      return <>{renderMarks(node, language)}</>;
    case "paragraph":
      return <p className="my-5 text-white/70 leading-relaxed">{renderChildren(node.content, language, headingIds)}</p>;
    case "heading": {
      const id = headingIds.get(node);
      if (Number(node.attrs?.level) === 3) {
        return <h3 id={id} className="text-xl md:text-2xl font-bold tracking-tight mt-10 mb-4 text-white/90 scroll-mt-32">{renderChildren(node.content, language, headingIds)}</h3>;
      }
      return <h2 id={id} className="text-2xl md:text-3xl font-bold tracking-tight mt-14 mb-5 text-white scroll-mt-32">{renderChildren(node.content, language, headingIds)}</h2>;
    }
    case "bulletList":
      return <ul className="my-5 space-y-2 list-disc pl-6 text-white/70 marker:text-accent">{renderChildren(node.content, language, headingIds)}</ul>;
    case "orderedList":
      return <ol className="my-5 space-y-2 list-decimal pl-6 text-white/70 marker:text-accent">{renderChildren(node.content, language, headingIds)}</ol>;
    case "listItem":
      return <li className="[&>p]:my-1">{renderChildren(node.content, language, headingIds)}</li>;
    case "blockquote":
      return <blockquote className="my-6 border-l-2 border-accent/60 pl-5 italic text-white/60">{renderChildren(node.content, language, headingIds)}</blockquote>;
    case "codeBlock":
      return (
        <pre className="my-6 p-5 rounded-2xl bg-black/60 border border-white/10 overflow-x-auto text-sm leading-relaxed">
          <code>{nodeText(node)}</code>
        </pre>
      );
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr className="my-10 border-white/10" />;
    case "image": {
      const src = String(node.attrs?.src ?? "");
      const alt = String(node.attrs?.alt ?? "");
      const width = Number(node.attrs?.width) || 0;
      const height = Number(node.attrs?.height) || 0;
      if (!src) return null;
      return <LightboxImage src={src} alt={alt} width={width} height={height} />;
    }
    case "youtube": {
      const src = String(node.attrs?.src ?? "");
      if (!src) return null;
      return <LazyYouTube src={src} language={language} />;
    }
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <tbody>{renderChildren(node.content, language, headingIds)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr className="border-b border-white/5 last:border-0">{renderChildren(node.content, language, headingIds)}</tr>;
    case "tableHeader":
      return <th className="px-4 py-3 bg-white/[0.04] font-semibold text-white/85 [&>p]:my-0">{renderChildren(node.content, language, headingIds)}</th>;
    case "tableCell":
      return <td className="px-4 py-3 text-white/65 align-top [&>p]:my-0">{renderChildren(node.content, language, headingIds)}</td>;
    case "callout": {
      const variant = String(node.attrs?.variant ?? "info");
      const styles: Record<string, string> = {
        info: "border-accent/40 bg-accent/[0.07]",
        warning: "border-amber-400/40 bg-amber-400/[0.06]",
        tip: "border-emerald-400/40 bg-emerald-400/[0.06]",
      };
      const labels: Record<string, Record<"en" | "ru", string>> = {
        info: { en: "Note", ru: "Примечание" },
        warning: { en: "Warning", ru: "Внимание" },
        tip: { en: "Tip", ru: "Совет" },
      };
      return (
        <aside className={`my-6 rounded-2xl border border-l-4 px-5 py-4 ${styles[variant] ?? styles.info}`}>
          <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-white/50 mb-1">{labels[variant]?.[language] ?? labels.info[language]}</span>
          <div className="[&>p]:my-2 text-white/75">{renderChildren(node.content, language, headingIds)}</div>
        </aside>
      );
    }
    case "faqList":
      return <section className="my-10">{renderChildren(node.content, language, headingIds)}</section>;
    case "faqItem":
      return <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5">{renderChildren(node.content, language, headingIds)}</div>;
    case "faqQuestion":
      return <h3 className="text-lg md:text-xl font-bold text-white mb-3">{renderChildren(node.content, language, headingIds)}</h3>;
    case "faqAnswer":
      return <div className="text-white/65 [&>p]:my-2">{renderChildren(node.content, language, headingIds)}</div>;
    case "ctaBlock": {
      const service = String(node.attrs?.service ?? "checkout");
      const copy = CTA_COPY[service]?.[language] ?? CTA_COPY.checkout[language];
      const title = String(node.attrs?.title || "") || copy.title;
      const body = String(node.attrs?.body || "") || copy.body;
      return (
        <aside className="my-8 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/15 to-accent/[0.03] px-7 py-6">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/60 mb-4">{body}</p>
          <Link href={`/${language}${copy.href}`} className="lend-secondary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold">
            {copy.cta}
            <span aria-hidden>→</span>
          </Link>
        </aside>
      );
    }
    default:
      return null;
  }
}

export function StructuredContent({ doc, language }: { doc: StructuredNode; language: "ru" | "en" }) {
  // Heading ids must match the TOC: recompute with the same slugger and
  // associate ids by node identity for stable anchors.
  const headingIds = new Map<StructuredNode, string>();
  const seen = new Map<string, number>();
  for (const node of doc.content ?? []) {
    if (node.type !== "heading") continue;
    const text = nodeText(node);
    if (!text) continue;
    let id = slugifyHeading(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    headingIds.set(node, id);
  }

  return <div className="blog-structured">{renderChildren(doc.content, language, headingIds)}</div>;
}

export function TableOfContents({ entries, language }: { entries: TocEntry[]; language: "ru" | "en" }) {
  if (entries.length < 2) return null;
  return (
    <nav aria-label={language === "ru" ? "Оглавление" : "Table of contents"} className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5">
      <span className="block text-[11px] font-bold tracking-[0.25em] uppercase text-white/40 mb-3">
        {language === "ru" ? "Содержание" : "On this page"}
      </span>
      <ol className="space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
            <a href={`#${entry.id}`} className="text-sm text-white/60 hover:text-accent transition-colors">
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
