export type ApiErrorHint = {
  status: number;
  message: string;
  action: string;
  raw?: string;
};

export class ApiError extends Error {
  status: number;
  raw?: string;

  constructor(status: number, message: string, raw?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.raw = raw;
  }
}

const STATUS_HINTS: Record<number, { message: string; action: string }> = {
  400: {
    message: "The request could not be accepted.",
    action: "Check required fields, amount format, network, wallet address, and expiration time.",
  },
  401: {
    message: "Authentication is missing or expired.",
    action: "Sign in again or use a valid Bearer API key.",
  },
  403: {
    message: "Your current plan or key does not allow this action.",
    action: "Check plan access, API key mode, scopes, and account status.",
  },
  404: {
    message: "The requested resource was not found.",
    action: "Verify the id, public checkout link, endpoint, or delivery still exists.",
  },
  409: {
    message: "This request conflicts with an existing resource.",
    action: "Use a unique value or retry with the original idempotency request body.",
  },
  429: {
    message: "Rate limit or monthly quota reached.",
    action: "Wait for the limit window to reset or upgrade the API plan.",
  },
  500: {
    message: "recv could not complete the request.",
    action: "Retry shortly. If it keeps failing, contact support with the time and operation.",
  },
};

export function mapApiError(error: unknown): ApiErrorHint {
  if (error instanceof ApiError) {
    const hint = STATUS_HINTS[error.status] ?? STATUS_HINTS[500];
    return {
      status: error.status,
      message: error.message || hint.message,
      action: hint.action,
      raw: error.raw,
    };
  }
  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
      action: "Check your network connection and retry.",
    };
  }
  return {
    status: 0,
    message: "Request failed.",
    action: "Retry the operation.",
  };
}

export function formatApiError(error: unknown) {
  const mapped = mapApiError(error);
  const isDev = import.meta.env.DEV || import.meta.env.MODE === "test";
  if (isDev) {
    return `${mapped.message} ${mapped.action}`.trim();
  }
  return mapped.message;
}

