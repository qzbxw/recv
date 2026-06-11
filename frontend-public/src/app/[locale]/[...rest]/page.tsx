import { notFound } from "next/navigation";

// Unmatched paths under /en|/ru land here so the locale-aware not-found
// page renders with a real 404 status instead of bubbling out of the
// [locale] root layout.
export default function CatchAllPage() {
  notFound();
}
