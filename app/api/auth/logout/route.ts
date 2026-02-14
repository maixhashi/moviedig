import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";

function handleUnauthorizedError() {
  return NextResponse.json(
    {
      error: "未認証",
    },
    { status: 401 }
  );
}

function handleServerError(error: Error) {
  console.error("ログアウトエラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function logoutUser() {
  const session = await auth();

  if (!session) {
    return handleUnauthorizedError();
  }

  try {
    await signOut({ redirect: false });
  } catch (signOutError) {
    console.error("ログアウト処理エラー:", signOutError);
    const errorObj =
      signOutError instanceof Error
        ? signOutError
        : new Error(String(signOutError));
    return handleServerError(errorObj);
  }

  return NextResponse.json(
    {
      message: "ログアウトしました",
    },
    { status: 200 }
  );
}

function handleError(error: Error) {
  return handleServerError(error);
}

export async function POST() {
  try {
    return await logoutUser();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
