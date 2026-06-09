import { useCallback, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { Callout, FaqList, FaqItem, FaqQuestion, FaqAnswer, CtaBlock, CALLOUT_VARIANTS, CTA_SERVICES, type CalloutVariant, type CtaService } from "./tiptapExtensions";
import { MediaLibraryModal } from "./MediaLibraryModal";
import type { AdminMedia } from "../../lib/types";

// Frequently linked internal sections, offered when inserting a link.
const INTERNAL_LINK_SUGGESTIONS = [
  "/en/products/checkout",
  "/en/products/api",
  "/en/products/invoicing",
  "/en/products/mcp",
  "/en/pricing",
  "/en/networks/ton",
  "/en/networks/tron",
  "/en/docs/quickstart",
  "/en/docs/webhooks",
  "/en/blog",
];

// Strips Word/Google-Docs/AI-chat artifacts from pasted markup before
// ProseMirror parses it: inline styles, vendor tags and classes, comments,
// tracking attributes and font tags.
function cleanPastedHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("meta, style, script, link, o\\:p, xml").forEach((el) => el.remove());

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const comments: Node[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) comments.push(node);
  comments.forEach((node) => node.parentNode?.removeChild(node));

  doc.body.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("lang");
    el.removeAttribute("dir");
    el.removeAttribute("id");
    const className = el.getAttribute("class") || "";
    if (/Mso|docs-internal|gmail/i.test(className)) {
      el.removeAttribute("class");
    }
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-") || attr.name.startsWith("aria-") || attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  doc.body.querySelectorAll("font").forEach((font) => {
    const span = doc.createElement("span");
    span.innerHTML = font.innerHTML;
    font.replaceWith(span);
  });

  return doc.body.innerHTML;
}

export default function TipTapEditor({
  token,
  initialContent,
  onChange,
}: {
  token: string;
  // TipTap JSON document, or an HTML string converted from legacy Markdown.
  initialContent: JSONContent | string;
  onChange: (doc: JSONContent) => void;
}) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [calloutVariant, setCalloutVariant] = useState<CalloutVariant>("info");
  const [ctaService, setCtaService] = useState<CtaService>("checkout");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
        },
      }),
      Image.configure({ inline: false }),
      TableKit.configure({ table: { resizable: false } }),
      Youtube.configure({ nocookie: true, width: 0, height: 0 }),
      Placeholder.configure({ placeholder: "Write the article…" }),
      Callout,
      FaqList,
      FaqItem,
      FaqQuestion,
      FaqAnswer,
      CtaBlock,
    ],
    content: initialContent,
    editorProps: {
      transformPastedHTML: cleanPastedHTML,
      attributes: { class: "admin-tiptap__content" },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getJSON());
    },
  });

  const insertImage = useCallback(
    (media: AdminMedia) => {
      editor
        ?.chain()
        .focus()
        .setImage({ src: media.url, alt: media.alt_text, title: media.original_name })
        .run();
      setShowMediaLibrary(false);
    },
    [editor],
  );

  const insertLink = useCallback(() => {
    if (!editor) return;
    const previous = (editor.getAttributes("link").href as string) || "";
    const url = window.prompt(
      `Link URL (internal paths start with /; suggestions:\n${INTERNAL_LINK_SUGGESTIONS.join("\n")})`,
      previous,
    );
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|\/|mailto:)/.test(trimmed)) {
      window.alert("Links must be internal (/path), https://, http:// or mailto:.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("YouTube video URL:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url.trim() });
  }, [editor]);

  if (!editor) {
    return <div className="dev-portal__empty-large">Loading editor…</div>;
  }

  const button = (label: string, action: () => void, active = false, title = label) => (
    <button
      type="button"
      className={`admin-tiptap__btn${active ? " admin-tiptap__btn--active" : ""}`}
      onClick={action}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-tiptap">
      <div className="admin-tiptap__toolbar">
        {button("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {button("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        <span className="admin-tiptap__divider" />
        {button("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold")}
        {button("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic")}
        {button("Code", () => editor.chain().focus().toggleCode().run(), editor.isActive("code"), "Inline code")}
        <span className="admin-tiptap__divider" />
        {button("• List", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {button("1. List", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {button("Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {button("Code block", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        <span className="admin-tiptap__divider" />
        {button("Link", insertLink, editor.isActive("link"))}
        {button("Image", () => setShowMediaLibrary(true))}
        {button("Video", insertVideo)}
        <span className="admin-tiptap__divider" />
        {button("Table", () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), editor.isActive("table"))}
        {editor.isActive("table") && (
          <>
            {button("+Row", () => editor.chain().focus().addRowAfter().run())}
            {button("+Col", () => editor.chain().focus().addColumnAfter().run())}
            {button("Del table", () => editor.chain().focus().deleteTable().run())}
          </>
        )}
        <span className="admin-tiptap__divider" />
        <select
          className="admin-tiptap__select"
          value={calloutVariant}
          onChange={(e) => setCalloutVariant(e.target.value as CalloutVariant)}
          aria-label="Callout variant"
        >
          {CALLOUT_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>{variant}</option>
          ))}
        </select>
        {button("Callout", () => editor.chain().focus().toggleCallout(calloutVariant).run(), editor.isActive("callout"))}
        {button("FAQ", () => editor.chain().focus().insertFaqItem().run(), editor.isActive("faqList"))}
        <select
          className="admin-tiptap__select"
          value={ctaService}
          onChange={(e) => setCtaService(e.target.value as CtaService)}
          aria-label="CTA service"
        >
          {CTA_SERVICES.map((service) => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>
        {button("CTA", () => editor.chain().focus().insertCtaBlock(ctaService).run(), editor.isActive("ctaBlock"))}
      </div>

      <EditorContent editor={editor} />

      {showMediaLibrary && (
        <MediaLibraryModal token={token} onSelect={insertImage} onClose={() => setShowMediaLibrary(false)} />
      )}
    </div>
  );
}
