'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { useAppState, ArchitectProject } from "@/app/provider";
import { Loader2, Users, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addCollaborator, removeCollaborator } from "@/app/actions";
import { useTransition } from "react";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";

const collaboratorSchema = z.object({
  email: z.string().email("Invalid email address."),
});

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>;

export default function CollaborationPage() {
  const { user, firestore } = useFirebase();
  const { projectId, isHydrated, projectOwnerId, collaboratorDetails } = useAppState();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isOwner = user?.uid === projectOwnerId;

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CollaboratorFormValues>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: { email: "" }
  });

  const handleAddCollaborator = (data: CollaboratorFormValues) => {
    if (!isOwner || !projectId || !user) return;
    startTransition(async () => {
      try {
        await addCollaborator(user.uid, projectId, data.email);
        toast({
          title: "Collaborator Added",
          description: `An invitation has been sent to ${data.email}.`,
        });
        reset();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Failed to Add Collaborator",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  }

  const handleRemoveCollaborator = (collaborator: any) => {
    if (!isOwner || !projectId || !user) return;
    startTransition(async () => {
      try {
        await removeCollaborator(user.uid, projectId, collaborator.id, collaborator);
        toast({
          title: "Collaborator Removed",
          description: "The user has been removed from the project.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Failed to Remove Collaborator",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  }

  if (!isHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Collaboration" subtitle="Manage who has access to your project." />
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <CardTitle className="mt-4">No Project Selected</CardTitle>
          <CardDescription className="mt-2">
            Please select a project to manage its collaborators.
          </CardDescription>
          <Link href="/projects">
            <Button className="mt-6">Go to Projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Collaboration" subtitle="Manage who has access to your project." />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Collaborators</CardTitle>
              <CardDescription>These users have access to this project.</CardDescription>
            </CardHeader>
            <CardContent>
              {collaboratorDetails && collaboratorDetails.length > 0 ? (
                <ul className="space-y-4">
                  {collaboratorDetails.map(c => (
                    <li key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={c.photoURL ?? undefined} />
                          <AvatarFallback>{c.username?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{c.username}</p>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                      {isOwner && c.id !== user?.uid && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPending}>
                              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Collaborator?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {c.username} from this project? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveCollaborator(c)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No other collaborators on this project yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {isOwner && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Collaborator</CardTitle>
                <CardDescription>Enter the email address of the user you want to add.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleAddCollaborator)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                     <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                          <div className="relative">
                            <Input id="email" type="email" placeholder="collaborator@example.com" {...field} disabled={isSubmitting || isPending} />
                            <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isSubmitting || isPending}>
                              {isSubmitting || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
