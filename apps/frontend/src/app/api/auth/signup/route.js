import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  createSessionRecord,
  sanitizeAuthUser,
} from "@/lib/sessionCookie";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Full name, email address, and password are required.",
        },
        { status: 400 },
      );
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Name must be at least 2 characters.",
        },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Password must be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Passwords do not match.",
        },
        { status: 400 },
      );
    }

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_EXISTS",
          error: "An account with this email address already exists.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Atomically create User, Profile, Preference, and initial SecurityLog
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: trimmedName,
          headline: "",
          bio: "",
          location: "",
        },
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
          theme: "dark",
          emailNotifications: true,
          profileVisibility: "PUBLIC",
        },
      });

      await tx.securityLog.create({
        data: {
          userId: user.id,
          eventType: "user_registered",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
          details: { method: "credentials" },
        },
      });

      return user;
    });

    // Create session in PostgreSQL
    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(newUser.id, req);

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
        message: "Account created successfully.",
        user: sanitizeAuthUser(newUser),
      },
      { status: 201 },
    );

    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Signup API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Failed to create account. Please try again.",
      },
      { status: 500 },
    );
  }
}
