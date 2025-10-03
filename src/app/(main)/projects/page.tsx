'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { ArchitectProject, useAppState } from "@/app/provider";
import { Briefcase, Loader2, PlusCircle, ArrowRight, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteProject } from "@/app/actions";

export default function ProjectsPage() {
  const { user, firestore } = useFirebase();
  const { clearState, isHydrated, projectId, setProjectId } = useAppState();
  const [projects, setProjects] = useState<ArchitectProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, startDeleting] = useTransition();
  const [projectToDelete, setProjectToDelete] = useState<ArchitectProject | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    if (!user || !firestore) return;

    const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsColRef, where('projectType', '==', 'analysis'), orderBy('createdAt', 'desc'));

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

  const handleNewProject = () => {
    clearState(true);
  };
  
  const handleDeleteConfirm = () => {
    if (!projectToDelete || !user) return;
    startDeleting(async () => {
        try {
            await deleteProject(user.uid, projectToDelete.id);
            toast({
                title: "Project Deleted",
                description: `"${projectToDelete.name}" has been permanently deleted.`
            });
            if (projectId === projectToDelete.id) {
                clearState(false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Deletion Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setProjectToDelete(null);
        }
    })
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
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Analysis Projects"
          subtitle="Manage your analysis projects or start a new one."
          className="mb-0"
        />
        <Link href="/" onClick={handleNewProject}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Analysis
            </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Projects Found</CardTitle>
            <CardDescription className="mt-2">
                Get started by creating your first project analysis in The Lab.
            </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle className="text-xl">{p.name}</CardTitle>
                        <CardDescription>
                        Created {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setProjectToDelete(p)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2"/>
                    {p.uploadedFiles?.length || 0} files uploaded
                </div>
              </CardContent>
              <CardContent>
                 <Link href="/" onClick={() => setProjectId(p.id)}>
                    <Button className="w-full" variant={p.id === projectId ? 'default' : 'secondary'}>
                        {p.id === projectId ? 'Currently Viewing' : 'View Project'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                <span className="font-semibold text-foreground">"{projectToDelete?.name}"</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
