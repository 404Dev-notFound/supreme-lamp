"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthContextProvider } from "../hooks/useAuth";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}
