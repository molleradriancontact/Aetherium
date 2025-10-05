
'use client';

import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, X } from 'lucide-react';
import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { UploadedFile } from '@/app/provider';
import { Input } from './ui/input';
import { useFirebase } from '@/firebase';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

export function FileUpload() {
  const { startAnalysis, detailedStatus } = useAppState();
  const { user } = useFirebase();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const isProcessing = !!detailedStatus;

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles((prevFiles) => {
      const newFiles = acceptedFiles.filter(
        (file) => !prevFiles.some((prevFile) => prevFile.path === file.path && prevFile.size === file.size)
      );
      
      if (newFiles.length < acceptedFiles.length) {
        toast({
            title: "Duplicate files skipped",
            description: "Some files were already in the upload list."
        })
      }

      return [...prevFiles, ...newFiles];
    });
  }, [toast]);

  const handleFileNameChange = (index: number, newPath: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      const originalFile = updatedFiles[index];
      
      const newFile = new File([originalFile], newPath, { type: originalFile.type }) as FileWithPath;
      (newFile as any).path = newPath;
      updatedFiles[index] = newFile;
      
      return updatedFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    getFilesFromEvent: async (event: any) => {
        const fileList: FileWithPath[] = [];
        const items = event.dataTransfer?.items;
  
        if (items) {
          const promises = Array.from(items).map(async (item: any) => {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              return getFilesFromEntry(entry);
            }
            return [];
          });
          const allFiles = await Promise.all(promises);
          fileList.push(...allFiles.flat());
        } else if (event.target.files) {
            const files = Array.from(event.target.files as FileList) as FileWithPath[];
            for(const file of files) {
                if (!file.path) {
                    (file as any).path = file.name;
                }
            }
            fileList.push(...files);
        }

        return fileList;
      },
  });

  const getFilesFromEntry = async (entry: any, path = ''): Promise<FileWithPath[]> => {
    if (entry.isFile) {
      return new Promise((resolve, reject) => {
        entry.file((file: File) => {
          const fileWithPath = file as FileWithPath;
          (fileWithPath as any).path = path + file.name;
          resolve([fileWithPath]);
        }, reject);
      });
    } else if (entry.isDirectory) {
      return new Promise((resolve, reject) => {
        const dirReader = entry.createReader();
        dirReader.readEntries(async (entries: any[]) => {
          const allFiles = await Promise.all(entries.map(innerEntry => getFilesFromEntry(innerEntry, path + entry.name + '/')));
          resolve(allFiles.flat());
        }, reject);
      });
    }
    return [];
  };

  const fileList = useMemo(() => files.map((file, index) => (
    <li key={`${file.path}-${file.size}-${index}`} className="text-sm text-muted-foreground flex items-center gap-2">
      <Input
        id={`file-path-${index}`}
        aria-label="File path"
        value={file.path || ''}
        onChange={(e) => handleFileNameChange(index, e.target.value)}
        className="h-8 text-sm"
        disabled={isProcessing}
      />
    </li>
  )), [files, isProcessing, handleFileNameChange]);

  const handleClear = () => {
    setFiles([]);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast({ title: 'No files selected', description: 'Please upload files to analyze.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to analyze a project.', variant: 'destructive' });
      return;
    }

    try {
        const uploadedFiles: UploadedFile[] = await Promise.all(files.map(async (file) => ({
          path: file.path!,
          content: await readFileAsDataURL(file)
        })));

        await startAnalysis(uploadedFiles, isPublic);
        
        toast({ title: 'Analysis Started', description: 'Your project is now being analyzed. You can see progress on the main page.' });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ title: 'Operation Failed', description: errorMessage, variant: 'destructive' });
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'} ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          <div className="text-center">
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-foreground">
              {files.length > 0 ? 'Add more files or folders' : 'Drag & drop files/folders here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">The system will attempt to analyze any file type you upload.</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Uploaded Files ({files.length})</h3>
                {!isProcessing && (
                    <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <ScrollArea className="h-40 rounded-md border p-4">
              <ul className="space-y-2">{fileList}</ul>
            </ScrollArea>
            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="privacy-switch" 
                        checked={!isPublic}
                        onCheckedChange={(checked) => setIsPublic(!checked)}
                        disabled={isProcessing}
                    />
                    <Label htmlFor="privacy-switch">Make Project Private</Label>
                </div>
              <Button onClick={handleAnalyze} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {detailedStatus ? `${detailedStatus}...` : 'Analyze Project'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
