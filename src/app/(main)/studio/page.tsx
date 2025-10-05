
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useCallback } from "react";
import { modifyVideo } from "@/ai/flows/modify-video-flow";
import { Video, WandSparkles, Loader2, UploadCloud } from "lucide-react";
import { useDropzone, FileWithPath } from 'react-dropzone';

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

export default function StudioPage() {
  const { toast } = useToast();
  
  const [prompt, setPrompt] = useState('');
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [modifiedVideo, setModifiedVideo] = useState<string | null>(null);

  const [isModifying, startModification] = useTransition();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
        return;
    }
    const file = acceptedFiles[0];
    if (!file.type.startsWith('video/')) {
        toast({ title: "Invalid File Type", description: "Please upload a video file.", variant: "destructive" });
        return;
    }
    readFileAsDataURL(file).then(dataUrl => {
        setSourceVideo(dataUrl);
        setModifiedVideo(null);
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'video/*': [] },
  });


  const handleModifyVideo = () => {
    if (!prompt) {
      toast({ title: "Prompt is required", description: "Please enter a prompt to modify the video.", variant: "destructive" });
      return;
    }
    if (!sourceVideo) {
        toast({ title: "Source video required", description: "Please upload a video to modify.", variant: "destructive" });
        return;
    }

    setModifiedVideo(null);
    startModification(async () => {
      try {
        const result = await modifyVideo({ videoDataUri: sourceVideo, prompt });
        setModifiedVideo(result.videoDataUri);
        toast({ title: "Video Modified", description: "Your video has been successfully modified." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Video Modification Failed", description: errorMessage, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Media Studio"
        subtitle="Use AI to edit and transform your video content for marketing or creative projects."
      />

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><WandSparkles /> AI Video Modifier</CardTitle>
            <CardDescription>Upload a video and use a text prompt to modify its style, color, or add effects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div 
                    {...getRootProps()}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors aspect-video ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'} ${isModifying ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <input {...getInputProps()} disabled={isModifying} />
                    {sourceVideo ? (
                         <video src={sourceVideo} controls muted loop className="w-full h-full rounded-md object-contain absolute inset-0"/>
                    ): (
                        <div className="text-center text-muted-foreground">
                            <UploadCloud className="mx-auto h-12 w-12" />
                            <p className="mt-2">Drag & drop a video here, or click to select</p>
                        </div>
                    )}
                </div>

                <div className="aspect-video bg-muted flex items-center justify-center rounded-lg relative">
                    {isModifying ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                            <p className="mt-2 text-sm">AI is modifying the video...</p>
                        </div>
                    ) : modifiedVideo ? (
                        <video src={modifiedVideo} controls autoPlay muted loop className="w-full h-full rounded-md object-contain">
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                       <div className="text-center text-muted-foreground">
                            <Video className="h-16 w-16 mx-auto" />
                            <p className="mt-2 text-sm">Your modified video will appear here.</p>
                       </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'make the sky purple' or 'turn this into a comic book style'"
                disabled={isModifying || !sourceVideo}
              />
              <Button onClick={handleModifyVideo} disabled={isModifying || !sourceVideo || !prompt} className="w-full">
                {isModifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                {isModifying ? 'Modifying...' : 'Modify Video'}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
