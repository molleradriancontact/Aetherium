
'use client';

import { PrototypingInterface } from "@/components/prototyping-interface";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Code } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FrontendPage() {
  const { frontendSuggestions, isLoading, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Frontend Modifications"
        subtitle="AI-prototyped changes for your front end."
      />

      {isLoading && <p className="text-muted-foreground">Loading suggestions...</p>}

      {!isLoading && !frontendSuggestions && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Code className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Suggestions Available</CardTitle>
            <CardDescription className="mt-2">
                Frontend suggestions will appear here after a successful analysis.
            </CardDescription>
            <Link href="/" >
                <Button className="mt-6">Analyze Your Project</Button>
            </Link>
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
