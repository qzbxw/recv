import { CustomSelect } from "./CustomSelect";
import { SUPPORTED_LANGUAGES, type Language } from "../i18n";

type LanguageSelectProps = {
  value: Language;
  onChange: (language: Language) => void;
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
};

export function LanguageSelect({
  value,
  onChange,
  ariaLabel = "Language",
  className = "",
  compact = false,
}: LanguageSelectProps) {
  const options = SUPPORTED_LANGUAGES.map((language) => ({
    value: language.value,
    label: compact ? language.shortLabel : language.label,
    hint: compact ? language.label : language.shortLabel,
  }));

  return (
    <div className={`language-select${compact ? " language-select--compact" : ""}${className ? ` ${className}` : ""}`}>
      <CustomSelect value={value} options={options} onChange={onChange} ariaLabel={ariaLabel} />
    </div>
  );
}
