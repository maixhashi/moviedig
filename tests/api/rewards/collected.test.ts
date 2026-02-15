import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/rewards/collected/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/jsonParse";
import {
  collectedRewardsSuccessResponseSchema,
  collectedRewardsErrorResponseSchema,
} from "@/lib/validation/collectedRewardsResponse";

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
} as const;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    collectedReward: {
      findMany: vi.fn(),
    },
    rewardImage: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

describe("GET /api/rewards/collected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 収集済み報酬一覧を取得できる", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 123;
    const mockCollectedAt = new Date("2024-01-01T00:00:00Z");

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.collectedReward.findMany).mockResolvedValue([
      {
        id: 1,
        userId: mockUserId,
        moviePosterId: mockMoviePosterId,
        collectedAt: mockCollectedAt,
        moviePoster: {
          id: mockMoviePosterId,
          tmdbId: "tmdb-123",
          title: "Test Movie",
          posterUrl: "https://example.com/poster.jpg",
        },
      },
    ]);

    vi.mocked(prisma.rewardImage.findMany).mockResolvedValue([
      {
        id: 1,
        tmdbId: "tmdb-123",
        title: "Test Movie",
        posterUrl: "https://example.com/reward.jpg",
        moviePosterId: mockMoviePosterId,
      },
    ]);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(1);
    expect(data[0].collectedAt).toBe(mockCollectedAt.toISOString());
    expect(data[0].moviePoster.id).toBe(mockMoviePosterId);
    expect(data[0].moviePoster.title).toBe("Test Movie");
    expect(data[0].rewardImage).not.toBeNull();
    if (data[0].rewardImage) {
      expect(data[0].rewardImage.moviePosterId).toBe(mockMoviePosterId);
    }
    expect(prisma.collectedReward.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
      },
      include: {
        moviePoster: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            posterUrl: true,
          },
        },
      },
      orderBy: {
        collectedAt: "desc",
      },
    });
  });

  it("正常系: 空のリストを返す", async () => {
    const mockUserId = 1;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.collectedReward.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.length).toBe(0);
    expect(prisma.rewardImage.findMany).not.toHaveBeenCalled();
  });

  it("正常系: RewardImageが存在しない場合でも正常に動作する", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 123;
    const mockCollectedAt = new Date("2024-01-01T00:00:00Z");

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.collectedReward.findMany).mockResolvedValue([
      {
        id: 1,
        userId: mockUserId,
        moviePosterId: mockMoviePosterId,
        collectedAt: mockCollectedAt,
        moviePoster: {
          id: mockMoviePosterId,
          tmdbId: "tmdb-123",
          title: "Test Movie",
          posterUrl: "https://example.com/poster.jpg",
        },
      },
    ]);

    vi.mocked(prisma.rewardImage.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.length).toBe(1);
    expect(data[0].rewardImage).toBeNull();
  });

  it("異常系: 未認証ユーザーは一覧を取得できない", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.collectedReward.findMany).not.toHaveBeenCalled();
  });

  it("異常系: セッションにuserが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
  });

  it("異常系: セッションにuser.idが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
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
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
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

    vi.mocked(prisma.collectedReward.findMany).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collected",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      collectedRewardsErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
