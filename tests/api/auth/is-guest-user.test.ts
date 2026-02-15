import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/auth/is-guest-user/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/jsonParse";
import { z } from "zod";

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const isGuestUserSuccessResponseSchema = z.object({
  isGuest: z.boolean(),
});

const isGuestUserErrorResponseSchema = z.object({
  error: z.string(),
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";

describe("GET /api/auth/is-guest-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: ゲストユーザーの場合、trueを返す", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "guest-uuid-123",
        name: "guest_xxxxx",
        isGuest: true,
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.isGuest).toBe(true);
  });

  it("正常系: 通常ユーザーの場合、falseを返す", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        name: "testuser",
        isGuest: false,
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.isGuest).toBe(false);
  });

  it("正常系: isGuestフラグが存在しない場合、falseを返す", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.isGuest).toBe(false);
  });

  it("異常系: 未認証ユーザーは判定できない", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
  });

  it("異常系: セッションにuserが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
  });

  it("異常系: auth関数がエラーを投げる場合", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("Auth failed"));

    const request = new NextRequest(
      "http://localhost:3000/api/auth/is-guest-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      isGuestUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
