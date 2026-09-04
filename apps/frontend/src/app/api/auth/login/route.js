import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSessionRecord,
  sanitizeAuthUser,
} from "@/lib/sessionCookie";

const DUMMY_BCRYPT_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user || !user.password) {
      // Timing-attack defense: constant-time dummy compare
      await bcrypt.compare(String(password), DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(String(password), user.password);

    if (!isMatch) {
      // Record failed login audit log
      prisma.securityLog
        .create({
          data: {
            userId: user.id,
            eventType: "failed_login",
            ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
            userAgent: req.headers.get("user-agent") || "Web Client",
          },
        })
        .catch(() => {});

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_SUSPENDED",
          error: "Account is inactive or suspended.",
        },
        { status: 403 },
      );
    }

    // Create active session in PostgreSQL
    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(user.id, req);

    // Record login success in SecurityLog
    prisma.securityLog
      .create({
        data: {
          userId: user.id,
          eventType: "login_success",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
        },
      })
      .catch(() => {});

    // Set secure HTTP-Only session cookie and CSRF cookie
    const cookieStore = await cookies();
    cookieStore.set(
      cookieOptions.sessionCookie.name,
      sessionToken,
      cookieOptions.sessionCookie,
    );
    cookieStore.set(
      cookieOptions.csrfCookie.name,
      csrfToken,
      cookieOptions.csrfCookie,
    );

    const res = NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: sanitizeAuthUser(user),
      },
      { status: 200 },
    );

    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Login API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "An error occurred during authentication.",
      },
      { status: 500 },
    );
  }
}
