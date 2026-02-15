import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/json-parse";
import { z } from "zod";

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const logoutSuccessResponseSchema = z.object({
  message: z.string(),
});

const logoutErrorResponseSchema = z.object({
  error: z.string(),
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

import { auth, signOut } from "@/auth";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: ログイン済みユーザーがログアウトできる", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });
    vi.mocked(signOut).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, logoutSuccessResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.message).toBe("ログアウトしました");
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
  });

  it("異常系: 未認証ユーザーはログアウトできない", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, logoutErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("異常系: signOut関数がエラーを投げる場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-id",
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });
    vi.mocked(signOut).mockRejectedValue(new Error("Sign out failed"));

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, logoutErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
