import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long." },
        { status: 400 },
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 },
      );
    }

    // Securely hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const trimmedName = name.trim();

    // Create user with profile and preferences atomically in PostgreSQL
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
          profile: {
            create: {
              displayName: trimmedName,
              headline: "Software Engineer",
              bio: "",
              location: "",
            },
          },
          preferences: {
            create: {
              theme: "dark",
              emailNotifications: true,
              weeklyDigest: true,
              jobAlerts: true,
              profileVisibility: "PUBLIC",
              careerGoalVisibility: true,
            },
          },
        },
        include: {
          profile: true,
          preferences: true,
        },
      });

      await tx.securityLog.create({
        data: {
          userId: newUser.id,
          eventType: "register_success",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
        },
      });

      return newUser;
    });

    // Return safe user payload (excluding password hash)
    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user.id,
          name: user.profile?.displayName || user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while creating your account. Please try again.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
