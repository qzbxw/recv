import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { formatInvoiceStatus, getInvoiceStatusMeta, type Language } from "../../lib/status";
import type { Invoice } from "../../lib/types";

export function Button({ className = "", variant = "secondary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return <button className={`ui-button ui-button--${variant} ${className}`.trim()} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`ui-input ${className}`.trim()} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`ui-input ui-select ${className}`.trim()} {...props} />;
}

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`.trim()}>{children}</span>;
}

export function StatusPill({ status, language, short = false, className = "" }: { status: Invoice["status"]; language: Language; short?: boolean; className?: string }) {
  const meta = getInvoiceStatusMeta(status);
  return (
    <span className={`status-pill status-${status} ui-status ui-status--${meta.tone} ${className}`.trim()}>
      {formatInvoiceStatus(status, language, short)}
    </span>
  );
}

export function Alert({ children, tone = "danger", className = "" }: { children: ReactNode; tone?: "danger" | "warning" | "success" | "info"; className?: string }) {
  return <div className={`alert ui-alert ui-alert--${tone} ${className}`.trim()}>{children}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="ui-empty">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </div>
  );
}

export function CopyButton({ value, copied, children, onCopy, disabled = false, className = "" }: {
  value: string;
  copied?: boolean;
  children: ReactNode;
  onCopy?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`ui-copy ${copied ? "is-copied" : ""} ${className}`.trim()}
      disabled={disabled}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        onCopy?.();
      }}
    >
      {children}
    </button>
  );
}

export function CodeBlock({ code, onCopy, copied = false }: { code: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="ui-code">
      <button type="button" className="ui-code__copy" onClick={async () => {
        await navigator.clipboard.writeText(code);
        onCopy?.();
      }}>
        {copied ? "Copied" : "Copy"}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="ui-section-header">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, meta, tone = "neutral" }: { label: string; value: ReactNode; meta?: ReactNode; tone?: string }) {
  return (
    <div className={`metric-card ui-metric ui-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </div>
  );
}

