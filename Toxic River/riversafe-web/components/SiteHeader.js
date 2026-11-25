"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "แผนที่แม่น้ำ", icon: MapIcon },
  { href: "/chat", label: "แชต AI", icon: ChatIcon },
  { href: "/news", label: "ข่าววันนี้", icon: NewsIcon },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-[1000] bg-white border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <div className="leading-tight">
              <div className="text-[17px] font-bold text-brand">RiverSafe</div>
              <div className="hidden text-[11px] text-muted sm:block">เฝ้าระวังสารหนู แม่น้ำกก–สาย–รวก–โขง</div>
            </div>
          </Link>
          <nav className="ml-auto hidden gap-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-brand-light text-brand" : "text-muted hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <span className="ml-auto rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 md:ml-2">
            ต้นแบบ · ข้อมูลจำลองบางส่วน
          </span>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-3 border-t border-line bg-white md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0f6e74" />
      <path d="M16 6c4 5 7 8.6 7 12a7 7 0 0 1-14 0c0-3.4 3-7 7-12z" fill="#fff" />
      <path d="M11.5 19.5c1.5 1 3 1 4.5 0s3-1 4.5 0" stroke="#0f6e74" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  );
}

function NewsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}
