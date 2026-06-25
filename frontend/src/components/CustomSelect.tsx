import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type CustomSelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type CustomSelectProps<T extends string> = {
  value: T;
  options: Array<CustomSelectOption<T>>;
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
};

type MenuRect = { top: number; left: number; width: number; placement: "top" | "bottom" };

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  menuPlacement = "auto",
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect>({ top: 0, left: 0, width: 0, placement: "bottom" });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  function computeRect() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedMenuHeight = Math.min(320, options.length * 52 + 18);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" = menuPlacement === "auto"
      ? (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? "top" : "bottom")
      : menuPlacement;
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
      // Don't close if clicking inside the trigger OR inside the portal menu
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div ref={rootRef} className={open ? "custom-select is-open" : "custom-select"}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="custom-select-copy">
          <strong>{selected?.label ?? value}</strong>
          {selected?.hint ? <small>{selected.hint}</small> : null}
        </span>
        <span className="custom-select-chevron" aria-hidden="true">
          v
        </span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className={`custom-select-menu custom-select-menu--${menuRect.placement} is-open`}
          style={menuStyle}
          aria-hidden={false}
        >
          <ul className="custom-select-options" role="listbox" aria-label={ariaLabel}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={active ? "custom-select-option is-active" : "custom-select-option"}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      {option.hint ? <small>{option.hint}</small> : null}
                    </span>
                    {active ? <em>●</em> : null}
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
