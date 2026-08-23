"use client";

import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Briefcase,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SkillItem {
  id?: string;
  name: string;
  category: string;
  proficiency: number;
}

export default function EditProfileForm({ onClose }: { onClose?: () => void }) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Frontend");
  const [newSkillProficiency, setNewSkillProficiency] = useState(3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setHeadline(data.headline || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setSkills(data.skills || []);
        }
      } catch {
        setError("Could not load current profile data.");
      } finally {
        setLoading(false);
      }
    }

    loadCurrentProfile();
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    if (
      skills.some(
        (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase(),
      )
    ) {
      setError("This skill is already in your list.");
      return;
    }

    setSkills([
      ...skills,
      {
        name: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: newSkillProficiency,
      },
    ]);

    setNewSkillName("");
    setError(null);
  };

  const handleRemoveSkill = (skillNameToRemove: string) => {
    setSkills(skills.filter((s) => s.name !== skillNameToRemove));
  };

  const handleProficiencyChange = (skillName: string, level: number) => {
    setSkills(
      skills.map((s) =>
        s.name === skillName ? { ...s, proficiency: level } : s,
      ),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          bio: bio.trim(),
          location: location.trim(),
          skills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess(true);
      setTimeout(() => {
        // Return to profile modal
        const url = new URL(window.location.href);
        url.searchParams.set("modal", "profile");
        window.history.replaceState(null, "", url.toString());
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs">Loading profile editor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 text-xs rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-medium">
          Profile saved successfully! Redirecting...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Display Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Professional Headline
        </label>
        <div className="relative">
          <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer | Next.js & Distributed Systems"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Bio / Summary
        </label>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief introduction, engineering interests, and career goals..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>
      </div>

      {/* Skills Manager */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="block text-xs font-semibold text-zinc-200">
          My Skills & Proficiency
        </label>

        {/* Add Skill Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name (e.g. TypeScript)"
            className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="w-full sm:w-32 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Database">Database</option>
            <option value="DevOps">DevOps</option>
            <option value="AI/ML">AI / ML</option>
            <option value="Languages">Languages</option>
          </select>
          <select
            value={newSkillProficiency}
            onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
            className="w-full sm:w-28 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value={1}>L1 - Beginner</option>
            <option value={2}>L2 - Basic</option>
            <option value={3}>L3 - Intermediate</option>
            <option value={4}>L4 - Advanced</option>
            <option value={5}>L5 - Expert</option>
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            className="w-full sm:w-auto p-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl text-xs flex items-center justify-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Selected Skills List */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1 pt-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200">{skill.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                  {skill.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleProficiencyChange(skill.name, lvl)}
                      className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                        skill.proficiency >= lvl
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-zinc-500 hover:bg-white/20"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-center text-xs text-zinc-500 py-3">
              No skills selected. Use the fields above to add your skills.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              const url = new URL(window.location.href);
              url.searchParams.set("modal", "profile");
              window.history.replaceState(null, "", url.toString());
            }
          }}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-white/5 text-xs text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
