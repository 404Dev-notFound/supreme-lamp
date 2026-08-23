import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

interface CustomUser extends NextAuthUser {
  role?: string;
}

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  );
}

providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required.");
      }

      const normalizedEmail = credentials.email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user || !user.password) {
        throw new Error("Invalid email or password.");
      }

      const isCorrectPassword = await bcrypt.compare(
        credentials.password,
        user.password,
      );

      if (!isCorrectPassword) {
        // Record security log for failed login attempt
        try {
          await prisma.securityLog.create({
            data: {
              userId: user.id,
              eventType: "failed_login",
            },
          });
        } catch {}
        throw new Error("Invalid email or password.");
      }

      // Record security log for successful login
      try {
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            eventType: "login_success",
          },
        });
      } catch {}

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      } as NextAuthUser;
    },
  }),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as never) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        const user = session.user as CustomUser;
        user.id = token.id as string;
        user.role = token.role as string;
        if (token.name) user.name = token.name as string;
        if (token.email) user.email = token.email as string;
        if (token.picture) user.image = token.picture as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as CustomUser).role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
