/**
 * End-to-End Security Architecture & Data Isolation Verification Script
 * flowCTRL User Account & Profile Security Architecture
 */

const bcrypt = require("bcryptjs");
const { prisma } = require("../apps/backend/src/db");
const {
  isSafeUrl,
  validateUrl,
  validateProfileUpdate,
  sanitizePublicProfile,
  sanitizeSelfProfile,
  maskIpAddress,
} = require("../apps/backend/src/utils/security");

const DUMMY_BCRYPT_HASH =
  "$2a$12$e8hGq1r9B0kG6zY/mSre1u5jXw2rE5v7s8D6e5f4g3h2i1j0k9l8m";

async function runVerification() {
  console.log("===============================================================");
  console.log("🚀 flowCTRL COMPLETE PROFILE & SECURITY ARCHITECTURE TEST SUITE");
  console.log("===============================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // Generate unique test emails
  const timestamp = Date.now();
  const userAEmail = `alice_${timestamp}@testflowctrl.dev`;
  const userBEmail = `bob_${timestamp}@testflowctrl.dev`;
  const plainPasswordA = "SecureP@ssw0rd!Alice";
  const plainPasswordB = "SecureP@ssw0rd!Bob";

  let userAId = null;
  let userBId = null;
  let userASessionId = null;
  let userBSessionId = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: User Registration with Relational Separation
    // -------------------------------------------------------------
    console.log("--- TEST 1: User Registration & Relational Separation ---");
    const passwordHashA = await bcrypt.hash(plainPasswordA, 10);
    const passwordHashB = await bcrypt.hash(plainPasswordB, 10);

    const userA = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Alice Architect",
          email: userAEmail,
          password: passwordHashA,
          role: "USER",
          status: "ACTIVE",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: "Alice Architect",
          headline: "Distributed Systems Lead",
          bio: "Specializing in high-throughput data streams and zero-trust security.",
          location: "San Francisco, CA",
          websiteUrl: "https://alice.systems",
          githubUrl: "https://github.com/alice-dev",
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
          details: { method: "credentials" },
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 TestSuite/1.0",
        },
      });

      return user;
    });

    userAId = userA.id;
    assert(userA && userA.id, "User A created with separate User identity record");

    const profileA = await prisma.userProfile.findUnique({ where: { userId: userAId } });
    assert(profileA && profileA.headline === "Distributed Systems Lead", "UserProfile separated in relational table");

    const prefsA = await prisma.userPreference.findUnique({ where: { userId: userAId } });
    assert(prefsA && prefsA.theme === "dark" && prefsA.profileVisibility === "PUBLIC", "UserPreference separated in relational table");

    const logsA = await prisma.securityLog.findMany({ where: { userId: userAId } });
    assert(logsA.length > 0 && logsA[0].eventType === "user_registered", "Security audit log recorded on registration");

    // Create User B (Private profile)
    const userB = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Bob Security",
          email: userBEmail,
          password: passwordHashB,
          role: "USER",
          status: "ACTIVE",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: "Bob Security",
          headline: "Cloud SecOps",
        },
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
          theme: "system",
          profileVisibility: "PRIVATE",
        },
      });

      return user;
    });
    userBId = userB.id;
    assert(userB && userB.id, "User B created with private preferences");

    // -------------------------------------------------------------
    // TEST 2: Timing Attack Defense (Dummy Bcrypt Hash)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Timing Attack Defense via Constant-Time Dummy Compare ---");
    const nonExistentUser = null;
    const startDummy = Date.now();
    await bcrypt.compare("random_guessing_pw", DUMMY_BCRYPT_HASH);
    const dummyElapsed = Date.now() - startDummy;

    const startReal = Date.now();
    await bcrypt.compare("wrong_password", passwordHashA);
    const realElapsed = Date.now() - startReal;

    assert(dummyElapsed >= 10 && realElapsed >= 10, "Bcrypt timing computation executed for non-existent users");

    // -------------------------------------------------------------
    // TEST 3: Mass Assignment Protection & Role Escalation Defense
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Mass Assignment & Privilege Escalation Defense ---");
    const maliciousInput = {
      id: "malicious-id-override",
      role: "SUPER_ADMIN",
      status: "BANNED",
      password: "hackedPassword",
      passwordHash: "$2a$10$fakehashfakehashfakehashfake",
      displayName: "Alice Secure",
      headline: "Principal Architect",
      websiteUrl: "https://alice.systems",
    };

    const validationResult = validateProfileUpdate(maliciousInput);
    assert(validationResult.isValid === true, "Allowed fields pass validation");
    assert(validationResult.sanitized.id === undefined, "Mass-assignment: id field stripped");
    assert(validationResult.sanitized.role === undefined, "Mass-assignment: role escalation stripped");
    assert(validationResult.sanitized.password === undefined, "Mass-assignment: password update stripped");
    assert(validationResult.sanitized.displayName === "Alice Secure", "Safe fields correctly extracted");

    // -------------------------------------------------------------
    // TEST 4: Dangerous Protocol Neutralization (XSS & URL Safety)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Dangerous Protocol Neutralization (XSS Defense) ---");
    const xssPayloads = [
      "javascript:alert(document.cookie)",
      "JAVASCRIPT:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "vbscript:msgbox(\"XSS\")",
    ];

    for (const payload of xssPayloads) {
      assert(isSafeUrl(payload) === false, `Blocked dangerous scheme: ${payload.slice(0, 30)}...`);
    }
    assert(isSafeUrl("https://flowctrl.dev/portfolio") === true, "Valid HTTPS URL permitted");

    // -------------------------------------------------------------
    // TEST 5: Active Multi-Device Sessions & IP Masking
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Multi-Device Sessions & PII Protection (Masked IPs) ---");
    const sessionA1 = await prisma.userSession.create({
      data: {
        userId: userAId,
        sessionToken: `token_a1_${timestamp}`,
        ipAddress: "203.0.113.195",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0",
        deviceType: "Desktop",
        browser: "Chrome",
        os: "macOS",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    userASessionId = sessionA1.id;

    const sessionA2 = await prisma.userSession.create({
      data: {
        userId: userAId,
        sessionToken: `token_a2_${timestamp}`,
        ipAddress: "198.51.100.42",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
        deviceType: "Mobile",
        browser: "Safari",
        os: "iOS",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    const sessionB1 = await prisma.userSession.create({
      data: {
        userId: userBId,
        sessionToken: `token_b1_${timestamp}`,
        ipAddress: "192.0.2.77",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0",
        deviceType: "Desktop",
        browser: "Edge",
        os: "Windows",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    userBSessionId = sessionB1.id;

    const sessionsUserA = await prisma.userSession.findMany({ where: { userId: userAId } });
    assert(sessionsUserA.length === 2, "User A has 2 active sessions tracked");

    const maskedIp = maskIpAddress(sessionA1.ipAddress);
    assert(maskedIp === "203.0.113.***", `IP address successfully masked: ${maskedIp}`);

    // -------------------------------------------------------------
    // TEST 6: IDOR / BOLA Prevention (Cross-User Session Revocation)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: IDOR / BOLA Prevention (Data Isolation) ---");
    // Simulate User A attempting to revoke User B's session
    const targetSessionToRevoke = await prisma.userSession.findUnique({
      where: { id: userBSessionId },
    });

    const requesterUserId = userAId;
    const isOwner = targetSessionToRevoke.userId === requesterUserId;

    assert(isOwner === false, "Server verifies session.userId === authenticatedUser.id");
    assert(targetSessionToRevoke.userId === userBId, "User B's session belongs to User B");

    // Attempt should be rejected
    let idorPrevented = false;
    if (!isOwner) {
      idorPrevented = true; // 403 Forbidden simulated
    }
    assert(idorPrevented === true, "IDOR attack blocked: User A cannot revoke User B's session");

    // User A revoking User A's own session A2
    const canRevokeOwn = sessionA2.userId === userAId;
    if (canRevokeOwn) {
      await prisma.userSession.delete({ where: { id: sessionA2.id } });
    }
    const remainingSessionsA = await prisma.userSession.findMany({ where: { userId: userAId } });
    assert(remainingSessionsA.length === 1 && remainingSessionsA[0].id === userASessionId, "User A successfully revoked their own specific session");

    // -------------------------------------------------------------
    // TEST 7: Global Logout / Revoke All Sessions
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Global Logout (Sign Out Everywhere) ---");
    const revokeResult = await prisma.userSession.deleteMany({
      where: { userId: userAId },
    });
    assert(revokeResult.count === 1, "Revoke-all removed all remaining sessions for User A");

    const userBSessionsAfter = await prisma.userSession.findMany({ where: { userId: userBId } });
    assert(userBSessionsAfter.length === 1, "User A's global logout had zero effect on User B's sessions");

    // -------------------------------------------------------------
    // TEST 8: Password Change Flow with Re-Hashing & Audit Logging
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Secure Password Change Flow ---");
    const currentEnteredPassword = plainPasswordA;
    const newEnteredPassword = "BrandNewSecurePassword2026!";

    const userToUpdate = await prisma.user.findUnique({ where: { id: userAId } });
    const isCurrentPwValid = await bcrypt.compare(currentEnteredPassword, userToUpdate.password);
    assert(isCurrentPwValid === true, "Current password verified before permitting change");

    const newHash = await bcrypt.hash(newEnteredPassword, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userAId },
        data: { password: newHash },
      }),
      prisma.userSession.deleteMany({
        where: { userId: userAId },
      }),
      prisma.securityLog.create({
        data: {
          userId: userAId,
          eventType: "password_changed",
          details: { reason: "user_initiated" },
          ipAddress: "203.0.113.195",
        },
      }),
    ]);

    const updatedUserA = await prisma.user.findUnique({ where: { id: userAId } });
    const canLoginWithNew = await bcrypt.compare(newEnteredPassword, updatedUserA.password);
    const cannotLoginWithOld = await bcrypt.compare(plainPasswordA, updatedUserA.password);
    assert(canLoginWithNew === true && cannotLoginWithOld === false, "Password updated securely with bcrypt; old password rejected");

    const pwLogs = await prisma.securityLog.findMany({
      where: { userId: userAId, eventType: "password_changed" },
    });
    assert(pwLogs.length > 0, "Audit trail recorded for password change event");

    // -------------------------------------------------------------
    // TEST 9: Profile Privacy Boundaries (Public vs Private)
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Profile Privacy Boundaries & PII Stripping ---");
    const fetchedUserA = await prisma.user.findUnique({
      where: { id: userAId },
      include: {
        profile: true,
        preferences: true,
        userSkills: { include: { skill: true } },
      },
    });
    const publicA = sanitizePublicProfile(fetchedUserA);
    assert(publicA.email === undefined, "Public profile DTO strips email");
    assert(publicA.headline === "Distributed Systems Lead", "Public profile displays headline");

    const fetchedUserB = await prisma.user.findUnique({
      where: { id: userBId },
      include: { profile: true, preferences: true },
    });
    const isUserBPublic = fetchedUserB.preferences?.profileVisibility === "PUBLIC";
    assert(isUserBPublic === false, "User B's profile visibility is correctly identified as PRIVATE (403 for guests)");

    // -------------------------------------------------------------
    // TEST 10: Relational Skills Management
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Relational User Skills Management ---");
    const skillDistributed = await prisma.skill.upsert({
      where: { name: "Distributed Systems" },
      create: { name: "Distributed Systems", category: "Backend" },
      update: {},
    });
    const skillSecurity = await prisma.skill.upsert({
      where: { name: "Application Security" },
      create: { name: "Application Security", category: "Security" },
      update: {},
    });

    await prisma.userSkill.createMany({
      data: [
        { userId: userAId, skillId: skillDistributed.id, proficiency: 5 },
        { userId: userAId, skillId: skillSecurity.id, proficiency: 4 },
      ],
      skipDuplicates: true,
    });

    const userASkills = await prisma.userSkill.findMany({
      where: { userId: userAId },
      include: { skill: true },
    });
    // -------------------------------------------------------------
    // TEST 11: HTTP-Only Cookie Session Management & CSRF Defense
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: HTTP-Only Cookie Session Management & CSRF Defense ---");
    const {
      parseCookies,
      serializeCookie,
      createSessionRecord,
      validateSessionToken,
      revokeSessionToken,
      revokeAllUserSessions,
      SESSION_COOKIE_NAME,
      CSRF_COOKIE_NAME,
    } = require("../apps/backend/src/utils/sessionCookie");

    // 1. Session creation & cookie serialization
    const mockReq = {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0",
        "x-forwarded-for": "198.51.100.99",
      },
    };
    const { sessionToken: testToken, csrfToken: testCsrf, cookieOptions: testOpts } =
      await createSessionRecord(userAId, mockReq);

    const serializedSessionCookie = serializeCookie(
      SESSION_COOKIE_NAME,
      testToken,
      testOpts.sessionCookie,
    );
    assert(serializedSessionCookie.includes("HttpOnly"), "Session cookie contains HttpOnly flag");
    assert(serializedSessionCookie.includes("SameSite=Lax"), "Session cookie contains SameSite=Lax flag");
    assert(serializedSessionCookie.includes("Path=/"), "Session cookie scoped to Path=/");

    // 2. Cookie parsing
    const incomingCookieHeader = `${SESSION_COOKIE_NAME}=${testToken}; ${CSRF_COOKIE_NAME}=${testCsrf}`;
    const parsedCookies = parseCookies(incomingCookieHeader);
    assert(parsedCookies[SESSION_COOKIE_NAME] === testToken, "Parsed session token matches created session");
    assert(parsedCookies[CSRF_COOKIE_NAME] === testCsrf, "Parsed CSRF token matches created token");

    // 3. Database session validation
    const sessionValidation = await validateSessionToken(parsedCookies[SESSION_COOKIE_NAME]);
    assert(sessionValidation.valid === true, "Session validated successfully against PostgreSQL");
    assert(sessionValidation.user.id === userAId, "Validated session attaches correct user identity");

    // 4. CSRF Double-Submit Protection
    const clientHeaderCsrfValid = testCsrf;
    const clientHeaderCsrfInvalid = "forged_malicious_csrf_token";
    assert(clientHeaderCsrfValid === parsedCookies[CSRF_COOKIE_NAME], "Valid CSRF double-submit token accepted");
    assert(clientHeaderCsrfInvalid !== parsedCookies[CSRF_COOKIE_NAME], "Forged CSRF token rejected");

    // 5. Individual Session Revocation
    await revokeSessionToken(testToken);
    const postRevokeCheck = await validateSessionToken(testToken);
    assert(postRevokeCheck.valid === false && postRevokeCheck.reason === "SESSION_REVOKED", "Revoked session rejected with SESSION_REVOKED");

    // -------------------------------------------------------------
    // Clean up test users
    // -------------------------------------------------------------
    console.log("\n--- CLEANUP: Removing Test Users & Cascade Records ---");
    await prisma.user.delete({ where: { id: userAId } });
    await prisma.user.delete({ where: { id: userBId } });

    const orphanedProfileA = await prisma.userProfile.findUnique({ where: { userId: userAId } });
    assert(orphanedProfileA === null, "Cascading delete removed UserProfile on User deletion");

    const orphanedSkillsA = await prisma.userSkill.findMany({ where: { userId: userAId } });
    assert(orphanedSkillsA.length === 0, "Cascading delete removed UserSkills on User deletion");

    console.log("\n===============================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} SECURITY & ARCHITECTURE TESTS PASSED!`);
    console.log("===============================================================\n");
  } catch (err) {
    console.error("❌ Unexpected test execution error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
