"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
  { href: "/books", label: "Search" },
  { href: "/my-books", label: "My Books" },
  { href: "/log", label: "Log" },
  { href: "/recommendations", label: "For You" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          Bookly
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-indigo-600 font-medium"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="block w-full text-left py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
