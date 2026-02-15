import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { z } from "zod";
import { randomUUID } from "crypto";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type Credentials = {
  username: string;
  password: string;
};

type GuestCredentials = {
  isGuest: true;
};

type AuthorizedUser = {
  id: string;
  name: string;
  isGuest: boolean;
};

type AuthorizationError = {
  error: string;
};

type AuthorizationResult = AuthorizedUser | AuthorizationError;

export async function authorizeCredentials(
  credentials: Credentials | GuestCredentials
): Promise<AuthorizationResult> {
  if ("isGuest" in credentials && credentials.isGuest === true) {
    return await authorizeGuest();
  }

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
    isGuest: false,
  };
}

async function authorizeGuest(): Promise<AuthorizationResult> {
  const guestId = randomUUID();
  const username = `guest_${guestId}`;

  try {
    const guestUser = await prisma.guestUser.create({
      data: {
        id: guestId,
        username,
      },
    });

    return {
      id: guestUser.id,
      name: guestUser.username,
      isGuest: true,
    };
  } catch {
    return { error: "Failed to create guest user" };
  }
}
