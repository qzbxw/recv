import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MultiSelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type MultiSelectProps<T extends string> = {
  values: T[];
  options: Array<MultiSelectOption<T>>;
  onChange: (values: T[]) => void;
  maxSelected?: number;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
};

type MenuRect = { top: number; left: number; width: number; placement: "top" | "bottom" };

export function MultiSelect<T extends string>({
  values,
  options,
  onChange,
  maxSelected,
  ariaLabel,
  placeholder = "Select options...",
  disabled = false,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect>({ top: 0, left: 0, width: 0, placement: "bottom" });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOptions = useMemo(
    () => values.map(v => options.find(opt => opt.value === v)).filter(Boolean) as Array<MultiSelectOption<T>>,
    [options, values]
  );

  function computeRect() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedMenuHeight = Math.min(320, options.length * 48 + 18);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
    setMenuRect({
      top: placement === "bottom" ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      placement,
    });
  }

  useEffect(() => {
    if (!open) return;

    computeRect();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", computeRect);
    window.addEventListener("scroll", computeRect, true);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", computeRect);
      window.removeEventListener("scroll", computeRect, true);
    };
  }, [open, options.length]);

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: menuRect.left,
    width: menuRect.width,
    zIndex: 9999,
    ...(menuRect.placement === "bottom"
      ? { top: menuRect.top }
      : { bottom: window.innerHeight - menuRect.top }),
  };

  const handleToggleOption = (optValue: T) => {
    if (values.includes(optValue)) {
      if (values.length > 1) {
        onChange(values.filter(v => v !== optValue));
      }
    } else {
      const selectionLimit = maxSelected ?? options.length;
      let nextValues = [...values, optValue];
      if (selectionLimit > 0 && nextValues.length > selectionLimit) {
        // If limit exceeded, drop the oldest checked option to maintain max limit
        nextValues = nextValues.slice(-selectionLimit);
      }
      onChange(nextValues);
    }
  };

  const handleRemoveOption = (optValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (values.length > 1) {
      onChange(values.filter(v => v !== optValue));
    }
  };

  return (
    <div ref={rootRef} className={open ? "custom-select is-open" : "custom-select"}>
      <div
        className="custom-select-trigger"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          minHeight: "44px",
          padding: "6px 14px",
          cursor: disabled ? "not-allowed" : "pointer"
        }}
        onClick={() => {
          if (!disabled) setOpen(prev => !prev);
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", flex: "1" }}>
          {selectedOptions.length === 0 ? (
            <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                className="multi-select-tag"
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  color: "#c084fc",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {opt.label}
                {values.length > 1 && (
                  <span
                    onClick={(e) => handleRemoveOption(opt.value, e)}
                    style={{
                      cursor: "pointer",
                      fontSize: "1.2em",
                      fontWeight: "bold",
                      lineHeight: "1",
                      color: "#ff897d",
                      marginLeft: "2px"
                    }}
                  >
                    ×
                  </span>
                )}
              </span>
            ))
          )}
        </div>
        <span className="custom-select-chevron" aria-hidden="true" style={{ alignSelf: "center", marginLeft: "8px" }}>
          v
        </span>
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          className={`custom-select-menu custom-select-menu--${menuRect.placement} is-open`}
          style={menuStyle}
        >
          <ul className="custom-select-options" style={{ maxHeight: "280px", overflowY: "auto" }}>
            {options.map((option) => {
              const active = values.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={active ? "custom-select-option is-active" : "custom-select-option"}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      handleToggleOption(option.value);
                    }}
                    style={{ opacity: option.disabled ? 0.5 : 1, cursor: option.disabled ? "not-allowed" : "pointer" }}
                  >
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{option.label}</strong>
                      {option.hint ? <small style={{ opacity: 0.7, fontSize: "0.75em" }}>{option.hint}</small> : null}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {active ? (
                        <span style={{ color: "#c084fc", fontWeight: "bold" }}>✓</span>
                      ) : (
                        <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>○</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
