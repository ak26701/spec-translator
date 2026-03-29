"use client";

import { ContributorRole, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/prompts";

const ROLE_ICONS: Record<ContributorRole, string> = {
  dev: "⌨",
  qa: "🔎",
  financial: "📊",
  hr: "👥",
};

interface RoleSelectorProps {
  selected: ContributorRole[];
  onChange: (roles: ContributorRole[]) => void;
  disabled?: boolean;
}

const ALL_ROLES: ContributorRole[] = ["dev", "qa", "financial", "hr"];

export default function RoleSelector({ selected, onChange, disabled }: RoleSelectorProps) {
  const toggle = (role: ContributorRole) => {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-gray-700 mb-3">
        Generate instructions for
        <span className="text-gray-400 font-normal ml-1">(select one or more)</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ALL_ROLES.map((role) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggle(role)}
              disabled={disabled}
              className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all
                ${active
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-xl">{ROLE_ICONS[role]}</span>
              <span className={`text-sm font-semibold ${active ? "text-blue-700" : "text-gray-800"}`}>
                {ROLE_LABELS[role]}
              </span>
              <span className="text-xs text-gray-400 leading-snug">{ROLE_DESCRIPTIONS[role]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
