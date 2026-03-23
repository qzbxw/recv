import { useEffect, useMemo, useRef, useState } from "react";

export type CustomSelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type CustomSelectProps<T extends string> = {
  value: T;
  options: Array<CustomSelectOption<T>>;
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePlacement() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const estimatedMenuHeight = Math.min(320, options.length * 68 + 18);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPlacement(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    updatePlacement();
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, options.length]);

  return (
    <div ref={rootRef} className={open ? "custom-select is-open" : "custom-select"}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="custom-select-copy">
          <strong>{selected?.label ?? value}</strong>
          {selected?.hint ? <small>{selected.hint}</small> : null}
        </span>
        <span className="custom-select-chevron" aria-hidden="true">
          v
        </span>
      </button>

      <div className={open ? `custom-select-menu custom-select-menu--${placement} is-open` : `custom-select-menu custom-select-menu--${placement}`} aria-hidden={!open}>
        <ul className="custom-select-options" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className={active ? "custom-select-option is-active" : "custom-select-option"}
                  onClick={() => {
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
      </div>
    </div>
  );
}
