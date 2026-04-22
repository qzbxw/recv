import { describe, expect, it, vi } from "vitest";
import { buildAppPath, buildAuthHref, buildCheckoutPath, buildCheckoutUrl, sanitizeNextPath } from "./routing";

describe("routing helpers", () => {
  it("builds app and checkout paths under the /app namespace", () => {
    expect(buildAppPath("console")).toBe("/app/console");
    expect(buildAppPath("/console")).toBe("/app/console");
    expect(buildCheckoutPath("invoice/with space")).toBe("/app/checkout/invoice%2Fwith%20space");
  });

  it("builds absolute checkout URLs in a browser context", () => {
    vi.stubGlobal("window", { location: { origin: "https://reqst.test" } });
    expect(buildCheckoutUrl("REQST-1")).toBe("https://reqst.test/app/checkout/REQST-1");
    vi.unstubAllGlobals();
  });

  it("sanitizes next paths and rejects open redirects", () => {
    expect(sanitizeNextPath("/console?tab=invoices")).toBe("/console?tab=invoices");
    expect(sanitizeNextPath("https://evil.test")).toBeNull();
    expect(sanitizeNextPath("//evil.test/path")).toBeNull();
    expect(sanitizeNextPath("   ")).toBeNull();
  });

  it("encodes auth next paths", () => {
    expect(buildAuthHref("/console?tab=invoices")).toBe("/auth?next=%2Fconsole%3Ftab%3Dinvoices");
  });
});
