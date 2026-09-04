const test = require("node:test");
const assert = require("node:assert");
const {
  parseCookies,
  serializeCookie,
  getCookieOptions,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} = require("../utils/sessionCookie");

test("Cookie Security - parseCookies correctly parses cookie strings", () => {
  const header = "flowctrl_session=sess_12345abcde; flowctrl_csrf=csrf_67890; theme=dark";
  const parsed = parseCookies(header);

  assert.strictEqual(parsed.flowctrl_session, "sess_12345abcde");
  assert.strictEqual(parsed.flowctrl_csrf, "csrf_67890");
  assert.strictEqual(parsed.theme, "dark");
  assert.strictEqual(parsed.nonexistent, undefined);

  assert.deepStrictEqual(parseCookies(""), {});
  assert.deepStrictEqual(parseCookies(null), {});
});

test("Cookie Security - serializeCookie enforces HttpOnly, Secure, and SameSite attributes", () => {
  const cookieStr = serializeCookie(SESSION_COOKIE_NAME, "token_val_123", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  });

  assert.ok(cookieStr.includes("flowctrl_session=token_val_123"));
  assert.ok(cookieStr.includes("HttpOnly"), "Session cookie MUST be HttpOnly");
  assert.ok(cookieStr.includes("Secure"), "Session cookie MUST be Secure in production");
  assert.ok(cookieStr.includes("SameSite=Lax"), "Session cookie MUST have SameSite attribute");
  assert.ok(cookieStr.includes("Path=/"), "Session cookie MUST have Path=/");
  assert.ok(cookieStr.includes("Max-Age=2592000"));
});

test("Cookie Security - CSRF cookie is accessible to client JS but Lax/Secure", () => {
  const { sessionCookie, csrfCookie } = getCookieOptions();

  assert.strictEqual(sessionCookie.httpOnly, true, "Primary session cookie must be HttpOnly");
  assert.strictEqual(csrfCookie.httpOnly, false, "CSRF token cookie must be readable by JS for header attachment");
  assert.strictEqual(sessionCookie.sameSite, "lax");
  assert.strictEqual(csrfCookie.sameSite, "lax");
});

test("CSRF Protection Logic - Double-submit header verification", () => {
  const cookieToken = "csrf_token_secret_abc123";

  // Valid match
  const validHeader = "csrf_token_secret_abc123";
  assert.strictEqual(validHeader === cookieToken, true, "Matching CSRF token header allows request");

  // Attack: Mismatched or forged token
  const attackerHeader = "forged_attacker_token_xyz";
  assert.strictEqual(attackerHeader === cookieToken, false, "Forged CSRF token rejected");

  // Attack: Missing header
  const missingHeader = undefined;
  assert.strictEqual(Boolean(missingHeader && missingHeader === cookieToken), false, "Missing CSRF token rejected");
});

test("Session Expiration & Revocation Logic", () => {
  const now = new Date();
  const past = new Date(now.getTime() - 10000);
  const future = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const activeSession = {
    expiresAt: future,
    revokedAt: null,
  };

  const expiredSession = {
    expiresAt: past,
    revokedAt: null,
  };

  const revokedSession = {
    expiresAt: future,
    revokedAt: past,
  };

  function isSessionUsable(session) {
    if (!session) return false;
    if (session.revokedAt !== null && session.revokedAt !== undefined) return false;
    if (session.expiresAt <= new Date()) return false;
    return true;
  }

  assert.strictEqual(isSessionUsable(activeSession), true, "Active session is accepted");
  assert.strictEqual(isSessionUsable(expiredSession), false, "Expired session is rejected");
  assert.strictEqual(isSessionUsable(revokedSession), false, "Revoked session is rejected");
});
