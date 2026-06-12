import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoredToken, request, setStoredToken } from "./core";

describe("API token refresh", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shares one refresh across parallel unauthorized requests", async () => {
    setStoredToken("expired-token");
    let refreshCalls = 0;

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get("Authorization");

      if (url.endsWith("/api/auth/refresh")) {
        refreshCalls += 1;
        await Promise.resolve();
        return new Response(JSON.stringify({ token: "fresh-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (authorization === "Bearer fresh-token") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }));

    const responses = await Promise.all([
      request<{ ok: boolean }>("/api/me", {}, "expired-token"),
      request<{ ok: boolean }>("/api/wallets", {}, "expired-token"),
      request<{ ok: boolean }>("/api/invoices", {}, "expired-token"),
    ]);

    expect(responses).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshCalls).toBe(1);
    expect(getStoredToken()).toBe("fresh-token");
  });
});
