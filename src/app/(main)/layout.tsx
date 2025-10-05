
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
  FileText,
  Code,
  Database,
  GitBranch,
  LogOut,
  FlaskConical,
  Home,
  User,
  LayoutGrid,
  Users,
  BrainCircuit,
  Search,
  Film,
  Clapperboard,
  BookOpen,
  Mail,
} from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { ProjectSwitcher } from '@/components/project-switcher';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-code-pro',
});

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: LayoutGrid },
  { href: '/analysis', label: 'Analysis Report', icon: FileText },
  { href: '/frontend', label: 'Frontend', icon: Code },
  { href: '/backend', label: 'Backend', icon: Database },
  { href: '/prototype', label: 'Prototype', icon: FlaskConical },
  { href: '/collaboration', label: 'Collaboration', icon: Users },
  { href: '/invitations', label: 'Invitations', icon: Mail },
  { href: '/synthesis', label: 'Synthesis', icon: BrainCircuit },
  { href: '/research', label: 'Deep Research', icon: Search },
  { href: '/generative-media', label: 'Generative Media', icon: Film },
  { href: '/studio', label: 'Studio', icon: Clapperboard },
  { href: '/history', label: 'History', icon: GitBranch },
  { href: '/academy/about', label: 'About', icon: BookOpen },
  { href: '/account', label: 'Account', icon: User },
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

  const handleLogout = async () => {
    if (auth) {
        sessionStorage.setItem('manual_logout', 'true');
        await auth.signOut();
        clearState(true); // Force clear and navigate
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    clearState(true); // Force clear and navigate to home
  }
  
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
        <SidebarHeader className="p-2 space-y-2">
           <div className="flex items-center gap-2 p-2">
             <Link href="/" className="flex items-center gap-2 group/logo" onClick={handleLogoClick}>
                <Logo className="size-8 text-primary transition-transform group-hover/logo:rotate-[-15deg]" />
             </Link>
             <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <Link href="/" onClick={handleLogoClick} className="font-headline text-xl font-semibold text-primary">Aetherium</Link>
             </div>
           </div>
          <ProjectSwitcher />
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
            <Link href="/account" className="flex items-center gap-3 p-4 hover:bg-sidebar-accent rounded-md">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate">{user.displayName || user.email}</span>
                </div>
            </Link>
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
            <main className={`${inter.variable} ${sourceCodePro.variable}`}>
              <MainLayout>{children}</MainLayout>
            </main>
        </AppProvider>
    )
}
