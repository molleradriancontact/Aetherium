
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, useCollection } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, WandSparkles, Image as ImageIcon, CalendarIcon, Save, Trash2, ListTodo, Plus, Check } from "lucide-react";
import { collection, doc, serverTimestamp, writeBatch, deleteDoc, orderBy, query, addDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useEffect } from "react";
import { generateDesignIdeas, DesignIdea } from "@/ai/flows/generate-design-ideas";
import Image from "next/image";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const timelineSchema = z.object({
  status: z.string().optional(),
  startDate: z.date().optional(),
  completionDate: z.date().optional(),
});
type TimelineFormValues = z.infer<typeof timelineSchema>;

interface Client {
    id: string;
    name: string;
    styleDescription: string;
    brandKeywords: string[];
    startDate?: any;
    completionDate?: any;
    status?: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
}

interface DesignAsset {
    id: string;
    storageUrl: string;
    title: string;
    mediaType: 'image' | 'video';
}

interface JobTask {
    id: string;
    description: string;
    isCompleted: boolean;
    createdAt: any;
}


const statusColors = {
    "Not Started": "bg-gray-500",
    "In Progress": "bg-blue-500",
    "Completed": "bg-green-500",
    "On Hold": "bg-yellow-500",
} as const;


export default function ClientDetailPage({ params }: { params: { id: string } }) {
    const { user, firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [isGenerating, startGenerating] = useTransition();
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [isAddingTask, startAddingTask] = useTransition();

    const clientDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/clients/${params.id}`);
    }, [user, firestore, params.id]);

    const assetsQuery = useMemoFirebase(() => {
        if (!clientDocRef) return null;
        return collection(clientDocRef, 'design_assets');
    }, [clientDocRef]);
    
    const tasksQuery = useMemoFirebase(() => {
        if (!clientDocRef) return null;
        return query(collection(clientDocRef, 'tasks'), orderBy('createdAt', 'asc'));
    }, [clientDocRef]);

    const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientDocRef);
    const { data: assets, isLoading: areAssetsLoading } = useCollection<DesignAsset>(assetsQuery);
    const { data: tasks, isLoading: areTasksLoading } = useCollection<JobTask>(tasksQuery);

    const { control, handleSubmit, formState: { isSubmitting }, setValue } = useForm<TimelineFormValues>({
        resolver: zodResolver(timelineSchema),
    });

    useEffect(() => {
        if (client) {
            setValue('status', client.status);
            if (client.startDate) setValue('startDate', new Date(client.startDate.seconds * 1000));
            if (client.completionDate) setValue('completionDate', new Date(client.completionDate.seconds * 1000));
        }
    }, [client, setValue]);


    const handleGenerateIdeas = async () => {
        if (!client || !user) return;

        startGenerating(async () => {
            try {
                const results = await generateDesignIdeas({
                    clientId: client.id,
                    styleDescription: client.styleDescription,
                    brandKeywords: client.brandKeywords,
                });
                
                const batch = writeBatch(firestore);
                for (const idea of results.ideas) {
                    const assetId = doc(collection(firestore, 'tmp')).id; // Generate a unique ID
                    const assetRef = storageRef(storage, `users/${user.uid}/clients/${client.id}/${assetId}.jpg`);
                    
                    const response = await fetch(idea.imageUrl);
                    const blob = await response.blob();

                    const snapshot = await uploadString(assetRef, await blobToDataURL(blob), 'data_url');
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    const assetDocRef = doc(firestore, `users/${user.uid}/clients/${client.id}/design_assets/${assetId}`);
                    batch.set(assetDocRef, {
                        id: assetId,
                        clientId: client.id,
                        designerId: user.uid,
                        title: idea.title,
                        prompt: idea.description,
                        mediaType: 'image',
                        storageUrl: downloadURL,
                        createdAt: serverTimestamp(),
                    });
                }
                await batch.commit();

                toast({ title: "Ideas Generated & Saved", description: "New design concepts have been saved to your asset library." });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
            }
        });
    };
    
    // Helper to convert blob to data URL
    const blobToDataURL = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
        });
    }

    const handleUpdateTimeline = (data: TimelineFormValues) => {
        if (!clientDocRef) return;
        setDocumentNonBlocking(clientDocRef, data, { merge: true });
        toast({ title: "Timeline Updated", description: "The client's timeline has been saved."});
    }
    
    const handleDeleteAsset = async (assetId: string) => {
        if (!user || !client) return;
        try {
            await deleteDoc(doc(firestore, `users/${user.uid}/clients/${client.id}/design_assets/${assetId}`));
            toast({ title: "Asset Removed", description: "The asset has been removed from your library."});
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
        }
    };
    
    const handleAddTask = () => {
        if (!clientDocRef || !newTaskDescription.trim()) return;

        startAddingTask(async () => {
            const tasksColRef = collection(clientDocRef, 'tasks');
            await addDoc(tasksColRef, {
                description: newTaskDescription,
                isCompleted: false,
                createdAt: serverTimestamp(),
            });
            setNewTaskDescription('');
        });
    };

    const handleToggleTask = (taskId: string, isCompleted: boolean) => {
        if (!clientDocRef) return;
        const taskDocRef = doc(clientDocRef, 'tasks', taskId);
        updateDocumentNonBlocking(taskDocRef, { isCompleted: !isCompleted });
    };

    const handleDeleteTask = (taskId: string) => {
        if (!clientDocRef) return;
        deleteDoc(doc(clientDocRef, 'tasks', taskId));
    };


    if (isClientLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!client) {
        return (
            <PageHeader title="Client Not Found" subtitle="Could not find a client with the specified ID." />
        );
    }
    
    return (
        <div className="space-y-8">
            <PageHeader
                title={client.name}
                subtitle="Manage client details, tasks, and generate design ideas."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Profile</CardTitle>
                            <CardDescription>Style and brand information for {client.name}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm">Brand Keywords</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {client.brandKeywords.length > 0 ? client.brandKeywords.map(kw => (
                                        <Badge key={kw} variant="secondary">{kw}</Badge>
                                    )) : <p className="text-sm text-muted-foreground">No keywords provided.</p>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Style Description</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {client.styleDescription || "No style description provided."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Job Timeline</CardTitle>
                            <CardDescription>Manage the status and dates for this client's job.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(handleUpdateTimeline)} className="space-y-4">
                                <div>
                                    <Label>Status</Label>
                                     <Controller
                                        name="status"
                                        control={control}
                                        defaultValue={client.status || "Not Started"}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="On Hold">On Hold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                         <Label>Start Date</Label>
                                         <Controller
                                            name="startDate"
                                            control={control}
                                            defaultValue={client.startDate ? new Date(client.startDate.seconds * 1000) : undefined}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>
                                     <div>
                                         <Label>End Date</Label>
                                         <Controller
                                            name="completionDate"
                                            control={control}
                                            defaultValue={client.completionDate ? new Date(client.completionDate.seconds * 1000) : undefined}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>
                                </div>
                                 <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Timeline
                                 </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Button onClick={handleGenerateIdeas} disabled={isGenerating} className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating Ideas...' : 'Generate New Ideas'}
                    </Button>
                </div>

                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo />
                                Job Tasks
                            </CardTitle>
                            <CardDescription>Keep track of all the to-do items for this job.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Input 
                                    placeholder="e.g., 'Draft initial mockups'"
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    disabled={isAddingTask}
                                />
                                <Button onClick={handleAddTask} disabled={isAddingTask || !newTaskDescription.trim()}>
                                    {isAddingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    <span className="sr-only">Add Task</span>
                                </Button>
                            </div>
                            {areTasksLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : tasks && tasks.length > 0 ? (
                                <ul className="space-y-3">
                                    {tasks.map(task => (
                                        <li key={task.id} className="flex items-center gap-3 group">
                                            <Checkbox 
                                                id={`task-${task.id}`}
                                                checked={task.isCompleted}
                                                onCheckedChange={() => handleToggleTask(task.id, task.isCompleted)}
                                            />
                                            <Label htmlFor={`task-${task.id}`} className={cn("flex-grow cursor-pointer", task.isCompleted && "line-through text-muted-foreground")}>
                                                {task.description}
                                            </Label>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTask(task.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No tasks added yet.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Library</CardTitle>
                            <CardDescription>All media assets generated for {client.name}. Ideas generated here are automatically saved.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {areAssetsLoading ? (
                                <div className="flex justify-center items-center h-96">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                </div>
                            ) : assets && assets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {assets.map((asset) => (
                                        <Card key={asset.id} className="group relative">
                                            <CardContent className="p-0">
                                                <div className="aspect-video bg-muted flex items-center justify-center relative">
                                                     {asset.mediaType === 'image' ? (
                                                        <Image src={asset.storageUrl} alt={asset.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-t-lg object-cover"/>
                                                     ) : (
                                                         <video src={asset.storageUrl} controls muted className="rounded-t-lg object-cover w-full h-full" />
                                                     )}
                                                </div>
                                            </CardContent>
                                            <CardHeader>
                                                <CardTitle className="text-base">{asset.title}</CardTitle>
                                            </CardHeader>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will delete the asset from your library, but the file will remain in storage. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAsset(asset.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-96">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 font-medium">No assets in the library yet.</p>
                                    <p className="text-sm text-muted-foreground">Click "Generate New Ideas" to start.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
