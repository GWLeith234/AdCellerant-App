"use client";

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function DrawerSection({
  title,
  children,
  defaultOpen = true,
}: DrawerSectionProps) {
  return (
    <div className="border-t border-border py-4">
      <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
        {title}
      </h3>
      {defaultOpen && children}
    </div>
  );
}
