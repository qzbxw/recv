import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | recv",
  description: "Terms of Service and End-User License Agreement.",
  openGraph: {
    title: "Terms of Service",
    description: "recv Terms of Service",
  },
};

export default function Page() {
  return <LegalPage variant="terms" />;
}
