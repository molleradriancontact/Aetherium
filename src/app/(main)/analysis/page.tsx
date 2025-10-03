
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { FileUp, Loader2, File as FileIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
  const { analysisReport, detailedStatus, isHydrated, uploadedFiles } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Analysis Report"
        subtitle="A comprehensive report based on the AI's understanding of your files."
      />
      
      {detailedStatus && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{detailedStatus}...</p>
        </div>
      )}

      {!detailedStatus && !analysisReport && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FileUp className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Report Found</CardTitle>
            <CardDescription className="mt-2">
                You need to upload and analyze your project files first.
            </CardDescription>
            <Link href="/prototype" >
                <Button className="mt-6">Go to Prototype</Button>
            </Link>
        </Card>
      )}

      {analysisReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
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
            </div>
            <div>
                 {uploadedFiles && uploadedFiles.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Analyzed Files</CardTitle>
                            <CardDescription>These files were used to generate the report.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {uploadedFiles.map((file, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <FileIcon className="h-4 w-4" />
                                        <span className="truncate">{file.path}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
      )}
    </div>
  );
}
