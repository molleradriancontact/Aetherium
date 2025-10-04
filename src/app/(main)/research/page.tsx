
'use client';

import { PageHeader } from "@/components/page-header";
import { ProjectChatInterface } from "@/components/project-chat-interface";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResearchPage() {
    const { analysisReport } = useAppState();

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Deep Research"
                subtitle="Engage with the AI to perform deep research on any topic."
            />

            {analysisReport ? (
                <ProjectChatInterface />
            ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground" />
                    <CardTitle className="mt-4">Select a Project to Begin</CardTitle>
                    <CardDescription className="mt-2">
                        The Deep Research chat is project-specific. Please open a project to start your research.
                    </CardDescription>
                     <Link href="/projects">
                        <Button className="mt-6">View Projects</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
