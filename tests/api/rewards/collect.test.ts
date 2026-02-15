import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/rewards/collect/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/jsonParse";
import {
  collectRewardSuccessResponseSchema,
  collectRewardErrorResponseSchema,
} from "@/lib/validation/collectRewardResponse";

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    moviePoster: {
      findUnique: vi.fn(),
    },
    collectedReward: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/rewards/collect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 報酬を収集できる", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 123;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.moviePoster.findUnique).mockResolvedValue({
      id: mockMoviePosterId,
      tmdbId: "tmdb-123",
      title: "Test Movie",
      posterUrl: "https://example.com/poster.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.collectedReward.findFirst).mockResolvedValue(null);

    vi.mocked(prisma.collectedReward.create).mockResolvedValue({
      id: 1,
      userId: mockUserId,
      moviePosterId: mockMoviePosterId,
      collectedAt: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: mockMoviePosterId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data.message).toBe("Reward collected successfully");
    expect(prisma.moviePoster.findUnique).toHaveBeenCalledWith({
      where: { id: mockMoviePosterId },
    });
    expect(prisma.collectedReward.findFirst).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        moviePosterId: mockMoviePosterId,
      },
    });
    expect(prisma.collectedReward.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        moviePosterId: mockMoviePosterId,
      },
    });
  });

  it("異常系: 未認証ユーザーは報酬を収集できない", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
    expect(prisma.moviePoster.findUnique).not.toHaveBeenCalled();
    expect(prisma.collectedReward.findFirst).not.toHaveBeenCalled();
    expect(prisma.collectedReward.create).not.toHaveBeenCalled();
  });

  it("異常系: セッションにuserが存在しない場合", async () => {
    vi.mocked(auth).mockResolvedValue({
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
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
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
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
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe("未認証");
  });

  it("異常系: 既に収集済みの報酬は重複収集できない", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 123;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.moviePoster.findUnique).mockResolvedValue({
      id: mockMoviePosterId,
      tmdbId: "tmdb-123",
      title: "Test Movie",
      posterUrl: "https://example.com/poster.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.collectedReward.findFirst).mockResolvedValue({
      id: 1,
      userId: mockUserId,
      moviePosterId: mockMoviePosterId,
      collectedAt: new Date(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: mockMoviePosterId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(data.error).toBe("この報酬は既に収集済みです");
    expect(prisma.collectedReward.create).not.toHaveBeenCalled();
  });

  it("異常系: MoviePoster not found", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 999;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.moviePoster.findUnique).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: mockMoviePosterId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(data.error).toBe("MoviePoster not found");
    expect(prisma.collectedReward.findFirst).not.toHaveBeenCalled();
    expect(prisma.collectedReward.create).not.toHaveBeenCalled();
  });

  it("異常系: バリデーションエラー（movie_poster_idが不正）", async () => {
    const mockUserId = 1;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: -1,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
    if (data.details) {
      expect(data.details.length).toBeGreaterThan(0);
    }
    expect(prisma.moviePoster.findUnique).not.toHaveBeenCalled();
  });

  it("異常系: バリデーションエラー（movie_poster_idが文字列）", async () => {
    const mockUserId = 1;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: "invalid",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
  });

  it("異常系: バリデーションエラー（movie_poster_idが欠如）", async () => {
    const mockUserId = 1;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
  });

  it("異常系: データベースエラーが発生した場合", async () => {
    const mockUserId = 1;
    const mockMoviePosterId = 123;

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: String(mockUserId),
        name: "testuser",
      },
      expires: new Date().toISOString(),
    });

    vi.mocked(prisma.moviePoster.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/collect",
      {
        method: "POST",
        body: JSON.stringify({
          movie_poster_id: mockMoviePosterId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      collectRewardErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
