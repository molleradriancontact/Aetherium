
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { ArchitectProject } from "@/app/provider";
import { useAppState } from "@/hooks/use-app-state";
import { LayoutGrid, Loader2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
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

export default function ProjectsPage() {
  const { user, firestore } = useFirebase();
  const { isHydrated, setProjectId, clearState } = useAppState();
  const [projects, setProjects] = useState<ArchitectProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  useEffect(() => {
    if (!user || !firestore) return;

    const projectsRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userProjects = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as ArchitectProject;
      });

      setProjects(userProjects);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);
  
  const handleDelete = (projectId: string) => {
    if (!user) return;
    startDeleting(async () => {
        try {
            await deleteProject(user.uid, projectId);
            toast({
                title: "Project Deleted",
                description: "The project has been successfully removed."
            });
            clearState(false);
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
        title="Your Projects"
        subtitle="Manage all of your analysis and chat projects."
      />

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Projects Found</CardTitle>
            <CardDescription className="mt-2">
                Create a project in The Lab to get started.
            </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <Card key={project.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        <CardDescription>
                            Created on {format(project.createdAt, 'MMM d, yyyy')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {project.projectType === 'chat' ? (
                                <Users className="h-4 w-4" />
                            ) : (
                                <LayoutGrid className="h-4 w-4" />
                            )}
                            {project.projectType && (
                                <span>{project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}</span>
                            )}
                        </div>
                    </CardContent>
                    <CardContent className="flex items-center justify-between gap-2">
                         <Button onClick={() => handleSelectProject(project.id)}>Open Project</Button>
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
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
