
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/app/provider';
import { Logo } from '@/components/logo';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Code,
  Database,
  GitBranch,
} from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analysis', label: 'Analysis Report', icon: FileText },
  { href: '/frontend', label: 'Frontend', icon: Code },
  { href: '/backend', label: 'Backend', icon: Database },
  { href: '/history', label: 'History', icon: GitBranch },
];

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { clearState } = useAppState();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group/logo" onClick={clearState}>
            <Logo className="size-8 text-primary transition-transform group-hover/logo:rotate-[-15deg]" />
            <span className="font-headline text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              OS Architect
            </span>
          </Link>
        </SidebarHeader>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-[calc(100vh-2rem)] flex-1 p-4 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ProviderWrappedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <MainLayout>{children}</MainLayout>
        </AppProvider>
    )
}
