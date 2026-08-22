// src/components/modals/ModalManager.tsx
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import GlassModal from "./GlassModal";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ProfileView from "./ProfileView";
import EditProfileForm from "./EditProfileForm";

function ModalManagerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modal = searchParams?.get("modal");

  const closeModal = () => {
    // Remove the modal query param while preserving other params
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("modal");
    const newSearch = params.toString();
    const href = `${pathname}${newSearch ? `?${newSearch}` : ""}`;
    router.replace(href);
  };

  if (!modal) return null;

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
      default:
        return null;
    }
  };

  const titleMap: Record<string, string> = {
    signin: "Sign In",
    signup: "Sign Up",
    forgot: "Forgot Password",
    profile: "My Profile",
    "edit-profile": "Edit Profile",
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
