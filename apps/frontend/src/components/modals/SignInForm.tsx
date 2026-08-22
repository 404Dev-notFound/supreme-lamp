// src/components/modals/SignInForm.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";

interface SignInFormProps {
  onClose: () => void;
}

export default function SignInForm({ onClose }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Sign In</h3>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full rounded border border-gray-300 px-3 py-2 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full rounded border border-gray-300 px-3 py-2 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            // Switch to sign up modal
            const url = new URL(window.location.href);
            url.searchParams.set("modal", "signup");
            window.history.replaceState(null, "", url.toString());
          }}
          className="text-primary hover:underline"
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("modal", "forgot");
            window.history.replaceState(null, "", url.toString());
          }}
          className="text-primary hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}
