import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { registerSchema } from "@/lib/validation/user";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { parseRequestJson } from "@/lib/utils/json-parse";
import { signIn } from "@/auth";

function handleZodError(error: ZodError) {
  const errorMessages = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return NextResponse.json(
    {
      error: "バリデーションエラー",
      details: errorMessages,
    },
    { status: 400 }
  );
}

function handleUniqueConstraintError() {
  return NextResponse.json(
    {
      error: "このユーザー名は既に使用されています",
    },
    { status: 409 }
  );
}

function handleServerError(error: Error) {
  console.error("ユーザー登録エラー:", error);
  return NextResponse.json(
    {
      error: "サーバーエラーが発生しました",
    },
    { status: 500 }
  );
}

async function registerUser(body: z.infer<typeof registerSchema>) {
  const validatedData = body;

  const existingUser = await prisma.user.findUnique({
    where: {
      username: validatedData.username,
    },
  });

  if (existingUser) {
    return handleUniqueConstraintError();
  }

  const hashedPassword = await hashPassword(validatedData.password);

  const user = await prisma.user.create({
    data: {
      username: validatedData.username,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  try {
    await signIn("credentials", {
      username: validatedData.username,
      password: validatedData.password,
      redirect: false,
    });
  } catch (signInError) {
    console.error("自動ログインエラー:", signInError);
    return NextResponse.json(
      {
        error: "ユーザー登録は完了しましたが、自動ログインに失敗しました",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "ユーザー登録が完了しました",
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}

function handleError(error: Error) {
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error.message.includes("Unique constraint")) {
    return handleUniqueConstraintError();
  }

  return handleServerError(error);
}

export async function POST(request: NextRequest) {
  try {
    return await registerUser(await parseRequestJson(request, registerSchema));
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}

