import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const marketingFiles = [
  "src/i18n/en.ts",
  "src/i18n/ru.ts",
  "src/i18n/plans.en.ts",
  "src/i18n/plans.ru.ts",
  "src/lib/static-pages.ts",
  "src/lib/compare-faq.ts",
];

const forbiddenClaims = [
  /absolutely zero kyc/i,
  /абсолютно без kyc/i,
  /anonymously and globally/i,
  /анонимно и глобально/i,
  /sub-second webhook/i,
  /100% webhook delivery/i,
  /100% доставк[а-я\s]*вебхук/i,
  /99\.9%.*uptime/i,
  /99\.9%.*аптайм/i,
  /faster than 95%/i,
  /1[–-]3% of turnover/i,
  /переменные комиссии \(1[–-]3%\)/i,
  /seven blockchains/i,
  /семь блокчейн/i,
  /zero counterparty risk/i,
  /нулевой риск контрагента/i,
  /100% accuracy/i,
  /100% точност/i,
];

describe("marketing claims", () => {
  it("does not reintroduce unsupported absolute or competitor claims", () => {
    const failures: string[] = [];
    for (const file of marketingFiles) {
      const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      for (const pattern of forbiddenClaims) {
        if (pattern.test(content)) failures.push(`${file}: ${pattern}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
