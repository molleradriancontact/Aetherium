
'use client';

import { PrototypingInterface } from "@/components/prototyping-interface";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { FlaskConical, Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function PrototypePage() {
  const { analysisReport, frontendSuggestions, backendSuggestions, detailedStatus } = useAppState();

  const canPrototype = useMemo(() => {
    return !!(analysisReport && (frontendSuggestions || backendSuggestions));
  }, [analysisReport, frontendSuggestions, backendSuggestions]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Prototyping"
        subtitle="Generate and review code modifications for both frontend and backend."
      />
      
      {detailedStatus && (
         <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{detailedStatus}...</p>
        </div>
      )}

      {!canPrototype && !detailedStatus ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Ready to Prototype</CardTitle>
            <CardDescription className="mt-2">
                First, analyze a project. Then, come back here to generate code.
            </CardDescription>
        </Card>
      ) : (
        <PrototypingInterface
          enabledScopes={['frontend', 'backend']}
          header={{
            title: 'Generate Full-Stack Prototype',
            description: 'Use the AI\'s analysis to generate prototyped code changes for both the frontend and backend. You can review the generated files before deciding to apply them.'
          }}
        />
      )}
    </div>
  );
}
