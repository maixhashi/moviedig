import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/auth/current-user/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/json-parse";
import {
  currentUserSuccessResponseSchema,
  currentUserErrorResponseSchema,
} from "@/lib/validation/current-user-response";

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

describe("GET /api/auth/current-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 認証済みユーザーの情報を取得できる", async () => {
    const mockUserId = 1;
    const mockUsername = "testuser";
    const mockCreatedAt = new Date("2024-01-01T00:00:00Z");

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: mockUsername,
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: mockUserId,
      username: mockUsername,
      createdAt: mockCreatedAt,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.id).toBe(mockUserId);
    expect(data.username).toBe(mockUsername);
    expect(data.createdAt).toBe(mockCreatedAt.toISOString());
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  });

  it("異常系: 未認証ユーザーは情報を取得できない", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("異常系: セッションにuserが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("異常系: セッションにuser.idが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("異常系: ユーザーIDが数値に変換できない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "invalid-id",
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("異常系: データベースにユーザーが存在しない場合", async () => {
    const mockUserId = 999;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "nonexistent",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(data.error).toBe("ユーザーが見つかりません");
  });

  it("異常系: データベースエラーが発生した場合", async () => {
    const mockUserId = 1;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      "http://localhost:3000/api/auth/current-user",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      currentUserErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
