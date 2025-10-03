
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { FileUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
  const { analysisReport, isLoading, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Analysis Report"
        subtitle="A comprehensive report based on the AI's understanding of your files."
      />
      
      {isLoading && <p className="text-muted-foreground">Generating report...</p>}

      {!isLoading && !analysisReport && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FileUp className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Report Found</CardTitle>
            <CardDescription className="mt-2">
                You need to upload and analyze your project files first.
            </CardDescription>
            <Link href="/" passHref legacyBehavior>
                <Button className="mt-6">Go to Dashboard</Button>
            </Link>
        </Card>
      )}

      {analysisReport && (
        <Card>
          <CardHeader>
            <CardTitle>System Analysis</CardTitle>
            <CardDescription>The following is a detailed analysis of your codebase, highlighting potential improvements and code smells.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
              {analysisReport}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
