
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Loader2, WandSparkles, Image as ImageIcon, CalendarIcon, Save } from "lucide-react";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
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

const statusColors = {
    "Not Started": "bg-gray-500",
    "In Progress": "bg-blue-500",
    "Completed": "bg-green-500",
    "On Hold": "bg-yellow-500",
} as const;


export default function ClientDetailPage({ params }: { params: { id: string } }) {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isGenerating, startGenerating] = useTransition();
    const [designIdeas, setDesignIdeas] = useState<DesignIdea[]>([]);

    const clientDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/clients/${params.id}`);
    }, [user, firestore, params.id]);

    const { data: client, isLoading } = useDoc<Client>(clientDocRef);

    const { control, handleSubmit, formState: { isSubmitting }, setValue } = useForm<TimelineFormValues>({
        resolver: zodResolver(timelineSchema),
    });

    useState(() => {
        if (client) {
            setValue('status', client.status);
            if (client.startDate) setValue('startDate', new Date(client.startDate.seconds * 1000));
            if (client.completionDate) setValue('completionDate', new Date(client.completionDate.seconds * 1000));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, setValue]);


    const handleGenerateIdeas = async () => {
        if (!client) return;
        setDesignIdeas([]);

        startGenerating(async () => {
            try {
                const result = await generateDesignIdeas({
                    styleDescription: client.styleDescription,
                    brandKeywords: client.brandKeywords,
                });
                setDesignIdeas(result.ideas);
                toast({ title: "Ideas Generated", description: "New design concepts are ready for review." });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
            }
        });
    };

    const handleUpdateTimeline = (data: TimelineFormValues) => {
        if (!clientDocRef) return;
        setDocumentNonBlocking(clientDocRef, data, { merge: true });
        toast({ title: "Timeline Updated", description: "The client's timeline has been saved."});
    }

    if (isLoading) {
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
                subtitle="Manage client details and generate design ideas."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI-Generated Design Concepts</CardTitle>
                            <CardDescription>Visual ideas and suggestions generated by the AI based on the client's profile.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isGenerating ? (
                                <div className="flex justify-center items-center h-96">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                        <p className="mt-4 text-muted-foreground">AI is brainstorming ideas...</p>
                                    </div>
                                </div>
                            ) : designIdeas.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {designIdeas.map((idea, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-0">
                                                <div className="aspect-video bg-muted flex items-center justify-center relative">
                                                     <Image src={idea.imageUrl} alt={idea.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-t-lg object-cover"/>
                                                </div>
                                            </CardContent>
                                            <CardHeader>
                                                <CardTitle className="text-base">{idea.title}</CardTitle>
                                                <CardDescription className="text-xs line-clamp-3">{idea.description}</CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-96">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 font-medium">No ideas generated yet.</p>
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
