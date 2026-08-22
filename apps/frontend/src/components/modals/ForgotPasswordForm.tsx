// src/components/modals/ForgotPasswordForm.tsx
"use client";
import { useState } from "react";

interface ForgotPasswordFormProps {
  onClose: () => void;
}

export default function ForgotPasswordForm({
  onClose,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    // Placeholder: simulate API call
    setTimeout(() => {
      setLoading(false);
      setMessage("If an account exists, a password reset link has been sent.");
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Forgot Password</h3>
      {message && <p className="text-sm text-green-400">{message}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded border border-gray-300 px-3 py-2 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="mr-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </div>
    </form>
  );
}
