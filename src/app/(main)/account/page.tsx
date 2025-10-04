'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { Loader2, Mail, Calendar, Save } from "lucide-react";
import { doc } from "firebase/firestore";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { updateProfile } from "firebase/auth";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfile {
    id: string;
    email: string;
    username: string;
    registrationDate: string | Date;
}

export default function AccountPage() {
    const { user, auth, firestore } = useFirebase();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const { control, handleSubmit, formState: { isSubmitting, errors }, setValue } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: ""
        }
    });

    React.useEffect(() => {
        if (userProfile?.username) {
            setValue('username', userProfile.username);
        } else if (user?.displayName) {
             setValue('username', user.displayName);
        }
    }, [userProfile, user, setValue]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!userDocRef || !auth.currentUser) return;
        
        // Use non-blocking update for Firestore. Errors are handled globally.
        setDocumentNonBlocking(userDocRef, { username: data.username }, { merge: true });

        // Firebase Auth profile update can be awaited for immediate UI feedback.
        try {
            await updateProfile(auth.currentUser, { displayName: data.username });
            
            toast({
                title: "Profile Updated",
                description: "Your username has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating auth profile:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Auth Profile Update Failed",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };
    
    if (isProfileLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!userProfile) {
        return (
            <div className="space-y-8">
                 <PageHeader 
                    title="Account Settings"
                    subtitle="View and manage your account details."
                />
                <Card>
                    <CardContent className="p-6 text-center">
                        <p>Could not load user profile.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Account Settings"
                subtitle="View and manage your account details."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>This is how your profile appears to the system.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-sm text-foreground">{userProfile.email}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                            <p className="text-sm text-foreground">
                                {userProfile.registrationDate ? format(new Date(userProfile.registrationDate), 'MMMM d, yyyy') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Update Username</CardTitle>
                    <CardDescription>Change the username associated with your account. This is separate from your email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Controller
                                name="username"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        id="username" 
                                        {...field} 
                                        className="max-w-sm"
                                        disabled={isSubmitting}
                                        autoComplete="username"
                                    />
                                )}
                            />
                            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
