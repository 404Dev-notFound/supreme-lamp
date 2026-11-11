"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analyticsService } from "@/services/analytics.service";

const SENSITIVE_FIELD = /password|passcode|token|secret|authorization|otp|one.?time.?code|cvv|cvc|credit.?card|card.?number/i;

function safeUrl() {
  const url = new URL(window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (SENSITIVE_FIELD.test(key) || /^(code|state)$/i.test(key)) url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}`;
}

function labelFor(element) {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.innerText ||
    element.textContent ||
    element.getAttribute("placeholder") ||
    element.name ||
    element.id ||
    element.tagName
  ).trim().replace(/\s+/g, " ").slice(0, 240);
}

function isSensitiveField(field) {
  const type = (field.type || "").toLowerCase();
  const name = `${field.name || ""} ${field.id || ""} ${field.autocomplete || ""}`;
  return ["password", "hidden", "file", "submit", "button", "reset"].includes(type) || SENSITIVE_FIELD.test(name);
}

function fieldValue(field) {
  if (field.type === "checkbox" || field.type === "radio") return field.checked;
  if (field instanceof HTMLSelectElement && field.multiple) {
    return Array.from(field.selectedOptions, (option) => option.value);
  }
  return field.value;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const lastPageViewRef = useRef(null);

  useEffect(() => {
    const currentPath = () => safeUrl();
    const send = (eventType, entityType, entityId, metadata) => {
      analyticsService.trackEvent({ eventType, entityType, entityId, metadata });
    };

    const pageUrl = currentPath();
    if (lastPageViewRef.current !== pageUrl) {
      lastPageViewRef.current = pageUrl;
      send("PAGE_VIEW", "PAGE", pageUrl || pathname || "/", {
        url: pageUrl,
        title: document.title,
      });
    }

    const handleClick = (event) => {
      const element = event.target instanceof Element
        ? event.target.closest("a,button,[role='button'],[data-analytics-id]")
        : null;
      if (!element) return;

      const url = currentPath();
      const target = element.dataset.analyticsId || element.id || element.getAttribute("href") || labelFor(element);
      send("CLICK", "UI_ELEMENT", `${url}#${String(target).slice(0, 180)}`, {
        url,
        tag: element.tagName.toLowerCase(),
        label: labelFor(element),
        href: element.getAttribute("href"),
      });
    };

    const handleChange = (event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
      if (isSensitiveField(field) || field.disabled) return;

      const url = currentPath();
      const fieldId = field.name || field.id || field.getAttribute("aria-label") || field.placeholder || field.tagName;
      send("FIELD_CHANGE", "FORM_FIELD", `${url}#${String(fieldId).slice(0, 180)}`, {
        url,
        field: String(fieldId).slice(0, 160),
        label: labelFor(field),
        value: fieldValue(field),
      });
    };

    const handleSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const fields = Array.from(form.elements)
        .filter((field) =>
          (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) &&
          !isSensitiveField(field) && !field.disabled,
        )
        .map((field, index) => ({
          name: String(field.name || field.id || field.getAttribute("aria-label") || field.placeholder || `field_${index}`).slice(0, 120),
          value: fieldValue(field),
        }));
      const url = currentPath();
      const formId = form.id || form.getAttribute("aria-label") || form.getAttribute("action") || "form";
      send("FORM_SUBMIT", "FORM", `${url}#${String(formId).slice(0, 180)}`, {
        url,
        form: String(formId).slice(0, 160),
        fields,
      });
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [pathname, query]);

  return null;
}
