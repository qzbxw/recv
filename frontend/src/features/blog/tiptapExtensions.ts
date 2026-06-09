import { Node, mergeAttributes } from "@tiptap/core";

export const CALLOUT_VARIANTS = ["info", "warning", "tip"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const CTA_SERVICES = ["checkout", "api", "invoicing", "mcp"] as const;
export type CtaService = (typeof CTA_SERVICES)[number];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: (variant: CalloutVariant) => ReturnType;
    };
    faq: {
      insertFaqItem: () => ReturnType;
    };
    ctaBlock: {
      insertCtaBlock: (service: CtaService) => ReturnType;
    };
  }
}

// Highlighted aside (info / warning / tip) holding arbitrary block content.
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info" as CalloutVariant,
        parseHTML: (element) => {
          const value = element.getAttribute("data-variant");
          return CALLOUT_VARIANTS.includes(value as CalloutVariant) ? value : "info";
        },
        renderHTML: (attributes) => ({ "data-variant": attributes.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { "data-callout": "", class: "blog-callout" }), 0];
  },

  addCommands() {
    return {
      toggleCallout:
        (variant) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
    };
  },
});

// FAQ block: a list of question/answer pairs. The public renderer turns it
// into a visible accordion plus FAQPage structured data.
export const FaqList = Node.create({
  name: "faqList",
  group: "block",
  content: "faqItem+",
  defining: true,

  parseHTML() {
    return [{ tag: "section[data-faq-list]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["section", mergeAttributes(HTMLAttributes, { "data-faq-list": "", class: "blog-faq" }), 0];
  },
});

export const FaqItem = Node.create({
  name: "faqItem",
  content: "faqQuestion faqAnswer",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-faq-item]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-faq-item": "", class: "blog-faq__item" }), 0];
  },

  addCommands() {
    return {
      insertFaqItem:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: "faqList",
            content: [
              {
                type: "faqItem",
                content: [
                  { type: "faqQuestion", content: [] },
                  { type: "faqAnswer", content: [{ type: "paragraph" }] },
                ],
              },
            ],
          }),
    };
  },
});

export const FaqQuestion = Node.create({
  name: "faqQuestion",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "h3[data-faq-question]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["h3", mergeAttributes(HTMLAttributes, { "data-faq-question": "", class: "blog-faq__question" }), 0];
  },
});

export const FaqAnswer = Node.create({
  name: "faqAnswer",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-faq-answer]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-faq-answer": "", class: "blog-faq__answer" }), 0];
  },
});

// Service CTA card. An atom: all presentation lives in the renderer, the
// document only stores which product is promoted and optional overrides.
export const CtaBlock = Node.create({
  name: "ctaBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      service: {
        default: "checkout" as CtaService,
        parseHTML: (element) => {
          const value = element.getAttribute("data-service");
          return CTA_SERVICES.includes(value as CtaService) ? value : "checkout";
        },
        renderHTML: (attributes) => ({ "data-service": attributes.service }),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title") ?? "",
        renderHTML: (attributes) => (attributes.title ? { "data-title": attributes.title } : {}),
      },
      body: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-body") ?? "",
        renderHTML: (attributes) => (attributes.body ? { "data-body": attributes.body } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-cta-block]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const service = (node.attrs.service as string) || "checkout";
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-cta-block": "", class: "blog-cta" }),
      ["strong", {}, (node.attrs.title as string) || `recv ${service}`],
    ];
  },

  addCommands() {
    return {
      insertCtaBlock:
        (service) =>
        ({ commands }) =>
          commands.insertContent({ type: "ctaBlock", attrs: { service } }),
    };
  },
});
