
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useCallback } from "react";
import { modifyImage } from "@/ai/flows/modify-image-flow";
import { addTextToImage } from "@/ai/flows/add-text-to-image";
import { Image as ImageIcon, WandSparkles, Loader2, UploadCloud, Type } from "lucide-react";
import { useDropzone, FileWithPath } from 'react-dropzone';
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

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
  
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [fontSize, setFontSize] = useState('24');
  const [fontColor, setFontColor] = useState('#FFFFFF');

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);

  const [isProcessing, startProcessing] = useTransition();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) {
        return;
    }
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please upload an image file (PNG, JPG, etc.).", variant: "destructive" });
        return;
    }
    readFileAsDataURL(file).then(dataUrl => {
        setSourceImage(dataUrl);
        setModifiedImage(null);
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': [] },
  });

  const handleModifyImage = () => {
    if (!modificationPrompt) {
      toast({ title: "Prompt is required", description: "Please enter a prompt to modify the image.", variant: "destructive" });
      return;
    }
    if (!sourceImage) {
        toast({ title: "Source image required", description: "Please upload an image to modify.", variant: "destructive" });
        return;
    }

    setModifiedImage(null);
    startProcessing(async () => {
      try {
        const result = await modifyImage({ imageDataUri: sourceImage, prompt: modificationPrompt });
        setModifiedImage(result.imageDataUri);
        toast({ title: "Image Modified", description: "Your image has been successfully modified." });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Image Modification Failed", description: errorMessage, variant: "destructive" });
      }
    });
  };
  
  const handleAddText = () => {
    if (!textPrompt) {
      toast({ title: "Text is required", description: "Please enter text to add to the image.", variant: "destructive" });
      return;
    }
    if (!sourceImage) {
        toast({ title: "Source image required", description: "Please upload an image first.", variant: "destructive" });
        return;
    }

    setModifiedImage(null);
    startProcessing(async () => {
        try {
            const result = await addTextToImage({
                imageDataUri: sourceImage,
                text: textPrompt,
                fontSize: parseInt(fontSize, 10),
                fontColor: fontColor,
            });
            setModifiedImage(result.imageDataUri);
            toast({ title: "Text Added", description: "Text has been added to your image." });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Failed to Add Text", description: errorMessage, variant: "destructive" });
        }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Media Studio"
        subtitle="Use AI to edit your images or add text for promotions and specials."
      />

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">AI Image Editor</CardTitle>
            <CardDescription>Upload an image and use the tools below to modify it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div 
                    {...getRootProps()}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors aspect-video bg-muted/50 ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'} ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <input {...getInputProps()} disabled={isProcessing} />
                    {sourceImage ? (
                         <Image src={sourceImage} alt="Source image" fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-md object-contain" />
                    ): (
                        <div className="text-center text-muted-foreground">
                            <UploadCloud className="mx-auto h-12 w-12" />
                            <p className="mt-2">Drag & drop an image here, or click to select</p>
                        </div>
                    )}
                </div>

                <div className="aspect-video bg-muted flex items-center justify-center rounded-lg relative">
                    {isProcessing ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                            <p className="mt-2 text-sm">AI is processing the image...</p>
                        </div>
                    ) : modifiedImage ? (
                         <Image src={modifiedImage} alt="Modified image" fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-md object-contain" />
                    ) : (
                       <div className="text-center text-muted-foreground">
                            <ImageIcon className="h-16 w-16 mx-auto" />
                            <p className="mt-2 text-sm">Your modified image will appear here.</p>
                       </div>
                    )}
                </div>
            </div>

            <Tabs defaultValue="modify" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="modify"><WandSparkles className="mr-2 h-4 w-4"/>Modify Style</TabsTrigger>
                    <TabsTrigger value="text"><Type className="mr-2 h-4 w-4"/>Add Text</TabsTrigger>
                </TabsList>
                <TabsContent value="modify" className="mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="modification-prompt">Modification Prompt</Label>
                        <Input
                            id="modification-prompt"
                            value={modificationPrompt}
                            onChange={(e) => setModificationPrompt(e.target.value)}
                            placeholder="e.g., 'turn this into a comic book style'"
                            disabled={isProcessing || !sourceImage}
                        />
                        <Button onClick={handleModifyImage} disabled={isProcessing || !sourceImage || !modificationPrompt} className="w-full">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                            Modify Image
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="text-prompt">Text to Add</Label>
                           <Input
                             id="text-prompt"
                             value={textPrompt}
                             onChange={(e) => setTextPrompt(e.target.value)}
                             placeholder="e.g., 'Weekly Special: 50% Off!'"
                             disabled={isProcessing || !sourceImage}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="font-size">Font Size (approx)</Label>
                                <Input id="font-size" type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} placeholder="e.g., 24" disabled={isProcessing || !sourceImage} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="font-color">Font Color</Label>
                                <Input id="font-color" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} disabled={isProcessing || !sourceImage} className="p-1"/>
                            </div>
                        </div>
                        <Button onClick={handleAddText} disabled={isProcessing || !sourceImage || !textPrompt} className="w-full">
                           {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Type className="mr-2 h-4 w-4" />}
                           Add Text to Image
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
    </div>
  );
}
