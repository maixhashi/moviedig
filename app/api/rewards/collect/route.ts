import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { parseRequestJson } from "@/lib/utils/jsonParse";
import { collectRewardSchema } from "@/lib/validation/collectReward";

function handleUnauthorizedError() {
  return NextResponse.json(
    {
      error: "未認証",
    },
    { status: 401 }
  );
}

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

function handleNotFoundError(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 404 }
  );
}

function handleConflictError() {
  return NextResponse.json(
    {
      error: "この報酬は既に収集済みです",
    },
    { status: 409 }
  );
}

function handleServerError(error: Error) {
  console.error("報酬収集エラー:", error);
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

async function collectReward(
  body: z.infer<typeof collectRewardSchema>,
  userId: number
) {
  const moviePoster = await prisma.moviePoster.findUnique({
    where: { id: body.movie_poster_id },
  });

  if (!moviePoster) {
    return handleNotFoundError("MoviePoster not found");
  }

  const existingCollection = await prisma.collectedReward.findFirst({
    where: {
      userId: userId,
      moviePosterId: body.movie_poster_id,
    },
  });

  if (existingCollection) {
    return handleConflictError();
  }

  await prisma.collectedReward.create({
    data: {
      userId: userId,
      moviePosterId: body.movie_poster_id,
    },
  });

  return NextResponse.json(
    {
      message: "Reward collected successfully",
    },
    { status: 200 }
  );
}

function handleError(error: Error) {
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  return handleServerError(error);
}

async function processCollectRequest(request: NextRequest) {
  const userId = await getAuthenticatedUserId();

  if (userId === null) {
    return handleUnauthorizedError();
  }

  const body = await parseRequestJson(request, collectRewardSchema);
  return await collectReward(body, userId);
}

export async function POST(request: NextRequest) {
  try {
    return await processCollectRequest(request);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return handleError(errorObj);
  }
}
