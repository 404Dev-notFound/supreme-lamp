import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  revokeSessionToken,
  getCookieOptions,
} from "@/lib/sessionCookie";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
      await revokeSessionToken(sessionCookie.value);
    }

    const { sessionCookie: sessOpts, csrfCookie: csrfOpts } = getCookieOptions();

    // Expire/delete the cookies
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      ...sessOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    cookieStore.set(CSRF_COOKIE_NAME, "", {
      ...csrfOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    // Also clear NextAuth session token cookies if present
    cookieStore.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.set("__Secure-next-auth.session-token", "", {
      path: "/",
      secure: true,
      maxAge: 0,
      expires: new Date(0),
    });

    const res = NextResponse.json(
      { success: true, message: "Logged out successfully." },
      { status: 200 },
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Logout API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process logout." },
      { status: 500 },
    );
  }
}
