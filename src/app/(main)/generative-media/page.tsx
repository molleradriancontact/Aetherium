
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { generateImage } from "@/ai/flows/generate-image";
import { generateVideo } from "@/ai/flows/generate-video";
import { Image as ImageIcon, Video, Loader2 } from "lucide-react";
import Image from "next/image";

export default function GenerativeMediaPage() {
  const { toast } = useToast();
  
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const [isGeneratingImage, startImageGeneration] = useTransition();
  const [isGeneratingVideo, startVideoGeneration] = useTransition();

  const handleGenerateImage = () => {
    if (!imagePrompt) {
      toast({ title: "Prompt is required", description: "Please enter a prompt to generate an image.", variant: "destructive" });
      return;
    }
    setGeneratedImage(null);
    startImageGeneration(async () => {
      try {
        const result = await generateImage(imagePrompt);
        setGeneratedImage(result.imageDataUri);
        toast({ title: "Image Generated", description: "Your image has been successfully generated." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Image Generation Failed", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const handleGenerateVideo = () => {
    if (!videoPrompt) {
      toast({ title: "Prompt is required", description: "Please enter a prompt to generate a video.", variant: "destructive" });
      return;
    }
    setGeneratedVideo(null);
    startVideoGeneration(async () => {
      try {
        const result = await generateVideo(videoPrompt);
        setGeneratedVideo(result.videoDataUri);
        toast({ title: "Video Generated", description: "Your video has been successfully generated." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Video Generation Failed", description: errorMessage, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Generative Media"
        subtitle="Create images and videos from text prompts using generative AI."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon /> Image Generation</CardTitle>
            <CardDescription>Generate a unique image based on your text prompt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., A majestic dragon soaring over a mystical forest"
                disabled={isGeneratingImage}
              />
              <Button onClick={handleGenerateImage} disabled={isGeneratingImage} className="w-full">
                {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isGeneratingImage ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
            <Card className="mt-4 aspect-square bg-muted flex items-center justify-center relative">
              {isGeneratingImage ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : generatedImage ? (
                <Image src={generatedImage} alt="Generated image" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="rounded-md object-contain" />
              ) : (
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              )}
            </Card>
          </CardContent>
        </Card>

        {/* Video Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video /> Video Generation</CardTitle>
            <CardDescription>Create a short video clip from your text prompt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="e.g., A cinematic shot of an old car driving down a deserted road"
                disabled={isGeneratingVideo}
              />
              <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="w-full">
                {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
              </Button>
            </div>
            <Card className="mt-4 aspect-video bg-muted flex items-center justify-center">
              {isGeneratingVideo ? (
                 <div className="text-center text-muted-foreground">
                    <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                    <p className="mt-2 text-sm">Video generation can take up to a minute.</p>
                </div>
              ) : generatedVideo ? (
                <video src={generatedVideo} controls autoPlay muted loop className="w-full h-full rounded-md object-contain">
                    Your browser does not support the video tag.
                </video>
              ) : (
                <Video className="h-16 w-16 text-muted-foreground" />
              )}
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
