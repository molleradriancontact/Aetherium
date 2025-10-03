
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { Library, File, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

function isDataUri(uri: string) {
    return uri.startsWith('data:');
}

function renderContent(content: string) {
    if (!isDataUri(content)) {
        return (
            <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                {content}
            </pre>
        );
    }
    
    if (content.startsWith('data:image/')) {
        return <img src={content} alt="uploaded content" className="max-w-full h-auto rounded-md" />;
    }

    if (content.startsWith('data:application/pdf')) {
        return (
            <div className="w-full h-[600px]">
                <object data={content} type="application/pdf" width="100%" height="100%">
                    <p>This browser does not support PDFs. Please download the PDF to view it: <a href={content}>Download PDF</a>.</p>
                </object>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4 bg-muted p-4 rounded-md">
            <File className="h-8 w-8 text-muted-foreground" />
            <div>
                <p className="font-medium">Unsupported File Type</p>
                <p className="text-sm text-muted-foreground">Cannot display a preview for this file.</p>
                <a href={content} download="download">
                    <Button variant="link" className="p-0 h-auto mt-1">Download File</Button>
                </a>
            </div>
        </div>
    )
}

export default function LibraryPage() {
  const { uploadedFiles, isLoading, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="File Library"
        subtitle="Browse the content of all files uploaded for the current analysis."
      />
      
      {isLoading && <p className="text-muted-foreground">Loading library...</p>}

      {!isLoading && uploadedFiles.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Library className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Library is Empty</CardTitle>
            <CardDescription className="mt-2">
                You haven't uploaded any files for analysis yet.
            </CardDescription>
            <Link href="/" >
                <Button className="mt-6">Go to Dashboard</Button>
            </Link>
        </Card>
      )}

      {!isLoading && uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
            <CardDescription>Click on a file to view its content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {uploadedFiles.map((file, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm">{file.path}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[600px] w-full p-1">
                        {renderContent(file.content)}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
