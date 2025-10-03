
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { ArchitectProject, useAppState } from "@/app/provider";
import { Briefcase, Loader2, PlusCircle, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsPage() {
  const { user, firestore } = useFirebase();
  const { clearState, isHydrated, projectId, setProjectId } = useAppState();
  const [projects, setProjects] = useState<ArchitectProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) return;

    const projectsColRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsColRef, orderBy('createdAt', 'desc'));

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
          title="Projects"
          subtitle="Manage your analysis projects or start a new one."
          className="mb-0"
        />
        <Link href="/" onClick={handleNewProject}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
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
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <CardDescription>
                  Created {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2"/>
                    {p.uploadedFiles?.length || 0} files uploaded
                </div>
              </CardContent>
              <CardContent>
                 <Link href="/analysis" onClick={() => setProjectId(p.id)}>
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
    </div>
  );
}
