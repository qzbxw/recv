import { describe, expect, it } from "vitest";
import { extractFaq, extractToc, slugifyHeading, type StructuredNode } from "./StructuredContent";

const doc = (...content: StructuredNode[]): StructuredNode => ({ type: "doc", content });

const heading = (level: 2 | 3, text: string): StructuredNode => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

describe("slugifyHeading", () => {
  it("builds stable anchors for latin and cyrillic headings", () => {
    expect(slugifyHeading("Webhook signature checks!")).toBe("webhook-signature-checks");
    expect(slugifyHeading("Проверка подписи вебхука")).toBe("проверка-подписи-вебхука");
  });
});

describe("extractToc", () => {
  it("collects H2/H3 entries and deduplicates repeated titles", () => {
    const toc = extractToc(doc(
      heading(2, "Setup"),
      heading(3, "Install"),
      heading(2, "Setup"),
      { type: "paragraph", content: [{ type: "text", text: "body" }] },
    ));
    expect(toc).toEqual([
      { id: "setup", text: "Setup", level: 2 },
      { id: "install", text: "Install", level: 3 },
      { id: "setup-2", text: "Setup", level: 2 },
    ]);
  });

  it("ignores empty headings", () => {
    expect(extractToc(doc({ type: "heading", attrs: { level: 2 }, content: [] }))).toEqual([]);
  });
});

describe("extractFaq", () => {
  it("flattens question/answer pairs to plain text", () => {
    const faq = extractFaq(doc({
      type: "faqList",
      content: [
        {
          type: "faqItem",
          content: [
            { type: "faqQuestion", content: [{ type: "text", text: "Is recv custodial?" }] },
            {
              type: "faqAnswer",
              content: [{ type: "paragraph", content: [{ type: "text", text: "No, payouts go " }, { type: "text", text: "directly to your wallet.", marks: [{ type: "bold" }] }] }],
            },
          ],
        },
      ],
    }));
    expect(faq).toEqual([
      { question: "Is recv custodial?", answer: "No, payouts go directly to your wallet." },
    ]);
  });

  it("returns nothing for documents without FAQ blocks", () => {
    expect(extractFaq(doc(heading(2, "Setup")))).toEqual([]);
  });
});
