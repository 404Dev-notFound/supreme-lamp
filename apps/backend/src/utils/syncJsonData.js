const fs = require("fs");
const path = require("path");

function getFlowCtrlDataDir() {
  let curr = __dirname;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(curr, "flowCTRL DATA");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd(), "flowCTRL DATA");
}

const DATA_DIR = getFlowCtrlDataDir();

/**
 * Synchronizes user and profile records to flowCTRL DATA json files
 * immediately on signup and profile update.
 */
function syncJsonUserData(user, profile = null) {
  if (!user || !user.id) return;

  try {
    const usersJsonPath = path.join(DATA_DIR, "users.json");
    if (fs.existsSync(usersJsonPath)) {
      const content = fs.readFileSync(usersJsonPath, "utf-8");
      const usersList = JSON.parse(content || "[]");
      const idx = usersList.findIndex(
        (u) => u.id === user.id || (u.email && u.email === user.email)
      );

      const userEntry = {
        id: user.id,
        username: user.name || profile?.displayName || user.email?.split("@")[0] || "user",
        email: user.email,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : (user.createdAt || new Date().toISOString()),
        roleId: user.role === "ADMIN" ? "role_001" : "role_002",
      };

      if (idx >= 0) {
        usersList[idx] = { ...usersList[idx], ...userEntry };
      } else {
        usersList.push(userEntry);
      }

      fs.writeFileSync(usersJsonPath, JSON.stringify(usersList, null, 2), "utf-8");
    }

    const profilesJsonPath = path.join(DATA_DIR, "profiles.json");
    if (fs.existsSync(profilesJsonPath)) {
      const content = fs.readFileSync(profilesJsonPath, "utf-8");
      const profilesList = JSON.parse(content || "[]");
      const pIdx = profilesList.findIndex((p) => p.userId === user.id);

      const profileEntry = {
        id: profile?.id || `profile_${user.id}`,
        userId: user.id,
        fullName: profile?.displayName || user.name || "FlowCTRL User",
        title: profile?.headline || "",
        bio: profile?.bio || "",
        createdAt: profile?.createdAt instanceof Date ? profile?.createdAt.toISOString() : (profile?.createdAt || new Date().toISOString()),
      };

      if (pIdx >= 0) {
        profilesList[pIdx] = { ...profilesList[pIdx], ...profileEntry };
      } else {
        profilesList.push(profileEntry);
      }

      fs.writeFileSync(profilesJsonPath, JSON.stringify(profilesList, null, 2), "utf-8");
    }
  } catch (err) {
    // Non-blocking sync error
    console.warn("[syncJsonUserData] Notice:", err.message);
  }
}

module.exports = { syncJsonUserData };

