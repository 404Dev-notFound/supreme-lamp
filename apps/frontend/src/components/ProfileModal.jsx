"use client";

import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Save, AlertCircle } from "lucide-react";
import SkillsCombobox from "./SkillsCombobox";

export default function ProfileModal({ isOpen, setOpen }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.skills)) {
            setSelectedSkills(data.skills);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selectedSkills }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile skills.");
      }
      setOpen(false);
    } catch (err) {
      setError(err.message || "Failed to update profile skills.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl glass-card border border-white/10 p-8 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-white tracking-tight"
                  >
                    Edit Profile – Skills Catalog
                  </Dialog.Title>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-2">
                  <SkillsCombobox
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                  />
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
