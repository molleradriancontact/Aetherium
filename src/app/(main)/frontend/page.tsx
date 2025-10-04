'use client';

import { PrototypingInterface } from "@/components/prototyping-interface";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Code, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { suggestFrontendChangesFromAnalysis } from "@/ai/flows/suggest-frontend-changes-from-analysis";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

export default function FrontendPage() {
  const { analysisReport, frontendSuggestions, detailedStatus, isHydrated, addHistory, setFrontendSuggestions, projectId } = useAppState();
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  const handleGenerateSuggestions = async () => {
    if (!analysisReport || !projectId) {
      toast({
        title: "Analysis Report Not Found",
        description: "An analysis report is required to generate frontend suggestions.",
        variant: "destructive",
      });
      return;
    }

    startGenerating(async () => {
      addHistory("Generating frontend suggestions...");
      try {
        const result = await suggestFrontendChangesFromAnalysis({ analysisReport });
        setFrontendSuggestions(result); // This will trigger a re-render
        addHistory("Frontend suggestions generated successfully.");
        toast({
          title: "Suggestions Generated",
          description: "Frontend suggestions are now available.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addHistory(`Failed to generate frontend suggestions: ${errorMessage}`);
        toast({
          title: "Suggestion Generation Failed",
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
        title="Frontend Modifications"
        subtitle="AI-prototyped changes for your front end."
      />

      {(detailedStatus || isGenerating) && (
         <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{detailedStatus || "Generating suggestions"}...</p>
        </div>
      )}

      {!analysisReport && !detailedStatus && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Code className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Analysis Available</CardTitle>
            <CardDescription className="mt-2">
                An analysis report is required to view or generate frontend suggestions.
            </CardDescription>
            <Link href="/prototype" >
                <Button className="mt-6">Analyze a Project</Button>
            </Link>
        </Card>
      )}

      {analysisReport && !frontendSuggestions && !detailedStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Frontend Suggestions</CardTitle>
            <CardDescription>
              Your analysis is complete. Generate AI-powered suggestions for your UI and component structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateSuggestions} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Suggestions
            </Button>
          </CardContent>
        </Card>
      )}
      
      {frontendSuggestions && (
        <PrototypingInterface
          enabledScopes={['frontend']}
          header={{
            title: 'Generate Frontend Prototype',
            description: 'Use the AI\'s analysis to generate prototyped code changes for the frontend. You can review the generated files before deciding to apply them.'
          }}
        />
      )}
    </div>
  );
}
