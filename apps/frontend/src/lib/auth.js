import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

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

// Timing-attack mitigation decoy hash
const DUMMY_BCRYPT_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

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
        include: {
          profile: true,
        },
      });

      if (!user || !user.password) {
        // Timing-attack mitigation: perform constant-time dummy comparison
        await bcrypt.compare(credentials.password, DUMMY_BCRYPT_HASH);
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
        } catch {
          // Non-blocking log creation
        }
        throw new Error("Invalid email or password.");
      }

      // Record security log for successful login & track active session
      try {
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            eventType: "login_success",
          },
        });

        // Ensure user profile exists
        if (!user.profile) {
          await prisma.userProfile.create({
            data: {
              userId: user.id,
              displayName: user.name || "FlowCTRL User",
              headline: user.headline || "",
              bio: user.bio || "",
              location: user.location || "",
            },
          });
        }

        // Register active device session (30-day expiry)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const sessionToken = `sess_${user.id}_${Date.now()}`;
        await prisma.userSession.create({
          data: {
            userId: user.id,
            sessionToken,
            ipAddress: "127.0.0.1",
            userAgent: "FlowCTRL Web Client",
            deviceType: "Desktop",
            browser: "Web Browser",
            os: "Windows",
            expiresAt,
          },
        });
      } catch (err) {
        // Non-blocking log and session registration
        console.warn("[Auth Post-Login Error]:", err.message);
      }

      return {
        id: user.id,
        name: user.profile?.displayName || user.name,
        email: user.email,
        role: user.role,
        image: user.profile?.avatarUrl || user.image,
      };
    },
  }),
);

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
