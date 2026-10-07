'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Users, Target, BarChart3, Settings } from 'lucide-react';

const NAV_TABS = [
  { href: '/today', label: 'Today', icon: Clock },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-md border-t border-border/80 px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
