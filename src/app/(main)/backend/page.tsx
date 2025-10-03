
'use client';

import { PrototypingInterface } from "@/components/prototyping-interface";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Database } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BackendPage() {
  const { backendSuggestions, isLoading, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Backend Modifications"
        subtitle="AI-prototyped changes for your back end."
      />

      {isLoading && <p className="text-muted-foreground">Loading suggestions...</p>}
      
      {!isLoading && !backendSuggestions && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Suggestions Available</CardTitle>
            <CardDescription className="mt-2">
                Backend suggestions will appear here after a successful analysis.
            </CardDescription>
            <Link href="/" >
                <Button className="mt-6">Analyze Your Project</Button>
            </Link>
        </Card>
      )}

      {backendSuggestions && (
        <PrototypingInterface
          enabledScopes={['backend']}
          header={{
            title: 'Generate Backend Prototype',
            description: 'Use the AI\'s analysis to generate prototyped code changes for the backend. You can review the generated files before deciding to apply them.'
          }}
        />
      )}
    </div>
  );
}
