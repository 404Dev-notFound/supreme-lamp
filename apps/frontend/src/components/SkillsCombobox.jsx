"use client";

import React, { useState, useMemo, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Check, X } from "lucide-react";
import skillsData from "../../../../flowCTRL DATA/skills.json";

export default function SkillsCombobox({
  selectedSkills = [],
  setSelectedSkills,
}) {
  const [query, setQuery] = useState("");

  const filteredSkills = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return skillsData || [];
    return (skillsData || []).filter((skill) => {
      return (
        skill.name.toLowerCase().includes(normalized) ||
        skill.category.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  // Group skills by category for display
  const groupedSkills = useMemo(() => {
    return filteredSkills.reduce((acc, skill) => {
      const cat = skill.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});
  }, [filteredSkills]);

  const addSkill = (skill) => {
    if (
      !skill ||
      selectedSkills.some(
        (s) =>
          s.id === skill.id ||
          s.name.toLowerCase() === skill.name.toLowerCase(),
      )
    )
      return;
    setSelectedSkills([...selectedSkills, { ...skill, proficiency: 3 }]);
  };

  const removeSkill = (id) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== id));
  };

  const updateProficiency = (id, proficiency) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.id === id ? { ...s, proficiency } : s)),
    );
  };

  return (
    <div className="space-y-4">
      {/* Selected skill chips */}
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <div
            key={skill.id || skill.name}
            className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-amber-300 rounded-full text-xs"
          >
            <span>{skill.name}</span>
            <select
              value={skill.proficiency || 3}
              onChange={(e) =>
                updateProficiency(skill.id, Number(e.target.value))
              }
              className="bg-transparent text-amber-300 outline-none text-xs font-semibold cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v} className="bg-zinc-900 text-white">
                  Lvl {v}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeSkill(skill.id)}
              className="ml-1 text-amber-300/70 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Combobox search */}
      <Combobox
        as="div"
        value={null}
        onChange={(skill) => skill && addSkill(skill)}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-xl border border-white/10 glass bg-white/5 py-2.5 pl-3 pr-10 text-sm leading-5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
            placeholder="Search skills (e.g. React, Python, Docker)..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            {/* Combobox button toggle */}
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          {filteredSkills.length > 0 && (
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl glass-card border border-white/10 py-1 text-base shadow-2xl focus:outline-none sm:text-sm z-50">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5">
                    {category}
                  </div>
                  {skills.map((skill) => (
                    <Combobox.Option key={skill.id} value={skill} as={Fragment}>
                      {({ active, selected }) => (
                        <li
                          className={`relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                            active
                              ? "bg-orange-500/20 text-amber-300"
                              : "text-zinc-200"
                          }`}
                        >
                          <span
                            className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}
                          >
                            {skill.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-orange-400">
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </li>
                      )}
                    </Combobox.Option>
                  ))}
                </div>
              ))}
            </Combobox.Options>
          )}
        </Transition>
      </Combobox>
    </div>
  );
}
