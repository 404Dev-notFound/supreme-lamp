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
  Sparkles,
  Link as LinkIcon,
  Globe,
} from "lucide-react";

function Github(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function Linkedin(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 5.8a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const POPULAR_SKILLS = [
  { name: "TypeScript", category: "Languages" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Python", category: "Languages" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Docker", category: "DevOps" },
  { name: "GraphQL", category: "Backend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "Redis", category: "Database" },
  { name: "AWS", category: "DevOps" },
  { name: "Git", category: "DevOps" },
];

export default function EditProfileForm({ onClose }) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Frontend");
  const newSkillProficiency = 3;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.displayName || data.name || "");
          setHeadline(data.headline || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setAvatarUrl(data.avatarUrl || data.image || "");
          setWebsiteUrl(data.websiteUrl || "");
          setGithubUrl(data.githubUrl || "");
          setLinkedinUrl(data.linkedinUrl || "");
          setTwitterUrl(data.twitterUrl || "");
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

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
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

  const handleAddQuickSkill = (quickSkill) => {
    if (
      skills.some((s) => s.name.toLowerCase() === quickSkill.name.toLowerCase())
    ) {
      return;
    }
    setSkills([
      ...skills,
      {
        name: quickSkill.name,
        category: quickSkill.category,
        proficiency: 4,
      },
    ]);
  };

  const handleRemoveSkill = (skillNameToRemove) => {
    setSkills(skills.filter((s) => s.name !== skillNameToRemove));
  };

  const handleProficiencyChange = (skillName, level) => {
    setSkills(
      skills.map((s) =>
        s.name === skillName ? { ...s, proficiency: level } : s,
      ),
    );
  };

  const handleSave = async (e) => {
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
          avatarUrl: avatarUrl.trim(),
          websiteUrl: websiteUrl.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          twitterUrl: twitterUrl.trim(),
          skills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess(true);
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("modal", "profile");
        window.history.replaceState(null, "", url.toString());
      }, 500);
    } catch (err) {
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

      {/* Section 1: Basic Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Display Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Professional Headline
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Avatar Image URL
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1">
          Bio / Summary
        </label>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief introduction, engineering interests, and career goals..."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>
      </div>

      {/* Section 2: Portfolio & Social Links */}
      <div className="space-y-2.5 pt-2 border-t border-white/10">
        <label className="block text-xs font-semibold text-zinc-200">
          Portfolio & Social Presence
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourportfolio.dev"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <Github className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <Linkedin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <TwitterIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Skills Manager */}
      <div className="space-y-2.5 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-200">
            My Skills & Proficiency
          </label>
          <span className="text-[10px] text-zinc-400">
            {skills.length} selected
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Add:
          </span>
          {POPULAR_SKILLS.map((qs) => {
            const isAdded = skills.some(
              (s) => s.name.toLowerCase() === qs.name.toLowerCase(),
            );
            return (
              <button
                key={qs.name}
                type="button"
                onClick={() => handleAddQuickSkill(qs)}
                disabled={isAdded}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  isAdded
                    ? "bg-white/5 border-white/5 text-zinc-400 cursor-not-allowed"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-primary/20 hover:text-primary hover:border-primary/30"
                }`}
              >
                {isAdded ? `✓ ${qs.name}` : `+ ${qs.name}`}
              </button>
            );
          })}
        </div>

        {/* Add Custom Skill Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Custom skill name (e.g. Rust)"
            className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="w-full sm:w-32 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="Languages">Languages</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Database">Database</option>
            <option value="DevOps">DevOps</option>
            <option value="AI / ML">AI / ML</option>
            <option value="Security">Security</option>
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Skills List with Proficiency selector */}
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
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
                      onClick={() =>
                        handleProficiencyChange(skill.name, lvl)
                      }
                      className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        skill.proficiency >= lvl
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-zinc-400 hover:bg-white/20"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <p className="text-center text-xs text-zinc-400 py-3">
              No skills selected yet. Click the quick-add buttons above or add
              custom skills.
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
