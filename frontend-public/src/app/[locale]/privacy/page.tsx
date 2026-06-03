import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | recv",
  description: "Privacy policy and data processing agreement for recv.",
  openGraph: {
    title: "Privacy Policy",
    description: "recv Privacy Policy",
  },
};

export default function Page() {
  return <LegalPage variant="privacy" />;
}
