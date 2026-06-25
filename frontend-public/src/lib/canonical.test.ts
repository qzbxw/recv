import { describe, expect, it } from "vitest";

import { generateMetadata as businessMetadata } from "@/app/[locale]/business/page";
import { generateMetadata as devMetadata } from "@/app/[locale]/dev/page";
import { generateMetadata as dpaMetadata } from "@/app/[locale]/dpa/page";
import { generateMetadata as merchantMetadata } from "@/app/[locale]/merchant/page";
import {
  generateMetadata as networkMetadata,
  generateStaticParams as networkStaticParams,
} from "@/app/[locale]/networks/[network]/page";
import { generateMetadata as privacyMetadata } from "@/app/[locale]/privacy/page";
import { generateMetadata as statusMetadata } from "@/app/[locale]/status/page";
import { generateMetadata as subprocessorsMetadata } from "@/app/[locale]/subprocessors/page";
import { generateMetadata as termsMetadata } from "@/app/[locale]/terms/page";
import { LOCALES, type Locale } from "@/i18n";

const localizedPages = [
  { route: "business", metadata: businessMetadata },
  { route: "dev", metadata: devMetadata },
  { route: "dpa", metadata: dpaMetadata },
  { route: "merchant", metadata: merchantMetadata },
  { route: "privacy", metadata: privacyMetadata },
  { route: "status", metadata: statusMetadata },
  { route: "subprocessors", metadata: subprocessorsMetadata },
  { route: "terms", metadata: termsMetadata },
] as const;

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

describe("localized canonical metadata", () => {
  it("keeps canonical URLs self-localized for pages that exist in every locale", async () => {
    for (const locale of LOCALES) {
      for (const page of localizedPages) {
        const metadata = await page.metadata(params({ locale }));

        expect(metadata.alternates?.canonical).toBe(`/${locale}/${page.route}`);
      }
    }
  });

  it("pre-renders network detail pages for every public locale", async () => {
    const staticParams = await networkStaticParams();

    for (const locale of LOCALES) {
      expect(staticParams).toContainEqual({ locale, network: "ton" });
      expect(staticParams).toContainEqual({ locale, network: "tron" });
      expect(staticParams).toContainEqual({ locale, network: "solana" });
      expect(staticParams).toContainEqual({ locale, network: "base" });
      expect(staticParams).toContainEqual({ locale, network: "arbitrum" });
      expect(staticParams).toContainEqual({ locale, network: "bsc" });
    }
  });

  it("keeps network detail canonicals self-localized", async () => {
    for (const locale of LOCALES) {
      const metadata = await networkMetadata(params({ locale, network: "ton" }));

      expect(metadata.alternates?.canonical).toBe(`/${locale}/networks/ton`);
      expect(metadata.alternates?.languages).toMatchObject(
        Object.fromEntries(
          LOCALES.map((candidate: Locale) => [
            candidate,
            `/${candidate}/networks/ton`,
          ]),
        ),
      );
    }
  });
});
