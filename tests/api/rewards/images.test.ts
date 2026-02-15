import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/rewards/images/route";
import { NextRequest } from "next/server";
import { parseResponseJson } from "@/lib/utils/jsonParse";
import {
  rewardImagesSuccessResponseSchema,
  rewardImagesErrorResponseSchema,
} from "@/lib/validation/rewardImagesResponse";

const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const EXPECTED_REWARD_IMAGES_COUNT = 2;

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    rewardImage: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";

describe("GET /api/rewards/images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: 報酬画像一覧を取得できる", async () => {
    const mockRewardImages = [
      {
        id: 1,
        title: "Test Movie 1",
        posterUrl: "https://example.com/poster1.jpg",
        moviePosterId: 10,
      },
      {
        id: 2,
        title: "Test Movie 2",
        posterUrl: "https://example.com/poster2.jpg",
        moviePosterId: 20,
      },
    ];

    vi.mocked(prisma.rewardImage.findMany).mockResolvedValue(mockRewardImages);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/images",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      rewardImagesSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data).toHaveLength(EXPECTED_REWARD_IMAGES_COUNT);
    expect(data[0]).toEqual({
      id: 1,
      title: "Test Movie 1",
      posterUrl: "https://example.com/poster1.jpg",
      moviePosterId: 10,
    });
    expect(data[1]).toEqual({
      id: 2,
      title: "Test Movie 2",
      posterUrl: "https://example.com/poster2.jpg",
      moviePosterId: 20,
    });
    expect(prisma.rewardImage.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        posterUrl: true,
        moviePosterId: true,
      },
    });
  });

  it("正常系: 空のリストを返す", async () => {
    vi.mocked(prisma.rewardImage.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/images",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      rewardImagesSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data).toHaveLength(0);
  });

  it("正常系: moviePosterIdがnullの場合", async () => {
    const mockRewardImages = [
      {
        id: 1,
        title: "Test Movie",
        posterUrl: "https://example.com/poster.jpg",
        moviePosterId: null,
      },
    ];

    vi.mocked(prisma.rewardImage.findMany).mockResolvedValue(mockRewardImages);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/images",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      rewardImagesSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(data[0].moviePosterId).toBeNull();
  });

  it("異常系: データベースエラーが発生した場合", async () => {
    const mockError = new Error("Database connection failed");
    vi.mocked(prisma.rewardImage.findMany).mockRejectedValue(mockError);

    const request = new NextRequest(
      "http://localhost:3000/api/rewards/images",
      {
        method: "GET",
      }
    );

    const response = await GET(request);
    const data = await parseResponseJson(
      response,
      rewardImagesErrorResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe("サーバーエラーが発生しました");
  });
});
