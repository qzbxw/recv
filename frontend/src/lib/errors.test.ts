import { describe, expect, it } from "vitest";
import { ApiError, formatApiError, mapApiError } from "./errors";

describe("API error helpers", () => {
  it("keeps API status, message, and raw payload", () => {
    const mapped = mapApiError(new ApiError(403, "Plan blocked", "{\"error\":\"blocked\"}"));

    expect(mapped).toEqual({
      status: 403,
      message: "Plan blocked",
      action: "Check plan access, API key mode, scopes, and account status.",
      raw: "{\"error\":\"blocked\"}",
    });
  });

  it("falls back for generic and unknown errors", () => {
    expect(formatApiError(new Error("Network down"))).toBe("Network down Check your network connection and retry.");
    expect(mapApiError("bad")).toEqual({
      status: 0,
      message: "Request failed.",
      action: "Retry the operation.",
    });
  });

  it("uses server hint for unknown API statuses", () => {
    const mapped = mapApiError(new ApiError(418, ""));
    expect(mapped.status).toBe(418);
    expect(mapped.message).toBe("Reqst could not complete the request.");
  });
});
