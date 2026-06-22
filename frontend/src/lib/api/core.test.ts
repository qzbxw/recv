import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoredAdminToken, getStoredToken, request, setStoredAdminRefreshToken, setStoredToken } from "./core";

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

  it("uses the stored admin refresh token when the refresh cookie is unavailable", async () => {
    setStoredAdminRefreshToken("admin-refresh-token");
    let refreshBody = "";

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get("Authorization");

      if (url.endsWith("/api/admin/refresh")) {
        refreshBody = String(init?.body || "");
        return new Response(JSON.stringify({ token: "fresh-admin-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (authorization === "Bearer fresh-admin-token") {
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

    const response = await request<{ ok: boolean }>("/api/admin/ops/overview", {}, "expired-admin-token");

    expect(response).toEqual({ ok: true });
    expect(JSON.parse(refreshBody)).toEqual({ refresh_token: "admin-refresh-token" });
    expect(getStoredAdminToken()).toBe("fresh-admin-token");
  });
});
