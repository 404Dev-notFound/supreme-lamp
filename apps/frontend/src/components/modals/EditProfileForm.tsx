// src/components/modals/EditProfileForm.tsx
"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface EditProfileFormProps {
  onClose: () => void;
}

export default function EditProfileForm({ onClose }: EditProfileFormProps) {
  const [selectedSkills, setSelectedSkills] = useState<Array<{ id: string; name: string; category: string; proficiency: number }>>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selectedSkills }),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Edit Profile</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      {/* Placeholder for skills combobox – replace with actual component later */}
      <p className="text-gray-600 dark:text-gray-300">Profile editing UI goes here.</p>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
