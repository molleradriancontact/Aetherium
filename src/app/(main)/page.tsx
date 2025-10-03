'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, Code, Database, Loader2, FlaskConical, LayoutGrid } from "lucide-react";
import { ProjectChatInterface } from "@/components/project-chat-interface";

export default function HomePage() {
  const { isHydrated, analysisReport, frontendSuggestions, backendSuggestions, detailedStatus, projectName } = useAppState();
  const isLoading = !!detailedStatus;

  if (!isHydrated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title={analysisReport ? projectName || "Dashboard" : "Welcome to Aetherium"}
        subtitle={!analysisReport ? "Start a new project or open an existing one." : "Continue working on your project."}
      />
      
      {!analysisReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Start a New Project</CardTitle>
            <CardDescription className="mt-2 mb-6">
                Analyze files or chat with the AI to begin prototyping.
            </CardDescription>
            <Link href="/prototype" >
                <Button>Go to Prototype <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </Card>
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Open an Existing Project</CardTitle>
            <CardDescription className="mt-2 mb-6">
                Browse and manage all of your past projects.
            </CardDescription>
            <Link href="/projects" >
                <Button>View Projects <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ProjectChatInterface />
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Analysis Report</CardTitle>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {analysisReport ? (
                             <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                                {analysisReport}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mb-4">A comprehensive overview of your codebase.</p>
                        )}
                        <Link href="/analysis">
                            <Button>View Report <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Frontend Suggestions</CardTitle>
                        <Code className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {frontendSuggestions?.suggestedChanges ? (
                             <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                                {frontendSuggestions.suggestedChanges}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mb-4">AI-powered recommendations for your UI.</p>
                        )}
                        <Link href="/frontend">
                            <Button variant="secondary">View Suggestions</Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Backend Suggestions</CardTitle>
                        <Database className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {backendSuggestions?.suggestedChanges ? (
                             <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                                {backendSuggestions.suggestedChanges}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mb-4">Optimize your server-side logic and architecture.</p>
                        )}
                        <Link href="/backend">
                            <Button variant="secondary">View Suggestions</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
