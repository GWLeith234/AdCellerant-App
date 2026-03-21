"use client";

import { useState, useEffect } from "react";

interface DrawerSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** When true, forces the section open (overrides user toggle). Resets on deal change. */
  forceOpen?: boolean;
}

export default function DrawerSection({
  title,
  icon,
  children,
  defaultOpen = true,
  forceOpen,
}: DrawerSectionProps) {
  const [open, setOpen] = useState(forceOpen ?? defaultOpen);

  // Sync with forceOpen when it changes (e.g. deal switch)
  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 text-left hover:opacity-80 transition-opacity"
      >
        {icon && <span className="text-muted flex-shrink-0">{icon}</span>}
        <h3 className="text-white text-xs font-semibold uppercase tracking-wider flex-1">
          {title}
        </h3>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}
