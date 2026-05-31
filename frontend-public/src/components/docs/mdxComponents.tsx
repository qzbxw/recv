import Link from "next/link";
import type { ComponentProps } from "react";

function slugify(children: React.ReactNode): string {
  const text = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
  return text.toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").replace(/^-+|-+$/g, "");
}

function Anchor({ href = "", ...props }: ComponentProps<"a">) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const cls = "text-accent font-medium underline decoration-accent/30 underline-offset-4 hover:decoration-accent transition-colors";
  if (isInternal) {
    return <Link href={href} className={cls} {...(props as Omit<ComponentProps<typeof Link>, "href">)} />;
  }
  return <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} {...props} />;
}

export const docsMdxComponents = {
  h1: (props: ComponentProps<"h1">) => <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-6 text-white" {...props} />,
  h2: ({ children, ...props }: ComponentProps<"h2">) => (
    <h2 id={slugify(children)} className="text-2xl md:text-3xl font-bold tracking-tight mt-14 mb-5 pt-2 text-white scroll-mt-32 border-t border-white/5 first:border-0 first:mt-0 first:pt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<"h3">) => (
    <h3 id={slugify(children)} className="text-xl md:text-2xl font-bold tracking-tight mt-10 mb-4 text-white/90 scroll-mt-32" {...props}>
      {children}
    </h3>
  ),
  p: (props: ComponentProps<"p">) => <p className="text-base md:text-[1.0625rem] leading-[1.8] text-white/60 mb-6" {...props} />,
  a: Anchor,
  ul: (props: ComponentProps<"ul">) => <ul className="space-y-3 mb-6" {...props} />,
  ol: (props: ComponentProps<"ol">) => <ol className="list-decimal space-y-3 mb-6 pl-6 text-white/60 marker:text-accent/60 marker:font-bold" {...props} />,
  li: (props: ComponentProps<"li">) => (
    <li className="text-base md:text-[1.0625rem] leading-[1.7] text-white/60 relative pl-6 [&>ul]:mt-3 [&_strong]:text-white/90 before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent/50" {...props} />
  ),
  strong: (props: ComponentProps<"strong">) => <strong className="font-bold text-white/90" {...props} />,
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="border-l-2 border-accent/40 pl-6 py-1 my-8 text-white/70 italic [&>p]:mb-0" {...props} />
  ),
  code: (props: ComponentProps<"code">) => {
    const isBlock = (props.className || "").includes("language-");
    if (isBlock) return <code className="block text-sm leading-relaxed font-mono" {...props} />;
    return <code className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-accent text-[0.875em] font-mono whitespace-nowrap" {...props} />;
  },
  pre: (props: ComponentProps<"pre">) => (
    <pre className="rounded-2xl bg-[#0a0a0c] border border-white/10 p-5 md:p-6 overflow-x-auto my-8 text-white/80 [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-white/80" {...props} />
  ),
  hr: () => <hr className="border-white/10 my-12" />,
  table: (props: ComponentProps<"table">) => (
    <div className="overflow-x-auto my-8 rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props: ComponentProps<"th">) => <th className="px-5 py-3 bg-white/[0.03] font-bold text-white/80 border-b border-white/10 text-xs uppercase tracking-wider" {...props} />,
  td: (props: ComponentProps<"td">) => <td className="px-5 py-3 text-white/60 border-b border-white/5" {...props} />,
};
