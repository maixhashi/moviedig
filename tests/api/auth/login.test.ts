import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { authorizeCredentials } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

describe("authorizeCredentials関数のテスト", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.guestUser.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.guestUser.deleteMany({});
  });

  it("正常系: 正しい認証情報でログインが成功する", async () => {
    const uniqueUsername = `testuser-${Date.now()}`;
    const hashedPassword = await hashPassword("password123");
    await prisma.user.create({
      data: {
        username: uniqueUsername,
        password: hashedPassword,
      },
    });

    const result = await authorizeCredentials({
      username: uniqueUsername,
      password: "password123",
    });

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.id).toBeDefined();
      expect(result.name).toBe(uniqueUsername);
    }
  });

  it("異常系: 間違ったパスワードでログインが失敗する", async () => {
    const uniqueUsername = `testuser-${Date.now()}`;
    const hashedPassword = await hashPassword("password123");
    await prisma.user.create({
      data: {
        username: uniqueUsername,
        password: hashedPassword,
      },
    });

    const result = await authorizeCredentials({
      username: uniqueUsername,
      password: "wrongpassword",
    });

    expect("error" in result).toBe(true);
  });

  it("異常系: 存在しないユーザーでログインが失敗する", async () => {
    const result = await authorizeCredentials({
      username: "nonexistent",
      password: "password123",
    });

    expect("error" in result).toBe(true);
  });

  it("異常系: 認証情報が不足している場合", async () => {
    const result = await authorizeCredentials({
      username: "testuser",
      password: "",
    });

    expect("error" in result).toBe(true);
  });

  it("異常系: 無効な認証情報の形式", async () => {
    const result = await authorizeCredentials({
      username: "",
      password: "",
    });

    expect("error" in result).toBe(true);
  });

  it("正常系: ゲストログインが成功する", async () => {
    const result = await authorizeCredentials({
      isGuest: true,
    });

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.id).toBeDefined();
      expect(result.name).toMatch(/^guest_[a-f0-9-]+$/);
      expect(result.isGuest).toBe(true);
    }
  });

  it("正常系: ゲストIDが一意であることを確認", async () => {
    const result1 = await authorizeCredentials({
      isGuest: true,
    });
    const result2 = await authorizeCredentials({
      isGuest: true,
    });

    expect("error" in result1).toBe(false);
    expect("error" in result2).toBe(false);

    if ("error" in result1 || "error" in result2) {
      return;
    }

    expect(result1.id).not.toBe(result2.id);
    expect(result1.name).not.toBe(result2.name);
  });

  it("正常系: ゲストユーザーがデータベースに作成される", async () => {
    const result = await authorizeCredentials({
      isGuest: true,
    });

    expect("error" in result).toBe(false);

    if ("error" in result) {
      return;
    }

    const guestUser = await prisma.guestUser.findUnique({
      where: { id: result.id },
    });
    expect(guestUser).not.toBeNull();

    if (!guestUser) {
      return;
    }

    expect(guestUser.username).toBe(result.name);
  });
});
