"use client";

export interface Tab {
  key: string;
  label: string;
  count: number;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onSelect: (key: string) => void;
}

export default function TabBar({ tabs, active, onSelect }: TabBarProps) {
  return (
    <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            active === tab.key
              ? "bg-blue text-white"
              : "text-muted hover:text-white hover:bg-navy/50"
          }`}
        >
          {tab.label}
          <span
            className={`ml-1.5 text-xs ${
              active === tab.key ? "text-white/70" : "text-muted"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
