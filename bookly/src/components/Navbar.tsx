"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

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

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/groups"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Groups
          </Link>
          <Link
            href="/books"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Search
          </Link>
          <Link
            href="/my-books"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            My Books
          </Link>
          <Link
            href="/log"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Log
          </Link>
          <Link
            href="/recommendations"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            For You
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
