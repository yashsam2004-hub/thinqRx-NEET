"use client";

import Link from "next/link";

type NavSection = { id: string; title: string };

export default function SideNav({ sections }: { sections: NavSection[] }) {
  if (!sections.length) return null;

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">On this page</h3>
        <nav className="mt-3 space-y-2">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className="block text-sm text-slate-600 hover:text-slate-900"
            >
              {section.title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
