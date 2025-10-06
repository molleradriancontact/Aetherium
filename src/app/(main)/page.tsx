
'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ProjectChatInterface } from "@/components/project-chat-interface";
import { WelcomeCard } from "@/components/welcome-card";
import { ProjectActivityFeed } from "@/components/project-activity-feed";
import { InfoAccordion } from "@/components/info-accordion";

export default function HomePage() {
  const { isHydrated, analysisReport, frontendSuggestions, backendSuggestions, detailedStatus, projectName } = useAppState();

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
        subtitle={!analysisReport ? "Let's build something new." : "Continue working on your project."}
      />
      
      {!analysisReport ? (
        <WelcomeCard />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ProjectChatInterface />
            </div>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Project Overview</CardTitle>
                        <CardDescription>A summary of your project's analysis and suggestions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InfoAccordion 
                            analysisReport={analysisReport}
                            frontendSuggestions={frontendSuggestions}
                            backendSuggestions={backendSuggestions}
                        />
                    </CardContent>
                </Card>
                <ProjectActivityFeed />
            </div>
        </div>
      )}
    </div>
  );
}
