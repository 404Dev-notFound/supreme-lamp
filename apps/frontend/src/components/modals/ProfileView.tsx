// src/components/modals/ProfileView.tsx
"use client";
import { useState, useEffect } from "react";

interface ProfileViewProps {
  onClose: () => void;
}

export default function ProfileView({ onClose }: ProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder fetch – replace with real API as needed
    fetch("/api/user/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading profile…</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">My Profile</h3>
      {profile ? (
        <pre className="bg-gray-800 text-white p-2 rounded">
          {JSON.stringify(profile, null, 2)}
        </pre>
      ) : (
        <p className="text-gray-400">No profile data found.</p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
