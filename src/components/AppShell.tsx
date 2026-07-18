"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    label: "Quotations",
    href: "/quotations",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
        <Link href="/quotations" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#c8a44e] flex items-center justify-center">
            <span className="text-white font-bold text-xs leading-none">JG</span>
          </div>
          <div>
            <h1 className="text-[13px] font-semibold text-zinc-100 leading-tight tracking-tight">Quotation Gen</h1>
            <p className="text-[10px] text-zinc-500 leading-tight">JGD Golden Dragon</p>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                ${isActive
                  ? "bg-zinc-800/80 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 py-3 border-t border-zinc-800/60">
        <button
          onClick={() => {
            setSidebarOpen(false);
            handleLogout();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800/60 flex-shrink-0">
        <Link href="/quotations" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#c8a44e] flex items-center justify-center">
            <span className="text-white font-bold text-xs leading-none">JG</span>
          </div>
          <div>
            <h1 className="text-[13px] font-semibold text-zinc-100 leading-tight tracking-tight">Quotation Gen</h1>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-zinc-950 border-r border-zinc-800/60 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay/drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer content */}
          <aside className="relative flex w-56 max-w-xs flex-col bg-zinc-950 border-r border-zinc-800/60">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
