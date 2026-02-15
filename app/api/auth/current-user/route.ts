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

function handleNotFoundError() {
  return NextResponse.json(
    {
      error: "ユーザーが見つかりません",
    },
    { status: 404 }
  );
}

function handleServerError(error: Error) {
  console.error("現在のユーザー情報取得エラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function getCurrentUser() {
  const session = await auth();

  if (!session) {
    return handleUnauthorizedError();
  }

  if (!session.user) {
    return handleUnauthorizedError();
  }

  if (!session.user.id) {
    return handleUnauthorizedError();
  }

  const userId = parseInt(session.user.id, 10);

  if (Number.isNaN(userId)) {
    return handleUnauthorizedError();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  if (!user) {
    return handleNotFoundError();
  }

  return NextResponse.json(
    {
      id: user.id,
      username: user.username,
      created_at: user.createdAt.toISOString(),
    },
    { status: 200 }
  );
}

function handleError(error: Error) {
  return handleServerError(error);
}

export async function GET() {
  try {
    return await getCurrentUser();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
