import { z } from "zod";

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 150;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const registerSchema = z.object({
  username: z
    .string()
    .min(MIN_USERNAME_LENGTH, {
      message: `ユーザー名は${MIN_USERNAME_LENGTH}文字以上である必要があります`,
    })
    .max(MAX_USERNAME_LENGTH, {
      message: `ユーザー名は${MAX_USERNAME_LENGTH}文字以下である必要があります`,
    })
    .regex(USERNAME_PATTERN, {
      message: "ユーザー名は英数字とアンダースコアのみ使用できます",
    }),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, {
      message: `パスワードは${MIN_PASSWORD_LENGTH}文字以上である必要があります`,
    })
    .max(MAX_PASSWORD_LENGTH, {
      message: `パスワードは${MAX_PASSWORD_LENGTH}文字以下である必要があります`,
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

