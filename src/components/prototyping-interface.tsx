
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Loader2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { suggestFrontendModifications } from "@/ai/flows/suggest-frontend-modifications";
import { suggestBackendModifications } from "@/ai/flows/suggest-backend-modifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { applyCodeChanges } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Preview } from "./preview";

type GeneratedFile = {
  path: string;
  content: string;
  visualDescription?: string;
};

interface PrototypingInterfaceProps {
    enabledScopes: ('frontend' | 'backend')[];
    header: {
        title: string;
        description: string;
    };
}

export function PrototypingInterface({ enabledScopes, header }: PrototypingInterfaceProps) {
  const { analysisReport, frontendSuggestions, backendSuggestions, addHistory, detailedStatus, setDetailedStatus } = useAppState();
  const [isApplying, startApplying] = useTransition();
  const [isPrototyping, startPrototyping] = useTransition();
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[] | null>(null);
  const { toast } = useToast();
  
  const shouldPrototypeFrontend = enabledScopes.includes('frontend') && !!frontendSuggestions;
  const shouldPrototypeBackend = enabledScopes.includes('backend') && !!backendSuggestions;


  const handleGeneratePrototype = async () => {
    setGeneratedFiles(null);
    
    startPrototyping(async () => {
      addHistory("Starting prototyping phase...");
      try {
        let allModifications: GeneratedFile[] = [];

        if (shouldPrototypeFrontend) {
          setDetailedStatus("Prototyping frontend modifications");
          addHistory("Prototyping frontend modifications...");
          const result = await suggestFrontendModifications({
              analysisReport: analysisReport!,
              userArchitecture: frontendSuggestions!.reasoning,
          });
          if(result.files) {
              allModifications = [...allModifications, ...result.files];
          }
          addHistory("Frontend prototyping complete.");
        }

        if (shouldPrototypeBackend) {
          setDetailedStatus("Prototyping backend modifications");
          addHistory("Prototyping backend modifications...");
          const result = await suggestBackendModifications({
              analysisReport: analysisReport!,
              userArchitecture: backendSuggestions!.reasoning,
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
        toast({
            title: "Prototyping Failed",
            description: errorMessage,
            variant: "destructive",
          });
      } finally {
        setDetailedStatus(null);
      }
    });
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
  
  const isLoading = !!detailedStatus || isPrototyping;

  return (
    <div className="space-y-8">
        {!generatedFiles && (
             <Card>
                <CardHeader>
                    <CardTitle>{header.title}</CardTitle>
                    <CardDescription>
                        {header.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGeneratePrototype} disabled={isLoading || isApplying}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {detailedStatus || (isPrototyping ? 'Prototyping...' : 'Generate Code Prototype')}
                    </Button>
                </CardContent>
            </Card>
        )}

      {generatedFiles && (
         <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                      <CardTitle>Generated Files</CardTitle>
                      <CardDescription>Review the code and visual descriptions generated by the AI before applying.</CardDescription>
                  </div>
                  <div className='flex items-center gap-2 mt-4 sm:mt-0'>
                     <Button variant="outline" onClick={() => setGeneratedFiles(null)} disabled={isApplying}>
                        Discard
                     </Button>
                      <Button onClick={handleApplyChanges} disabled={isApplying}>
                          {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                          Apply Changes
                      </Button>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue={generatedFiles[0]?.path} className="w-full">
                    <ScrollArea className="w-full">
                        <TabsList>
                            {generatedFiles.map(file => (
                                <TabsTrigger key={file.path} value={file.path}>{file.path.split("/").pop()}</TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>
                    {generatedFiles.map(file => {
                      const isVisual = file.path.endsWith('.tsx') || file.path.endsWith('.jsx');
                      return (
                        <TabsContent key={file.path} value={file.path}>
                            <Tabs defaultValue={isVisual ? "visual" : "code"} className="w-full">
                                {isVisual && (
                                     <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="visual">Visual Preview</TabsTrigger>
                                        <TabsTrigger value="code">Code</TabsTrigger>
                                    </TabsList>
                                )}
                               {isVisual && (
                                <TabsContent value="visual">
                                     <Card className="mt-4 bg-muted/50">
                                        <CardContent className="p-2">
                                          <iframe 
                                            src={`/preview?code=${encodeURIComponent(file.content)}`}
                                            className="w-full h-[600px] border-0 rounded-md bg-background"
                                            sandbox="allow-scripts allow-same-origin"
                                          />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                               )}
                                <TabsContent value="code">
                                    <Card className={isVisual ? "mt-4" : ""}>
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
                            </Tabs>
                        </TabsContent>
                    )})}
                </Tabs>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
