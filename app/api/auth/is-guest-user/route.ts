import { NextResponse } from "next/server";
import { auth } from "@/auth";

function handleUnauthorizedError() {
  return NextResponse.json(
    {
      error: "未認証",
    },
    { status: 401 }
  );
}

function handleServerError(error: Error) {
  console.error("ゲストユーザー判定エラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function checkIsGuestUser() {
  const session = await auth();

  if (!session) {
    return handleUnauthorizedError();
  }

  if (!session.user) {
    return handleUnauthorizedError();
  }

  const isGuest = session.user.isGuest === true;

  return NextResponse.json(
    {
      isGuest,
    },
    { status: 200 }
  );
}

function handleError(error: Error) {
  return handleServerError(error);
}

export async function GET() {
  try {
    return await checkIsGuestUser();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
