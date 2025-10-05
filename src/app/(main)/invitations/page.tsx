
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { Loader2, Mail, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useCollection } from "@/firebase/firestore/use-collection";
import { acceptInvitation, declineInvitation } from "@/app/actions";

interface Invitation {
    id: string;
    projectId: string;
    projectName: string;
    invitedByUsername: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: any;
}

export default function InvitationsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, startProcessing] = useTransition();

  const invitationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/invitations`),
      where("status", "==", "pending")
    );
  }, [user, firestore]);

  const { data: invitations, isLoading: isLoadingInvitations } = useCollection<Invitation>(invitationsQuery);
  const isLoading = isUserLoading || isLoadingInvitations;

  const handleAction = async (action: 'accept' | 'decline', invitation: Invitation) => {
    startProcessing(async () => {
      try {
        if (action === 'accept') {
          await acceptInvitation(invitation.id);
          toast({
            title: "Invitation Accepted",
            description: `You have joined the project: ${invitation.projectName}.`,
          });
          router.push('/projects');
        } else {
          await declineInvitation(invitation.id);
          toast({
            title: "Invitation Declined",
            description: `You have declined the invitation to join ${invitation.projectName}.`,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: `Failed to ${action} invitation`,
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="My Invitations"
        subtitle="Manage pending invitations to collaborate on projects."
      />

      {invitations && invitations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Pending Invitations</CardTitle>
            <CardDescription className="mt-2">
                When another user invites you to a project, it will show up here.
            </CardDescription>
        </Card>
      ) : (
        <Card>
            <CardContent className="pt-6">
                <ul className="space-y-4">
                    {invitations && invitations.map((invitation) => (
                        <li key={invitation.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                            <div>
                                <p className="font-semibold">{invitation.projectName}</p>
                                <p className="text-sm text-muted-foreground">
                                    Invited by {invitation.invitedByUsername} • {formatDistanceToNow(new Date(invitation.createdAt.seconds * 1000), { addSuffix: true })}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" onClick={() => handleAction('accept', invitation)} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                    <span className="ml-2">Accept</span>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleAction('decline', invitation)} disabled={isProcessing}>
                                     {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                     <span className="ml-2">Decline</span>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
