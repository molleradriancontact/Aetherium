
'use client';

import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, X } from 'lucide-react';
import React, { useCallback, useState, useMemo, useRef } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { analyzeFilesAction } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

export function FileUpload() {
  const { setIsLoading, setAnalysisReport, setFrontendSuggestions, setBackendSuggestions, addHistory, createProject, clearState } = useAppState();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles((prevFiles) => {
      const newFiles = acceptedFiles.filter(
        (file) => !prevFiles.some((prevFile) => prevFile.path === file.path)
      );
      return [...prevFiles, ...newFiles];
    });
  }, []);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    getFilesFromEvent: async event => {
        const files = Array.from(event.target.files);
        return files as FileWithPath[];
    }
  });

  const fileList = useMemo(() => files.map(file => (
    <li key={file.path} className="text-sm text-muted-foreground">
      {file.path}
    </li>
  )), [files]);

  const handleClear = () => {
    setFiles([]);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast({ title: 'No files selected', description: 'Please upload files to analyze.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);
    clearState(false);
    
    function createTree(files: { path: string }[]): string {
        const root: any = {};
        for (const file of files) {
          const path = file.path;
          if (typeof path !== 'string') continue;
      
          let current = root;
          const parts = path.split('/');
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = i === parts.length - 1 ? null : {};
            }
            current = current[part];
          }
        }
      
        function formatTree(node: any, prefix = ''): string {
          const entries = Object.entries(node);
          let result = '';
          entries.forEach(([key, value], index) => {
            const isLast = index === entries.length - 1;
            result += `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
            if (value !== null) {
              result += formatTree(value, `${prefix}${isLast ? '    ' : '│   '}`);
            }
          });
          return result;
        }
        return formatTree(root);
    }

    try {
        await createProject(`New Analysis - ${new Date().toLocaleString()}`);
        addHistory('Project created. Preparing files for analysis...');
        
        const fileDataUris = await Promise.all(files.map(readFileAsDataURL));

        const codeSnippets = files.map((file, index) =>
        `--- ${file.path} ---\n${fileDataUris[index]}`
        ).join('\n\n');

        const filePaths = files.map(f => ({ path: f.path as string }));
        const fileStructure = createTree(filePaths);
        
        addHistory('Starting AI analysis...');
        const result = await analyzeFilesAction({ fileStructure, codeSnippets });
        
        if (result.success) {
            setAnalysisReport(result.report);
            setFrontendSuggestions(result.frontendSuggestions);
            setBackendSuggestions(result.backendSuggestions);
            addHistory('Analysis complete. Report generated.');
            toast({ title: 'Analysis Complete', description: 'The analysis report has been generated successfully.' });
        } else {
            addHistory(`Analysis failed: ${result.error}`);
            toast({ title: 'Analysis Failed', description: result.error, variant: 'destructive' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        addHistory(`Operation failed: ${errorMessage}`);
        toast({ title: 'Operation Failed', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsLoading(false);
        setIsProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
        >
          <input {...getInputProps()} />
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
                <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="h-40 rounded-md border p-4">
              <ul className="space-y-1">{fileList}</ul>
            </ScrollArea>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleAnalyze} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Project
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
