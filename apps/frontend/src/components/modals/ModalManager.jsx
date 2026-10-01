"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import GlassModal from "./GlassModal";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ProfileView from "./ProfileView";
import EditProfileForm from "./EditProfileForm";
import SecurityModal from "./SecurityModal";
import SettingsModal from "./SettingsModal";
import ResumeScreenerModal from "./ResumeScreenerModal";

function ModalManagerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modal = searchParams?.get("modal");

  const closeModal = () => {
    const params = new URLSearchParams(
      Array.from(searchParams?.entries() || []),
    );
    params.delete("modal");
    const newSearch = params.toString();
    const href = `${pathname}${newSearch ? `?${newSearch}` : ""}`;
    try {
      router.replace(href);
    } catch {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", href);
      }
    }
  };

  if (!modal) return null;

  if (modal === "resume-screener") {
    return <ResumeScreenerModal isOpen={true} onClose={closeModal} />;
  }

  const renderContent = () => {
    switch (modal) {
      case "signin":
        return <SignInForm onClose={closeModal} />;
      case "signup":
        return <SignUpForm onClose={closeModal} />;
      case "forgot":
        return <ForgotPasswordForm onClose={closeModal} />;
      case "profile":
        return <ProfileView onClose={closeModal} />;
      case "edit-profile":
        return <EditProfileForm onClose={closeModal} />;
      case "security":
        return <SecurityModal onClose={closeModal} />;
      case "settings":
        return <SettingsModal onClose={closeModal} />;
      default:
        return null;
    }
  };

  const titleMap = {
    signin: "Sign In",
    signup: "Sign Up",
    forgot: "Forgot Password",
    profile: "My Profile",
    "edit-profile": "Edit Profile",
    security: "Security Center",
    settings: "Settings & Preferences",
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={closeModal}
      title={titleMap[modal] ?? ""}
    >
      {renderContent()}
    </GlassModal>
  );
}

export default function ModalManager() {
  return (
    <Suspense fallback={null}>
      <ModalManagerContent />
    </Suspense>
  );
}
