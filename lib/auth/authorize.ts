import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type Credentials = {
  username: string;
  password: string;
};

type AuthorizedUser = {
  id: string;
  name: string;
};

type AuthorizationError = {
  error: string;
};

type AuthorizationResult = AuthorizedUser | AuthorizationError;

export async function authorizeCredentials(
  credentials: Credentials
): Promise<AuthorizationResult> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: "Invalid password" };
  }

  return {
    id: String(user.id),
    name: user.username,
  };
}
