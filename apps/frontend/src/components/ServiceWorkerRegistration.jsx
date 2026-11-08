"use client";

import { useEffect } from "react";
import "@/lib/storage/clientCacheManager";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // In development or on localhost, ensure any existing service workers
    // and stale cached static chunks are unregistered and cleared.
    if (process.env.NODE_ENV !== "production" || isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    // Production-only Service Worker registration
    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("flowCTRL ServiceWorker registered successfully:", reg.scope);
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}

