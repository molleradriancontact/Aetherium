
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { FlaskConical, Loader2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useTransition } from "react";
import { suggestFrontendModifications } from "@/ai/flows/suggest-frontend-modifications";
import { suggestBackendModifications } from "@/ai/flows/suggest-backend-modifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyCodeChanges } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type GeneratedFile = {
  path: string;
  content: string;
  visualDescription?: string;
};

export default function PrototypePage() {
  const { analysisReport, frontendSuggestions, backendSuggestions, addHistory, isLoading: isAppLoading } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, startApplying] = useTransition();
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[] | null>(null);
  const { toast } = useToast();

  const canPrototype = useMemo(() => {
    return !!(analysisReport && (frontendSuggestions || backendSuggestions));
  }, [analysisReport, frontendSuggestions, backendSuggestions]);

  const handleGeneratePrototype = async () => {
    if (!canPrototype) return;

    setIsLoading(true);
    setGeneratedFiles(null);
    addHistory("Starting prototyping phase...");

    try {
      let allModifications: GeneratedFile[] = [];

      if (frontendSuggestions) {
        addHistory("Prototyping frontend modifications...");
        const result = await suggestFrontendModifications({
            analysisReport: analysisReport!,
            userArchitecture: frontendSuggestions.reasoning,
        });
        if(result.files) {
            allModifications = [...allModifications, ...result.files];
        }
        addHistory("Frontend prototyping complete.");
      }

      if (backendSuggestions) {
        addHistory("Prototyping backend modifications...");
        const result = await suggestBackendModifications({
            analysisReport: analysisReport!,
            userArchitecture: backendSuggestions.reasoning,
        });
        if(result.files) {
            allModifications = [...allModifications, ...result.files];
        }
        addHistory("Backend prototyping complete.");
      }

      setGeneratedFiles(allModifications);
      addHistory("All prototyping complete. Review the generated files.");

    } catch (error) {
      console.error("Prototyping failed", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addHistory(`Prototyping failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!generatedFiles) return;

    startApplying(async () => {
      addHistory("Applying generated code changes...");
      try {
        await applyCodeChanges(generatedFiles);
        
        addHistory("Code changes have been applied to your project.");
        toast({
          title: "Changes Applied!",
          description: "The generated code has been written to your files.",
        });
        
        // Clear the generated files from the view after applying
        setGeneratedFiles(null);

      } catch (error) {
        console.error("Failed to apply changes", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addHistory(`Failed to apply changes: ${errorMessage}`);
        toast({
          title: "Failed to Apply Changes",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Prototyping"
        subtitle="Generate and review code modifications based on the AI's analysis."
      />

      {!canPrototype && !isAppLoading ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Ready to Prototype</CardTitle>
            <CardDescription className="mt-2">
                First, analyze a project. Then, come back here to generate code.
            </CardDescription>
        </Card>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Generate Prototype</CardTitle>
                <CardDescription>
                    Use the AI's analysis to generate prototyped code changes. You can review the generated files before deciding to apply them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleGeneratePrototype} disabled={isLoading || isAppLoading || isApplying}>
                    {(isLoading || isAppLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Code Prototype
                </Button>
            </CardContent>
        </Card>
      )}

      {(isLoading || isAppLoading) && (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">AI is thinking...</p>
        </div>
      )}

      {generatedFiles && (
         <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                      <CardTitle>Generated Files</CardTitle>
                      <CardDescription>Review the code and visual descriptions generated by the AI before applying.</CardDescription>
                  </div>
                  <Button onClick={handleApplyChanges} disabled={isApplying} className="mt-4 sm:mt-0">
                      {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                      Apply Changes
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue={generatedFiles[0]?.path}>
                    <TabsList>
                        {generatedFiles.map(file => (
                            <TabsTrigger key={file.path} value={file.path}>{file.path.split("/").pop()}</TabsTrigger>
                        ))}
                    </TabsList>
                    {generatedFiles.map(file => (
                        <TabsContent key={file.path} value={file.path}>
                            {file.visualDescription && (
                                <Card className="mb-4 bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Visual Preview Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{file.visualDescription}</p>
                                    </CardContent>
                                </Card>
                            )}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-mono">{file.path}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[500px] w-full">
                                        <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                                            {file.content}
                                        </pre>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
