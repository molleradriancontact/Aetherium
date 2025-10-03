
'use client';

import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, X } from 'lucide-react';
import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyzeFilesAction } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

function createTree(files: { path: string }[]): string {
  const root: any = {};
  for (const file of files) {
    const path = file.path;
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
  // This is a simple representation; for a real webkitdirectory upload,
  // you would get relative paths. We'll use the file names for this example.
  return formatTree(root);
}

export function FileUpload() {
  const { setIsLoading, setAnalysisReport, setFrontendSuggestions, setBackendSuggestions, addHistory, clearState } = useAppState();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: files.length > 0 });

  const fileList = useMemo(() => files.map(file => (
    <li key={file.name + file.size} className="text-sm text-muted-foreground">
      {file.name}
    </li>
  )), [files]);

  const handleClear = () => {
    setFiles([]);
    clearState();
  }

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast({ title: 'No files selected', description: 'Please upload files to analyze.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);
    addHistory('Preparing files for analysis...');

    const fileContents = await Promise.all(files.map(file => file.text()));

    const codeSnippets = files.map((file, index) =>
      `--- ${file.name} ---\n${fileContents[index]}`
    ).join('\n\n');

    const fileStructure = createTree(files.map(f => ({ path: f.name })));
    
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
    
    setIsLoading(false);
    setIsProcessing(false);
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
              {files.length > 0 ? 'Add more files' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">Upload files and folders for OS analysis</p>
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
                Analyze Files
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
