const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// 1. Update apps/backend/src/app.js
const appJsPath = path.join(root, "apps", "backend", "src", "app.js");
let appJs = fs.readFileSync(appJsPath, "utf8");

if (!appJs.includes('app.set("etag", "strong");')) {
  appJs = appJs.replace(
    'app.disable("x-powered-by");',
    'app.disable("x-powered-by");\n\n// Enable strong ETag generation for conditional caching and 304 Not Modified negotiation\napp.set("etag", "strong");'
  );
}

if (!appJs.includes('"If-None-Match"')) {
  appJs = appJs.replace(
    /"x-request-id",\s*\]/m,
    `"x-request-id",
      "If-None-Match",
      "If-Modified-Since",
      "Cache-Control",
    ]`
  );
}

if (!appJs.includes('exposedHeaders:')) {
  appJs = appJs.replace(
    /maxAge: 86400, \/\/ 24 hours preflight cache/,
    `exposedHeaders: [
      "ETag",
      "Content-Length",
      "x-request-id",
      "x-response-time",
    ],
    maxAge: 86400, // 24 hours preflight cache`
  );
}

fs.writeFileSync(appJsPath, appJs, "utf8");
console.log("Updated apps/backend/src/app.js");

// 2. Update apps/frontend/src/app/roadmaps/[slug]/page.jsx
const roadmapSlugPath = path.join(root, "apps", "frontend", "src", "app", "roadmaps", "[slug]", "page.jsx");
let roadmapSlug = fs.readFileSync(roadmapSlugPath, "utf8");

// Ensure imports
if (!roadmapSlug.includes("indexedDbStorage")) {
  roadmapSlug = roadmapSlug.replace(
    'import { roadmapsService } from "../../../services/roadmaps.service";',
    'import { roadmapsService } from "../../../services/roadmaps.service";\nimport { indexedDbStorage, STORES } from "@/lib/storage/indexedDbStorage";'
  );
}

// Replace fetch useEffect
const oldFetchRegex = /\/\/ Fetch dynamic\/premium roadmap details from API[\s\S]*?\}, \[slug, staticRoadmap\]\);/;
const newFetchCode = `// Fetch dynamic/premium roadmap details with client-side SWR caching
  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    roadmapsService
      .fetchDetailBySlug(slug, {
        onBackgroundUpdate: (freshData) => {
          if (isMounted && freshData) {
            setRoadmap(freshData);
            setIsLocked(Boolean(freshData.isLocked));
          }
        },
      })
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setRoadmap(data);
          setIsLocked(Boolean(data.isLocked));
        } else if (staticRoadmap) {
          setRoadmap(staticRoadmap);
          setIsLocked(false);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch roadmap detail:", err.message);
        if (staticRoadmap) {
          setRoadmap(staticRoadmap);
          setIsLocked(false);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, staticRoadmap]);`;

if (oldFetchRegex.test(roadmapSlug)) {
  roadmapSlug = roadmapSlug.replace(oldFetchRegex, newFetchCode);
}

// Update handleToggleComplete to store in indexedDbStorage
const oldToggleRegex = /const handleToggleComplete = \(topicId\) => \{[\s\S]*?return next;\s*\}\);\s*\};/;
const newToggleCode = `const handleToggleComplete = (topicId) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      const arr = Array.from(next);
      try {
        localStorage.setItem(
          \`flowctrl_roadmap_\${slug}_completed\`,
          JSON.stringify(arr),
        );
      } catch (e) {
        console.warn("Could not save progress", e);
      }
      indexedDbStorage.set(STORES.USER_PROGRESS, {
        key: \`roadmap:\${slug}\`,
        completedTopics: arr,
        updatedAt: Date.now(),
      }).catch(() => {});
      return next;
    });
  };`;

if (oldToggleRegex.test(roadmapSlug)) {
  roadmapSlug = roadmapSlug.replace(oldToggleRegex, newToggleCode);
}

fs.writeFileSync(roadmapSlugPath, roadmapSlug, "utf8");
console.log("Updated apps/frontend/src/app/roadmaps/[slug]/page.jsx");

// 3. Update apps/frontend/src/app/dsa/page.jsx
const dsaPagePath = path.join(root, "apps", "frontend", "src", "app", "dsa", "page.jsx");
let dsaPage = fs.readFileSync(dsaPagePath, "utf8");

if (!dsaPage.includes("dsaService")) {
  dsaPage = dsaPage.replace(
    'import Footer from "@/components/Footer";',
    'import Footer from "@/components/Footer";\nimport { dsaService } from "@/services/dsa.service";\nimport { indexedDbStorage, STORES } from "@/lib/storage/indexedDbStorage";'
  );
}

const oldDsaFetchRegex = /\/\/ Fetch languages and algorithms from backend API[\s\S]*?\}, \[\]\);/;
const newDsaFetchCode = `// Fetch languages and algorithms from client-side SWR cache / backend
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      dsaService.fetchLanguages({
        onBackgroundUpdate: (freshLangs) => {
          if (isMounted && Array.isArray(freshLangs) && freshLangs.length > 0) {
            setLanguages(freshLangs);
          }
        },
      }),
      dsaService.fetchAlgorithms({
        onBackgroundUpdate: (freshAlgos) => {
          if (isMounted && Array.isArray(freshAlgos) && freshAlgos.length > 0) {
            setAlgorithms(freshAlgos);
            const cats = Array.from(new Set(freshAlgos.map((a) => a.category)));
            setCategories(cats);
          }
        },
      }),
    ])
      .then(([langs, algos]) => {
        if (!isMounted) return;
        if (Array.isArray(langs) && langs.length > 0) {
          setLanguages(langs);
          setSelectedLanguage(langs[0].id);
          setActiveCodeLang(langs[0].id);
        }
        if (Array.isArray(algos) && algos.length > 0) {
          setAlgorithms(algos);
          if (algos.length > 0) {
            setSelectedAlgo(algos[0]);
          }
          const cats = Array.from(new Set(algos.map((a) => a.category)));
          setCategories(cats);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load DSA from cache/backend:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);`;

if (oldDsaFetchRegex.test(dsaPage)) {
  dsaPage = dsaPage.replace(oldDsaFetchRegex, newDsaFetchCode);
}

// Update toggleSolved to store in indexedDbStorage
const oldDsaToggleRegex = /const toggleSolved = \(slug\) => \{[\s\S]*?catch \{\}\s*\};/;
const newDsaToggleCode = `const toggleSolved = (slug) => {
    const next = { ...solvedMap, [slug]: !solvedMap[slug] };
    setSolvedMap(next);
    try {
      localStorage.setItem("flowctrl_dsa_solved", JSON.stringify(next));
    } catch {}
    indexedDbStorage.set(STORES.USER_PROGRESS, {
      key: "dsa:solved",
      solvedMap: next,
      updatedAt: Date.now(),
    }).catch(() => {});
  };`;

if (oldDsaToggleRegex.test(dsaPage)) {
  dsaPage = dsaPage.replace(oldDsaToggleRegex, newDsaToggleCode);
}

fs.writeFileSync(dsaPagePath, dsaPage, "utf8");
console.log("Updated apps/frontend/src/app/dsa/page.jsx");

// 4. Update apps/frontend/src/app/resources/page.jsx
const resourcesPagePath = path.join(root, "apps", "frontend", "src", "app", "resources", "page.jsx");
let resourcesPage = fs.readFileSync(resourcesPagePath, "utf8");

if (!resourcesPage.includes("resourcesService")) {
  resourcesPage = resourcesPage.replace(
    'import Footer from "@/components/Footer";',
    'import Footer from "@/components/Footer";\nimport { resourcesService } from "@/services/resources.service";'
  );
}

const oldResFetchRegex = /\/\/ Fetch resources from API[\s\S]*?\}, \[page, debouncedSearch, selectedCategory, selectedLevel\]\);/;
const newResFetchCode = `// Fetch resources with multi-tier SWR client caching
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    resourcesService
      .fetchResources({
        page,
        limit: 24,
        category: selectedCategory,
        level: selectedLevel,
        search: debouncedSearch,
        onBackgroundUpdate: (freshData) => {
          if (!isMounted || !freshData) return;
          if (freshData.resources && Array.isArray(freshData.resources)) {
            setResources(freshData.resources);
            setTotalCount(freshData.total || freshData.count || freshData.resources.length);
            setTotalPages(freshData.totalPages || Math.ceil((freshData.total || freshData.resources.length) / 24) || 1);
          }
        },
      })
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.resources && Array.isArray(data.resources)) {
          setResources(data.resources);
          setTotalCount(data.total || data.count || data.resources.length);
          setTotalPages(data.totalPages || Math.ceil((data.total || data.resources.length) / 24) || 1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Resources cache/fetch error:", err.message);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, debouncedSearch, selectedCategory, selectedLevel]);`;

if (oldResFetchRegex.test(resourcesPage)) {
  resourcesPage = resourcesPage.replace(oldResFetchRegex, newResFetchCode);
}

fs.writeFileSync(resourcesPagePath, resourcesPage, "utf8");
console.log("Updated apps/frontend/src/app/resources/page.jsx");

// 5. Update apps/frontend/src/components/home/HomeNotificationsSection.jsx
const homeNotifPath = path.join(root, "apps", "frontend", "src", "components", "home", "HomeNotificationsSection.jsx");
let homeNotif = fs.readFileSync(homeNotifPath, "utf8");

if (!homeNotif.includes("announcementsService")) {
  homeNotif = homeNotif.replace(
    'import React, { useState, useEffect } from "react";',
    'import React, { useState, useEffect } from "react";\nimport { announcementsService } from "@/services/announcements.service";'
  );
}

const oldNotifFetchRegex = /useEffect\(\(\) => \{[\s\S]*?fetch\(`\${apiUrl}\/api\/announcements`[\s\S]*?\}, \[\]\);/;
const newNotifFetchCode = `useEffect(() => {
    let isMounted = true;

    announcementsService
      .fetchAnnouncements({
        category: "all",
        onBackgroundUpdate: (freshData) => {
          if (isMounted && Array.isArray(freshData)) {
            setAnnouncements(freshData);
          }
        },
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load announcements from cache/backend:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);`;

if (oldNotifFetchRegex.test(homeNotif)) {
  homeNotif = homeNotif.replace(oldNotifFetchRegex, newNotifFetchCode);
}

fs.writeFileSync(homeNotifPath, homeNotif, "utf8");
console.log("Updated apps/frontend/src/components/home/HomeNotificationsSection.jsx");

// 6. Update apps/frontend/src/services/auth.service.js
const authServicePath = path.join(root, "apps", "frontend", "src", "services", "auth.service.js");
let authService = fs.readFileSync(authServicePath, "utf8");

if (!authService.includes("indexedDbStorage")) {
  authService = authService.replace(
    'import { authApi } from "../api/auth";',
    'import { authApi } from "../api/auth";\nimport { indexedDbStorage, STORES } from "@/lib/storage/indexedDbStorage";'
  );
}

const oldSignOutRegex = /async signOut\(\) \{[\s\S]*?return await authApi\.logout\(\);\s*\}/;
const newSignOutCode = `async signOut() {
    try {
      await authApi.logout();
    } finally {
      if (typeof window !== "undefined") {
        indexedDbStorage.clear(STORES.USER_PROGRESS).catch(() => {});
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("flowctrl_user_") || key.includes("progress") || key.includes("token"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch {}
      }
    }
  }`;

if (oldSignOutRegex.test(authService)) {
  authService = authService.replace(oldSignOutRegex, newSignOutCode);
}

fs.writeFileSync(authServicePath, authService, "utf8");
console.log("Updated apps/frontend/src/services/auth.service.js");

console.log("ALL INTEGRATION UPDATES APPLIED SUCCESSFULLY!");

