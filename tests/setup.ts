import { vi } from "vitest";

type RequestInit = {
  method: string;
  body: string | JsonBody;
  headers: HeadersInit;
};

type ResponseInit = {
  status: number;
};

interface JsonValue {
  [key: string]: string | number | boolean | JsonValue | JsonValue[];
}

type JsonBody = JsonValue;

const DEFAULT_STATUS = 200;
const DEFAULT_REDIRECT_STATUS = 302;
const DEFAULT_METHOD = "GET";
const EMPTY_OBJECT: JsonBody = {};
const EMPTY_STRING = "";
const EMPTY_HEADERS: HeadersInit = {};

function validateJsonBody(parsed: JsonValue): parsed is JsonBody {
  if (typeof parsed !== "object" || parsed === null) {
    return false;
  }
  return !Array.isArray(parsed);
}

function parseJsonBodyInternal(body: string): JsonBody {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsed = JSON.parse(body);
  if (!validateJsonBody(parsed)) {
    return EMPTY_OBJECT;
  }
  return parsed;
}

function parseJsonBody(body: string): JsonBody {
  try {
    return parseJsonBodyInternal(body);
  } catch {
    return EMPTY_OBJECT;
  }
}

vi.mock("next/server", () => ({
  NextRequest: class {
    url: string;
    init: RequestInit;
    bodyData: JsonBody;

    constructor(url: string, init: RequestInit) {
      this.url = url;
      const body = init.body;
      if (typeof body === "string") {
        this.bodyData = parseJsonBody(body);
      } else {
        this.bodyData = body || EMPTY_OBJECT;
      }
      this.init = {
        method: init.method || DEFAULT_METHOD,
        body: typeof body === "string" ? body : EMPTY_STRING,
        headers: init.headers || EMPTY_HEADERS,
      };
    }

    async json(): Promise<JsonBody> {
      return this.bodyData;
    }
  },
  NextResponse: {
    json: (body: JsonBody, init: ResponseInit) => {
      const status = init.status || DEFAULT_STATUS;
      return new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    redirect: (url: string, init: ResponseInit) => {
      const status = init.status || DEFAULT_REDIRECT_STATUS;
      return new Response(EMPTY_STRING, {
        status,
        headers: {
          Location: url,
        },
      });
    },
  },
}));
