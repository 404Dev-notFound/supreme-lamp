import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskIpAddress, parseUserAgent } from "@/lib/profileValidation";

/**
 * GET /api/user/security/sessions
 * Returns active sessions and recent security logs for authenticated user only.
 * Masks IPs and parses client agents to prevent PII leakage and DOM XSS.
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view active sessions." },
        { status: 401 },
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userSessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { lastActiveAt: "desc" },
        },
        securityLogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let sessions = user.userSessions || [];

    // If no session tracked yet in DB, create one for the current client device
    if (sessions.length === 0) {
      const userAgent = req.headers.get("user-agent") || "Web Client";
      const { browser, os, deviceType } = parseUserAgent(userAgent);
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const newSession = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken: `sess_${user.id}_${Date.now()}`,
          ipAddress: ip,
          userAgent,
          browser,
          os,
          deviceType,
          expiresAt,
        },
      });
      sessions = [newSession];
    }

    const formattedSessions = sessions.map((s, index) => {
      const clientInfo = parseUserAgent(s.userAgent);
      return {
        id: s.id,
        deviceType: s.deviceType || clientInfo.deviceType,
        browser: s.browser || clientInfo.browser,
        os: s.os || clientInfo.os,
        maskedIp: maskIpAddress(s.ipAddress),
        lastActiveAt: s.lastActiveAt || s.createdAt,
        isCurrent: index === 0,
      };
    });

    const formattedLogs = (user.securityLogs || []).map((log) => ({
      id: log.id,
      eventType: log.eventType,
      maskedIp: maskIpAddress(log.ipAddress),
      createdAt: log.createdAt,
    }));

    const response = NextResponse.json({
      sessions: formattedSessions,
      securityLogs: formattedLogs,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    return response;
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve active sessions." },
      { status: 500 },
    );
  }
}
