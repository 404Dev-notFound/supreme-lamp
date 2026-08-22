// components/SkillsCombobox.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, X } from 'lucide-react';

// Import the static skills data. Adjust relative path based on repository structure.
// The JSON file contains an array of skill objects like { id: string, name: string, category: string }.
import skillsData from '../../../../flowCTRL DATA/skills.json';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface SelectedSkill extends Skill {
  proficiency: number; // 1 - 5 scale
}

interface SkillsComboboxProps {
  selectedSkills: SelectedSkill[];
  setSelectedSkills: (skills: SelectedSkill[]) => void;
}

export default function SkillsCombobox({ selectedSkills, setSelectedSkills }: SkillsComboboxProps) {
  const [query, setQuery] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);

  // Group skills by category for display
  const groupedSkills = filteredSkills.reduce((acc: Record<string, Skill[]>, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  useEffect(() => {
    // Filter skills based on query (name, category, or keyword)
    const normalized = query.toLowerCase();
    const results = (skillsData as Skill[]).filter((skill) => {
      return (
        skill.name.toLowerCase().includes(normalized) ||
        skill.category.toLowerCase().includes(normalized)
      );
    });
    setFilteredSkills(results);
  }, [query]);

  const addSkill = (skill: Skill) => {
    if (selectedSkills.some((s) => s.id === skill.id)) return; // prevent duplicates
    setSelectedSkills([...selectedSkills, { ...skill, proficiency: 3 }]); // default proficiency
  };

  const removeSkill = (id: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== id));
  };

  const updateProficiency = (id: string, proficiency: number) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.id === id ? { ...s, proficiency } : s))
    );
  };

  return (
    <div className="space-y-4">
      {/* Selected skill chips */}
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full"
          >
            <span>{skill.name}</span>
            <select
              value={skill.proficiency}
              onChange={(e) => updateProficiency(skill.id, Number(e.target.value))}
              className="bg-transparent text-primary outline-none"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeSkill(skill.id)}
              className="ml-1 text-primary hover:text-primary/70"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Combobox search */}
      <Combobox as="div" value={null} onChange={(skill: any) => skill && addSkill(skill)}>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search skills..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            {/* Icon can be added here */}
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          {filteredSkills.length > 0 && (
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {Object.entries(groupedSkills).map(([category, skills]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-700">
                    {category}
                  </div>
                  {skills.map((skill) => (
                    <Combobox.Option
                      key={skill.id}
                      value={skill}
                      as={Fragment}
                    >
                      {({ active, selected }) => (
                        <li
                          className={`relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-primary/20 text-primary' : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {skill.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary">
                              <Check className="w-5 h-5" aria-hidden="true" />
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
