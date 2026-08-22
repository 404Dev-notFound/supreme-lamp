// src/components/modals/SignUpForm.tsx
"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface SignUpFormProps {
  onClose: () => void;
}

export default function SignUpForm({ onClose }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Placeholder: simulate API call
    setTimeout(() => {
      setLoading(false);
      // Assume success
      onClose();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="w-full rounded border border-gray-300 px-3 py-2 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
      />
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
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("modal", "signin");
            window.history.replaceState(null, "", url.toString());
          }}
          className="text-primary hover:underline"
        >
          Already have an account?
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>
      </div>
    </form>
  );
}
