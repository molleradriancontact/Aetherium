'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat-interface";
import { FileUpload } from "@/components/file-upload";
import { PrototypingInterface } from "@/components/prototyping-interface";

export default function PrototypePage() {
  const { isHydrated, analysisReport, detailedStatus } = useAppState();

  if (!isHydrated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {detailedStatus && <p className="mt-4 text-muted-foreground">{detailedStatus}...</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Prototype"
        subtitle="Generate a new prototype from scratch or work on an existing one."
      />

      {!analysisReport ? (
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat with AI</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>
          <TabsContent value="upload">
            <FileUpload />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {detailedStatus && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{detailedStatus}...</p>
            </div>
          )}
          <PrototypingInterface
            enabledScopes={['frontend', 'backend']}
            header={{
              title: 'Generate Full-Stack Prototype',
              description: 'Use the AI\'s analysis to generate prototyped code changes for both the frontend and backend. You can review the generated files before deciding to apply them.'
            }}
          />
        </>
      )}
    </div>
  );
}
