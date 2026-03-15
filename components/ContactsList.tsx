"use client";

import type { ContactInfo } from "@/lib/hubspot";

interface ContactsListProps {
  contacts: ContactInfo[];
}

export default function ContactsList({ contacts }: ContactsListProps) {
  if (contacts.length === 0) {
    return <p className="text-muted text-xs">No contacts associated</p>;
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center flex-shrink-0">
            <span className="text-blue text-xs font-semibold">{contact.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm truncate">{contact.name}</p>
            <p className="text-muted text-xs truncate">{contact.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
