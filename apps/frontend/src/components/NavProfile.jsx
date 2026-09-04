"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, Sparkles, ChevronDown, UserCheck } from "lucide-react";

function NavProfileContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openModal = (modal) => {
    setDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", modal);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  }

  // Authenticated State
  if (session?.user) {
    const displayName =
      session.user.name || session.user.email?.split("@")[0] || "User";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const role = session.user.role || "USER";

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 py-1.5 px-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-all cursor-pointer shadow-sm hover:border-white/20"
          aria-label="User Menu"
        >
          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-[10px]">
            {initials}
          </div>
          <span className="max-w-[100px] truncate hidden sm:inline">
            {displayName}
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl p-2 text-xs text-zinc-300 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="font-semibold text-zinc-100 truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {session.user.email}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/20">
                {role}
              </span>
            </div>

            <button
              onClick={() => openModal("profile")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer text-zinc-200"
            >
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              My Profile
            </button>

            <button
              onClick={() => openModal("edit-profile")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer text-zinc-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Edit Profile & Skills
            </button>

            <div className="border-t border-white/10 my-1" />

            <button
              onClick={() => {
                setDropdownOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 text-left transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Guest / Unauthenticated State
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => openModal("signin")}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5 text-zinc-400" />
        Sign In
      </button>

      <button
        onClick={() => openModal("signup")}
        className="text-xs font-semibold bg-white text-black px-3.5 py-1.5 rounded-full hover:bg-zinc-200 transition-all cursor-pointer shadow-sm hover:shadow-white/10"
      >
        Sign Up
      </button>
    </div>
  );
}

export default function NavProfile() {
  return (
    <Suspense
      fallback={
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
      }
    >
      <NavProfileContent />
    </Suspense>
  );
}
