
'use client';

import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, X } from 'lucide-react';
import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { analyzeFilesAction } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

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

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

export function FileUpload() {
  const { setIsLoading, setAnalysisReport, setFrontendSuggestions, setBackendSuggestions, addHistory, clearState, createProject, projectId } = useAppState();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileUploadStartTimeRef = useRef<number | null>(null);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    // Each new upload will start a fresh file list for the new analysis.
    const newFiles = acceptedFiles.filter(
        (file) => !files.some((prevFile) => prevFile.path === file.path)
    );
     // If there's an active project and we're adding new files, clear the old state.
    if (projectId && newFiles.length > 0 && (!fileUploadStartTimeRef.current || Date.now() - fileUploadStartTimeRef.current > 1000)) {
        clearState(false); // Don't reset loading state, just clear data
        setFiles(newFiles); // Start with a fresh list
    } else {
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
    fileUploadStartTimeRef.current = Date.now();
  }, [files, projectId, clearState]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.json', '.html', '.css', '.js', '.ts', '.tsx', '.jsx'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
    }
  });

  const fileList = useMemo(() => files.map(file => (
    <li key={file.path} className="text-sm text-muted-foreground">
      {file.path}
    </li>
  )), [files]);

  const handleClear = () => {
    setFiles([]);
    if (projectId) {
        clearState();
    }
  }

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast({ title: 'No files selected', description: 'Please upload files to analyze.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);
    
    try {
        // This flow ensures we are always working on a new project for a new analysis
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
            clearState(); // Clear everything on failure
            setFiles([]); // Also clear the file list from the UI
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        addHistory(`Operation failed: ${errorMessage}`);
        toast({ title: 'Operation Failed', description: errorMessage, variant: 'destructive' });
        clearState(); // Clear everything on failure
        setFiles([]); // Also clear the file list from the UI
    } finally {
        setIsLoading(false);
        setIsProcessing(false);
    }
  };
  
  const inputProps = useMemo(() => {
    const props = getInputProps();
    // The webkitdirectory attributes are non-standard but widely supported for folder uploads.
    // We cast the props to 'any' to avoid TypeScript errors with these attributes.
    const anyProps: any = { ...props };
    anyProps.directory = "true";
    anyProps.webkitdirectory = "true";
    anyProps.mozdirectory = "true";
    return anyProps;
  }, [getInputProps]);

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
        >
          <input {...inputProps} />
          <div className="text-center">
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-foreground">
              {files.length > 0 ? 'Add more files or folders' : 'Drag & drop files/folders here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">Supports common document, text, and image file types.</p>
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
