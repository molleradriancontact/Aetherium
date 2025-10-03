
'use client';

import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, Code, Database, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isHydrated, analysisReport, isLoading } = useAppState();

  if (!isHydrated || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard"
        subtitle="Upload your project files to begin the AI-powered analysis."
      />
      
      {!analysisReport ? (
        <FileUpload />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Complete</CardTitle>
            <CardDescription>
              Your project has been analyzed. View the report and suggested modifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Analysis Report</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground mb-4">A comprehensive overview of your codebase.</p>
                      <Link href="/analysis">
                          <Button>View Report <ArrowRight className="ml-2 h-4 w-4" /></Button>
                      </Link>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Frontend Suggestions</CardTitle>
                      <Code className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground mb-4">AI-powered recommendations for your UI.</p>
                      <Link href="/frontend">
                        <Button variant="secondary">View Suggestions</Button>
                      </Link>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Backend Suggestions</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-xs text-muted-foreground mb-4">Optimize your server-side logic and architecture.</p>
                      <Link href="/backend">
                        <Button variant="secondary">View Suggestions</Button>
                      </Link>
                  </CardContent>
              </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
