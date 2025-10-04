'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FlaskConical, LayoutGrid } from "lucide-react";

export function WelcomeCard() {
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader>
                <CardTitle className="text-2xl">Start Your First Project</CardTitle>
                <CardDescription>
                    Aetherium can analyze your documents, code, or ideas to help you build a functional web application prototype.
                    You can start by either uploading files for analysis or by chatting with the AI to define your project.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-card/50">
                        <FlaskConical className="h-10 w-10 text-primary mb-4" />
                        <h3 className="font-semibold mb-2">Create a New Prototype</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload files or chat with the AI to begin the analysis and prototyping process.
                        </p>
                        <Link href="/prototype" >
                            <Button>
                                Go to Prototype <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                     <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-card/50">
                        <LayoutGrid className="h-10 w-10 text-primary mb-4" />
                        <h3 className="font-semibold mb-2">Open an Existing Project</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                           If you have existing projects, you can view, manage, and continue working on them.
                        </p>
                        <Link href="/projects" >
                            <Button variant="secondary">View All Projects</Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
