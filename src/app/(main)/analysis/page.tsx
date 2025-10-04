
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { FileUp, Loader2, File as FileIcon, Volume2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateAudioOverview } from "@/ai/flows/generate-audio-overview";

export default function AnalysisPage() {
  const { analysisReport, detailedStatus, isHydrated, uploadedFiles } = useAppState();
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isGeneratingAudio, startAudioGeneration] = useTransition();
  const { toast } = useToast();

  if (!isHydrated) return null;

  const handleGenerateAudio = () => {
    if (!analysisReport) {
      toast({
        title: "Analysis Report Not Found",
        description: "An analysis report is required to generate an audio overview.",
        variant: "destructive",
      });
      return;
    }
    
    setAudioDataUri(null);

    startAudioGeneration(async () => {
      try {
        const result = await generateAudioOverview(analysisReport);
        setAudioDataUri(result.audioDataUri);
        toast({
          title: "Audio Generated",
          description: "The audio overview is ready to be played.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Audio Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

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
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle>System Analysis</CardTitle>
                            <CardDescription>A detailed analysis of your codebase, highlighting potential improvements and code smells.</CardDescription>
                        </div>
                         <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} size="sm">
                           {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                           {isGeneratingAudio ? 'Generating...' : 'Audio Overview'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {audioDataUri && (
                      <div className="mb-6">
                        <audio controls src={audioDataUri} className="w-full">
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
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
