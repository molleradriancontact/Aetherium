
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { ArchitectProject, CollaboratorDetails } from "@/app/provider";
import { useAppState } from "@/hooks/use-app-state";
import { Globe, LayoutGrid, Loader2, Lock, Trash2, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { useTransition, useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserProfile {
    projects?: { projectId: string; projectPath: string }[];
}

export default function ProjectsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { isHydrated, setProjectId, clearState, projectId: activeProjectId } = useAppState();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const [allProjects, setAllProjects] = useState<(ArchitectProject & {path: string})[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (isUserLoading || !firestore || !user?.uid) {
        if (!isUserLoading) {
            setIsLoadingProjects(false);
        }
        return;
    };

    const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const userProfileRef = doc(firestore, 'users', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (!userProfileSnap.exists()) {
                setAllProjects([]);
                return;
            }
            
            const userProfile = userProfileSnap.data() as UserProfile;
            const projectRefs = userProfile.projects || [];

            if (projectRefs.length === 0) {
                setAllProjects([]);
                return;
            }

            const projectPromises = projectRefs.map(pRef => getDoc(doc(firestore, pRef.projectPath)));
            const projectSnaps = await Promise.all(projectPromises);
            
            const projects = projectSnaps
                .filter(snap => snap.exists())
                .map(snap => ({ ...snap.data(), id: snap.id, path: snap.ref.path } as ArchitectProject & {path: string}));
            
            projects.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

            setAllProjects(projects);

        } catch (error) {
            console.error("Error fetching projects:", error);
            toast({ title: "Failed to load projects", variant: 'destructive'});
            setAllProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    }
    fetchProjects();

  }, [user?.uid, firestore, isUserLoading, toast]);


  const isLoading = isUserLoading || isLoadingProjects;

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
             setAllProjects(prev => prev.filter(p => p.id !== projectId));
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

  const handleSelectProject = (project: ArchitectProject & {path: string}) => {
    setProjectId(project.id, project.path);
    router.push('/');
  }

  const handleNewProject = () => {
    clearState(true); // forceNav to /prototype
    router.push('/prototype');
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
        subtitle="Manage all your projects and browse public ones."
      />
      <div className="flex justify-end">
          <Button onClick={handleNewProject}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Project
          </Button>
      </div>

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
                <Card key={project.id} className={`flex flex-col ${project.id === activeProjectId ? 'border-primary' : ''}`}>
                    <CardHeader>
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        <CardDescription>
                            Created on {project.createdAt ? format(new Date(project.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Date unknown'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {project.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            <span>{project.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                         {project.collaboratorDetails && project.collaboratorDetails.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div className="flex -space-x-2 overflow-hidden">
                                     <TooltipProvider>
                                        {project.collaboratorDetails.map((c: CollaboratorDetails) => (
                                            <Tooltip key={c.id}>
                                                <TooltipTrigger asChild>
                                                    <Avatar className="h-6 w-6 border-2 border-background">
                                                        <AvatarImage src={c.photoURL ?? undefined} alt={c.username} />
                                                        <AvatarFallback>{c.username?.[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{c.username}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </TooltipProvider>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardContent className="flex items-center justify-between gap-2">
                         <Button onClick={() => handleSelectProject(project)}>Open Project</Button>
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
