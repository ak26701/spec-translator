"use client";

import {
  ContributorRole,
  SeniorityLevel,
  RoleSelection,
  ROLE_LABELS,
  SENIORITY_LABELS,
  ALL_ROLES,
  ALL_SENIORITY_LEVELS,
} from "@/lib/prompts";

interface RoleSelectorProps {
  selections: RoleSelection[];
  onChange: (selections: RoleSelection[]) => void;
  detecting: boolean;
  disabled?: boolean;
}

export default function RoleSelector({ selections, onChange, detecting, disabled }: RoleSelectorProps) {
  const selectedRoles = selections.map((s) => s.role);

  const updateSeniority = (role: ContributorRole, seniority: SeniorityLevel) => {
    onChange(selections.map((s) => (s.role === role ? { ...s, seniority } : s)));
  };

  const removeRole = (role: ContributorRole) => {
    onChange(selections.filter((s) => s.role !== role));
  };

  const addRole = (role: ContributorRole) => {
    if (selectedRoles.includes(role)) return;
    onChange([...selections, { role, seniority: "associate" }]);
  };

  const availableToAdd = ALL_ROLES.filter((r) => !selectedRoles.includes(r));

  if (detecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Detecting relevant roles from brief...
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {selections.length === 0 && (
        <p className="text-sm text-gray-400">No roles detected. Add one below.</p>
      )}

      {/* Detected role rows */}
      {selections.map(({ role, seniority }) => (
        <div key={role} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800">{ROLE_LABELS[role]}</span>
          </div>
          <select
            value={seniority}
            onChange={(e) => updateSeniority(role, e.target.value as SeniorityLevel)}
            disabled={disabled}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ALL_SENIORITY_LEVELS.map((level) => (
              <option key={level} value={level}>{SENIORITY_LABELS[level]}</option>
            ))}
          </select>
          <button
            onClick={() => removeRole(role)}
            disabled={disabled}
            className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
            aria-label="Remove role"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add more roles */}
      {availableToAdd.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-xs text-gray-400">Add role:</span>
          {availableToAdd.map((role) => (
            <button
              key={role}
              onClick={() => addRole(role)}
              disabled={disabled}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
