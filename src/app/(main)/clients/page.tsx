
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Loader2, PlusCircle, Users, Contact, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState } from "react";
import Link from "next/link";
import { collection, doc, writeBatch, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";

const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters."),
  styleDescription: z.string().min(10, "Style description is too short.").optional().or(z.literal('')),
  brandKeywords: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface Client {
    id: string;
    name: string;
    styleDescription: string;
    brandKeywords: string[];
    createdAt: any;
}

export default function ClientsPage() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    const clientsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/clients`);
    }, [user, firestore]);

    const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
    });

    const handleAddClient = (data: ClientFormValues) => {
        if (!user || !firestore) return;
        
        startTransition(async () => {
            try {
                const newClientRef = doc(collection(firestore, `users/${user.uid}/clients`));
                const keywords = data.brandKeywords ? data.brandKeywords.split(',').map(kw => kw.trim()).filter(kw => kw) : [];
                
                await writeBatch(firestore)
                    .set(newClientRef, {
                        id: newClientRef.id,
                        designerId: user.uid,
                        name: data.name,
                        styleDescription: data.styleDescription,
                        brandKeywords: keywords,
                        createdAt: serverTimestamp()
                    })
                    .commit();

                toast({
                    title: "Client Added",
                    description: `${data.name} has been added to your client list.`,
                });
                reset();
                setDialogOpen(false);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ title: "Failed to add client", description: errorMessage, variant: "destructive" });
            }
        });
    };

    const handleDeleteClient = (clientId: string) => {
         if (!user || !firestore) return;
         startTransition(async () => {
            try {
                await deleteDoc(doc(firestore, `users/${user.uid}/clients/${clientId}`));
                toast({ title: "Client Removed", description: "The client has been successfully removed."});
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ title: "Failed to remove client", description: errorMessage, variant: "destructive" });
            }
         });
    }

    return (
    <div className="space-y-8">
      <PageHeader
        title="Client Hub"
        subtitle="Manage your clients and generate design suggestions."
      />
      <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleSubmit(handleAddClient)}>
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                            Enter your client's details. This information will be used by the AI to generate design ideas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <div className="col-span-3">
                                <Input id="name" {...register("name")} />
                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brandKeywords" className="text-right">Keywords</Label>
                            <div className="col-span-3">
                                <Input id="brandKeywords" {...register("brandKeywords")} placeholder="e.g., modern, minimalist, bold" />
                                <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords that describe the brand.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="styleDescription" className="text-right mt-2">Style</Label>
                             <div className="col-span-3">
                                <Textarea id="styleDescription" {...register("styleDescription")} placeholder="Describe the client's visual style, typical requests, or brand guidelines." />
                                 {errors.styleDescription && <p className="text-sm text-destructive mt-1">{errors.styleDescription.message}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Client
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
      </div>

       {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : clients && clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => (
                    <Card key={client.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="truncate">{client.name}</CardTitle>
                                    <CardDescription>
                                        Added {format(new Date(client.createdAt.seconds * 1000), 'MMM d, yyyy')}
                                    </CardDescription>
                                </div>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Remove {client.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the client and their associated data. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">
                                            Remove
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>
                         <CardContent className="flex-grow">
                             <div className="space-y-2">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {client.styleDescription || "No style description provided."}
                                 </p>
                                 <div className="flex flex-wrap gap-1">
                                    {client.brandKeywords.map(kw => <span key={kw} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{kw}</span>)}
                                 </div>
                             </div>
                        </CardContent>
                        <CardContent>
                             <Link href={`/clients/${client.id}`} className="w-full">
                                <Button className="w-full">
                                    <Contact className="mr-2 h-4 w-4" />
                                    View Client
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4">No Clients Found</CardTitle>
                <CardDescription className="mt-2">
                    Click "Add New Client" to start building your client list.
                </CardDescription>
            </Card>
        )}
    </div>
  );
}
