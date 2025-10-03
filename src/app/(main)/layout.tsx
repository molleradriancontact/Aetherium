
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Code,
  Database,
  GitBranch,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleLogout = () => {
    auth.signOut();
    clearState();
  };
  
  if (isUserLoading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter>
            <div className="flex items-center gap-3 p-4">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate">{user.email}</span>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
        </SidebarFooter>
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
