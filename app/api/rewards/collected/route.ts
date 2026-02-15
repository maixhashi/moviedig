import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function handleUnauthorizedError() {
  return NextResponse.json(
    {
      error: "未認証",
    },
    { status: 401 }
  );
}

function handleServerError(error: Error) {
  console.error("収集済み報酬一覧取得エラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function getAuthenticatedUserId() {
  const session = await auth();

  if (!session) {
    return null;
  }

  if (!session.user) {
    return null;
  }

  if (!session.user.id) {
    return null;
  }

  const userId = parseInt(session.user.id, 10);

  if (Number.isNaN(userId)) {
    return null;
  }

  return userId;
}

async function getCollectedRewards(userId: number) {
  const collectedRewards = await prisma.collectedReward.findMany({
    where: {
      userId: userId,
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

  if (collectedRewards.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const moviePosterIds = collectedRewards.map(
    (reward) => reward.moviePoster.id
  );

  const rewardImages = await prisma.rewardImage.findMany({
    where: {
      moviePosterId: {
        in: moviePosterIds,
      },
    },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      posterUrl: true,
      moviePosterId: true,
    },
  });

  const rewardImageMap = new Map(
    rewardImages.map((image) => [image.moviePosterId, image])
  );

  const response = collectedRewards.map((reward) => {
    const rewardImage = rewardImageMap.get(reward.moviePoster.id);

    return {
      id: reward.id,
      collectedAt: reward.collectedAt.toISOString(),
      moviePoster: {
        id: reward.moviePoster.id,
        tmdbId: reward.moviePoster.tmdbId,
        title: reward.moviePoster.title,
        posterUrl: reward.moviePoster.posterUrl,
      },
      rewardImage: rewardImage
        ? {
            id: rewardImage.id,
            tmdbId: rewardImage.tmdbId,
            title: rewardImage.title,
            posterUrl: rewardImage.posterUrl,
            moviePosterId: rewardImage.moviePosterId,
          }
        : null,
    };
  });

  return NextResponse.json(response, { status: 200 });
}

function handleError(error: Error) {
  return handleServerError(error);
}

async function processGetRequest() {
  const userId = await getAuthenticatedUserId();

  if (userId === null) {
    return handleUnauthorizedError();
  }

  return await getCollectedRewards(userId);
}

export async function GET() {
  try {
    return await processGetRequest();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
