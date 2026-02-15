import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function handleServerError(error: Error) {
  console.error("報酬画像一覧取得エラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function getRewardImages() {
  const rewardImages = await prisma.rewardImage.findMany({
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

  return NextResponse.json(rewardImages, { status: 200 });
}

function handleError(error: Error) {
  return handleServerError(error);
}

export async function GET() {
  try {
    return await getRewardImages();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
