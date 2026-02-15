import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  registerSuccessResponseSchema,
  registerErrorResponseSchema,
} from "@/lib/validation/register-response";
import { parseResponseJson } from "@/lib/utils/json-parse";

const HTTP_STATUS = {
  CREATED: 201,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "@/auth";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
    vi.clearAllMocks();
    vi.mocked(signIn).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  it("正常系: ユーザー登録が成功し、自動ログインも成功する", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "testuser",
        password: "password123",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(
      response,
      registerSuccessResponseSchema
    );

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(data.message).toBe("ユーザー登録が完了しました");
    expect(data.user).toHaveProperty("id");
    expect(data.user.username).toBe("testuser");
    expect(data.user).not.toHaveProperty("password");
    expect(signIn).toHaveBeenCalledWith("credentials", {
      username: "testuser",
      password: "password123",
      redirect: false,
    });
  });

  it("異常系: ユーザー名が短すぎる", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "ab",
        password: "password123",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("異常系: パスワードが短すぎる", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "testuser",
        password: "short",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("異常系: ユーザー名に無効な文字が含まれている", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "test-user",
        password: "password123",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(data.details).toBeDefined();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("異常系: 重複したユーザー名", async () => {
    await prisma.user.create({
      data: {
        username: "existinguser",
        password: "hashedpassword",
      },
    });

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "existinguser",
        password: "password123",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(data.error).toBe("このユーザー名は既に使用されています");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("異常系: リクエストボディが不正", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "testuser",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe("バリデーションエラー");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("異常系: ユーザー登録は成功したが、自動ログインに失敗する", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("Sign in failed"));

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "testuser",
        password: "password123",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await parseResponseJson(response, registerErrorResponseSchema);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe(
      "ユーザー登録は完了しましたが、自動ログインに失敗しました"
    );
    expect(signIn).toHaveBeenCalledWith("credentials", {
      username: "testuser",
      password: "password123",
      redirect: false,
    });
  });
});
