'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { HeartPulse, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { runSystemCheck, SystemCheckOutput } from "@/ai/flows/run-system-check";

export default function HealthCheckPage() {
  const { analysisReport, detailedStatus, isHydrated, projectId } = useAppState();
  const [isChecking, startChecking] = useTransition();
  const [checkResult, setCheckResult] = useState<SystemCheckOutput | null>(null);
  const { toast } = useToast();

  const handleRunCheck = async () => {
    if (!analysisReport || !projectId) {
      toast({
        title: "Analysis Report Not Found",
        description: "An analysis report is required to run a system health check.",
        variant: "destructive",
      });
      return;
    }
    setCheckResult(null);

    startChecking(async () => {
      try {
        const result = await runSystemCheck({ analysisReport });
        setCheckResult(result); 
        toast({
          title: "Health Check Complete",
          description: "The system health check report is now available.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Health Check Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="System Health Check"
        subtitle="Run an AI-powered check to identify areas for improvement in your project."
      />

      {detailedStatus && (
         <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{detailedStatus}...</p>
        </div>
      )}
      
      {!analysisReport && !detailedStatus && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <HeartPulse className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Analysis Available</CardTitle>
            <CardDescription className="mt-2">
                An analysis report is required to run a health check.
            </CardDescription>
            <Link href="/prototype" >
                <Button className="mt-6">Analyze a Project</Button>
            </Link>
        </Card>
      )}

      {analysisReport && (
        <Card>
          <CardHeader>
            <CardTitle>Run AI Health Check</CardTitle>
            <CardDescription>
              Your analysis is complete. The AI will now review your project's structure and report to identify potential improvements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunCheck} disabled={isChecking}>
              {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HeartPulse className="mr-2 h-4 w-4" />}
              {isChecking ? "Running Check..." : "Run Health Check"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isChecking && (
        <Card className="flex min-h-[24rem] items-center justify-center">
            <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">AI is running the health check...</p>
            </div>
        </Card>
      )}

      {checkResult && (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Refactoring Suggestions</CardTitle>
                    <CardDescription>Opportunities to improve code quality, clarity, and maintainability.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                        {checkResult.refactoringSuggestions}
                    </pre>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Performance Optimizations</CardTitle>
                    <CardDescription>Ways to improve the speed and efficiency of your application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                        {checkResult.performanceOptimizations}
                    </pre>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>New Feature Ideas</CardTitle>
                    <CardDescription>Potential new features or capabilities based on the project's context.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                        {checkResult.featureIdeas}
                    </pre>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
