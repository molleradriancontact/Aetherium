
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useMemoFirebase } from "@/firebase";
import { ArchitectProject } from "@/app/provider";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { synthesizeDebates, SynthesizeDebatesOutput } from "@/ai/flows/synthesize-debates";

export default function SynthesisPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSynthesizing, startSynthesizing] = useTransition();
  const [selectedProjects, setSelectedProjects] = useState<ArchitectProject[]>([]);
  const [synthesisResult, setSynthesisResult] = useState<SynthesizeDebatesOutput | null>(null);

  const publicProjectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), where("isPublic", "==", true));
  }, [firestore]);

  const { data: publicProjects, isLoading } = useCollection<ArchitectProject>(publicProjectsQuery);

  const handleSelectProject = (project: ArchitectProject) => {
    setSelectedProjects(prev =>
      prev.some(p => p.id === project.id)
        ? prev.filter(p => p.id !== project.id)
        : [...prev, project]
    );
  };

  const handleSynthesize = () => {
    if (selectedProjects.length < 2) {
      toast({
        title: "Not enough projects selected",
        description: "Please select at least two public projects to start a synthesis.",
        variant: "destructive"
      });
      return;
    }
    
    setSynthesisResult(null);
    startSynthesizing(async () => {
      try {
        const analysisReports = selectedProjects.map(p => ({
          projectName: p.name,
          report: p.analysisReport || ""
        }));

        const result = await synthesizeDebates({ analysisReports });
        setSynthesisResult(result);
        toast({
          title: "Synthesis Complete",
          description: "The AI debate and synthesis has been generated.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Synthesis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Collective Synthesis"
        subtitle="Synthesize knowledge by having AI experts debate different public projects."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Public Projects</CardTitle>
              <CardDescription>Choose two or more projects to synthesize.</CardDescription>
            </CardHeader>
            <CardContent>
              {publicProjects && publicProjects.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {publicProjects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`project-${project.id}`}
                        onCheckedChange={() => handleSelectProject(project)}
                        checked={selectedProjects.some(p => p.id === project.id)}
                      />
                      <Label htmlFor={`project-${project.id}`} className="font-medium cursor-pointer">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No public projects found.</p>
              )}
            </CardContent>
          </Card>
          <Button onClick={handleSynthesize} disabled={isSynthesizing || selectedProjects.length < 2} className="w-full">
            {isSynthesizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Synthesize ({selectedProjects.length})
          </Button>
        </div>

        <div className="lg:col-span-2">
          {isSynthesizing && (
            <Card className="flex h-96 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI experts are debating...</p>
              </div>
            </Card>
          )}

          {!synthesisResult && !isSynthesizing && (
             <Card className="flex h-96 items-center justify-center text-center">
              <div>
                <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4">Waiting for Synthesis</CardTitle>
                <CardDescription className="mt-2">
                  Select at least two projects and click "Synthesize" to begin.
                </CardDescription>
              </div>
            </Card>
          )}

          {synthesisResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>The Debate</CardTitle>
                  <CardDescription>AI experts discuss the selected projects.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                    {synthesisResult.debate}
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Constructive Synthesis</CardTitle>
                  <CardDescription>A summary of the debate with proposed solutions.</CardDescription>
                </CardHeader>
                <CardContent>
                   <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                    {synthesisResult.synthesis}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
