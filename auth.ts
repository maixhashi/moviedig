import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/authorize";

const DAYS_IN_MONTH = 30;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const SESSION_MAX_AGE =
  DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;

async function authorizeGuestUser() {
  const result = await authorizeCredentials({ isGuest: true });
  if ("error" in result) {
    return null;
  }
  return result;
}

async function authorizeRegularUser(username: string, password: string) {
  const result = await authorizeCredentials({ username, password });
  if ("error" in result) {
    return null;
  }
  return result;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        isGuest: { label: "Is Guest", type: "boolean" },
      },
      authorize: async (credentials) => {
        if (credentials.isGuest === true) {
          return await authorizeGuestUser();
        }

        if (typeof credentials.username !== "string") {
          return null;
        }
        if (typeof credentials.password !== "string") {
          return null;
        }

        return await authorizeRegularUser(
          credentials.username,
          credentials.password
        );
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (token.isGuest !== undefined && typeof token.isGuest === "boolean") {
        session.user.isGuest = token.isGuest;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (!user) {
        return token;
      }
      token.sub = user.id;
      if ("isGuest" in user) {
        token.isGuest = user.isGuest;
      }
      return token;
    },
  },
});
