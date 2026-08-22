// components/NavProfile.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User } from "lucide-react";

export default function NavProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openModal = (modal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", modal);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={() => openModal("profile")}
      className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
      aria-label="Open Profile"
    >
      <User className="w-5 h-5" />
    </button>
  );
}
