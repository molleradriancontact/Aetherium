'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { ArchitectProject } from "@/app/provider";
import { useAppState } from "@/hooks/use-app-state";
import { Globe, LayoutGrid, Loader2, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, onSnapshot, orderBy, collectionGroup, where } from "firebase/firestore";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteProject } from "@/app/actions";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCollection } from "@/firebase/firestore/use-collection";

export default function ProjectsPage() {
  const { user, firestore } = useFirebase();
  const { isHydrated, setProjectId, clearState, projectId: activeProjectId } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const publicProjectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy("createdAt", "desc"));
  }, [firestore]);

  const userProjectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'projects'), orderBy("createdAt", "desc"));
  }, [user, firestore]);

  const { data: publicProjects, isLoading: isLoadingPublic } = useCollection<ArchitectProject>(publicProjectsQuery);
  const { data: userProjects, isLoading: isLoadingUser } = useCollection<ArchitectProject>(userProjectsQuery);

  const allProjects = useMemoFirebase(() => {
    const combined = [...(publicProjects || []), ...(userProjects || [])];
    const uniqueProjects = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return uniqueProjects.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }, [publicProjects, userProjects]);

  const isLoading = isLoadingPublic || isLoadingUser;

  const handleDelete = (projectId: string) => {
    if (!user) return;
    startDeleting(async () => {
        try {
            await deleteProject(projectId);
            toast({
                title: "Project Deleted",
                description: "The project has been successfully removed."
            });
            if (activeProjectId === projectId) {
                clearState(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Deletion Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    });
  }

  const handleSelectProject = (projectId: string) => {
    setProjectId(projectId);
    router.push('/');
  }

  if (!isHydrated || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="All Projects"
        subtitle="Manage all of your private projects and browse public ones."
      />

      {allProjects && allProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Projects Found</CardTitle>
            <CardDescription className="mt-2">
                Create a project in the Prototype page to get started.
            </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProjects && allProjects.map((project) => (
                <Card key={project.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        <CardDescription>
                            Created on {project.createdAt ? format(new Date(project.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Date unknown'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {project.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            <span>{project.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                    </CardContent>
                    <CardContent className="flex items-center justify-between gap-2">
                         <Button onClick={() => handleSelectProject(project.id)}>Open Project</Button>
                         {user?.uid === project.userId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your project
                                        and remove its data from our servers.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
