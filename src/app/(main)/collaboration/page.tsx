
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { ArchitectProject, CollaboratorDetails } from "@/app/provider";
import { useAppState } from "@/hooks/use-app-state";
import { Users, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useTransition } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addCollaborator, removeCollaborator } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function CollaborationPage() {
  const { user, firestore } = useFirebase();
  const { isHydrated } = useAppState();
  const [projects, setProjects] = useState<ArchitectProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [inviteEmails, setInviteEmails] = useState<{[key: string]: string}>({});
  const [isInviting, startInviting] = useTransition();
  const [isRemoving, startRemoving] = useTransition();

  useEffect(() => {
    if (!user || !firestore) return;

    const projectsRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
  
  const handleInvite = (projectId: string) => {
    const inviteEmail = inviteEmails[projectId] || "";
    if (!inviteEmail.trim() || !user) return;

    startInviting(async () => {
        try {
            await addCollaborator(user.uid, projectId, inviteEmail);
            toast({
                title: "Collaborator Added",
                description: `${inviteEmail} has been added to the project.`
            });
            setInviteEmails(prev => ({...prev, [projectId]: ""}));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Invitation Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    });
  }

  const handleRemove = (projectId: string, collaboratorId: string) => {
    if (!user) return;
    startRemoving(async () => {
        try {
            await removeCollaborator(user.uid, projectId, collaboratorId);
            toast({
                title: "Collaborator Removed",
                description: `The user has been removed from the project.`
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Removal Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    });
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
          title="Project Collaboration"
          subtitle="Manage collaborators for your analysis and chat projects."
        />

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Projects Found</CardTitle>
            <CardDescription className="mt-2">
                Create a project in The Lab to start collaborating.
            </CardDescription>
        </Card>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>Expand a project to manage its collaborators.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {projects.map((project) => (
                        <AccordionItem key={project.id} value={project.id}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium">{project.name}</span>
                                    <span className="text-sm text-muted-foreground">({project.projectType})</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Invite Collaborator</h4>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="email" 
                                            placeholder="user@example.com"
                                            value={inviteEmails[project.id] || ""}
                                            onChange={(e) => setInviteEmails(prev => ({...prev, [project.id]: e.target.value}))}
                                            disabled={isInviting}
                                        />
                                        <Button onClick={() => handleInvite(project.id)} disabled={isInviting || !(inviteEmails[project.id] || "").trim()}>
                                            {isInviting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Current Collaborators</h4>
                                    <div className="space-y-2">
                                        {project.collaboratorDetails && project.collaboratorDetails.length > 0 ? (
                                            project.collaboratorDetails.map(collaborator => (
                                                <div key={collaborator.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                                    <div className="flex items-center gap-3">
                                                         <Avatar className="h-8 w-8">
                                                            <AvatarImage src={collaborator.photoURL || undefined} />
                                                            <AvatarFallback>{collaborator.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{collaborator.username}</p>
                                                            <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(project.id, collaborator.id)} disabled={isRemoving}>
                                                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No collaborators yet.</p>
                                        )}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
