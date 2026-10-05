const authService = require("../services/auth.service");
const {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  parseCookies,
  serializeCookie,
} = require("../utils/sessionCookie");

/**
 * Auth Controller
 * ---------------
 * Manages HTTP transport, cookie headers, and safe JSON serialization.
 */

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.validatedBody || req.body;

    const result = await authService.signup({
      name,
      email,
      password,
      req,
    });

    const sessionCookieStr = serializeCookie(
      result.cookieOptions.sessionCookie.name || SESSION_COOKIE_NAME,
      result.sessionToken,
      result.cookieOptions.sessionCookie,
    );

    const csrfCookieStr = serializeCookie(
      result.cookieOptions.csrfCookie.name || CSRF_COOKIE_NAME,
      result.csrfToken,
      result.cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function signin(req, res, next) {
  try {
    const { email, password } = req.validatedBody || req.body;

    const result = await authService.signin({
      email,
      password,
      req,
    });

    const sessionCookieStr = serializeCookie(
      result.cookieOptions.sessionCookie.name || SESSION_COOKIE_NAME,
      result.sessionToken,
      result.cookieOptions.sessionCookie,
    );

    const csrfCookieStr = serializeCookie(
      result.cookieOptions.csrfCookie.name || CSRF_COOKIE_NAME,
      result.csrfToken,
      result.cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Authentication successful.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    const result = await authService.getSessionUser(sessionToken);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    const cookieOptions = await authService.logout(sessionToken);

    const expiredSessionCookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      ...cookieOptions.sessionCookie,
      maxAge: 0,
      expires: new Date(0),
    });

    const expiredCsrfCookie = serializeCookie(CSRF_COOKIE_NAME, "", {
      ...cookieOptions.csrfCookie,
      maxAge: 0,
      expires: new Date(0),
    });

    res.setHeader("Set-Cookie", [expiredSessionCookie, expiredCsrfCookie]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

async function logoutAll(req, res, next) {
  try {
    const userId = req.user.id;
    const cookieOptions = await authService.logoutAll(userId, req);

    const expiredSessionCookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      ...cookieOptions.sessionCookie,
      maxAge: 0,
      expires: new Date(0),
    });

    const expiredCsrfCookie = serializeCookie(CSRF_COOKIE_NAME, "", {
      ...cookieOptions.csrfCookie,
      maxAge: 0,
      expires: new Date(0),
    });

    res.setHeader("Set-Cookie", [expiredSessionCookie, expiredCsrfCookie]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Successfully signed out from all devices.",
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.validatedBody || req.body;

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
      req,
    );

    const sessionCookieStr = serializeCookie(
      result.cookieOptions.sessionCookie.name || SESSION_COOKIE_NAME,
      result.sessionToken,
      result.cookieOptions.sessionCookie,
    );

    const csrfCookieStr = serializeCookie(
      result.cookieOptions.csrfCookie.name || CSRF_COOKIE_NAME,
      result.csrfToken,
      result.cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Active sessions have been refreshed.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  signin,
  me,
  logout,
  logoutAll,
  changePassword,
};
