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

vi.mock("next/server", () => ({
  NextRequest: class {
    url: string;
    init: RequestInit;
    bodyData: JsonBody;

    constructor(url: string, init: RequestInit) {
      this.url = url;
      const body = init.body;
      if (typeof body === "string") {
        try {
          this.bodyData = JSON.parse(body) as JsonBody;
        } catch {
          this.bodyData = EMPTY_OBJECT;
        }
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
