'use client';

import { PrototypingInterface } from "@/components/prototyping-interface";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Database, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BackendPage() {
  const { backendSuggestions, detailedStatus, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Backend Modifications"
        subtitle="AI-prototyped changes for your back end."
      />

      {detailedStatus && (
         <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{detailedStatus}...</p>
        </div>
      )}
      
      {!detailedStatus && !backendSuggestions && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Suggestions Available</CardTitle>
            <CardDescription className="mt-2">
                Backend suggestions will appear here after a successful analysis.
            </CardDescription>
            <Link href="/prototype" >
                <Button className="mt-6">Analyze a Project</Button>
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
