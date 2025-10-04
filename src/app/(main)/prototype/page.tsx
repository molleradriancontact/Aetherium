'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat-interface";
import { FileUpload } from "@/components/file-upload";
import { CardDescription } from "@/components/ui/card";

export default function PrototypePage() {
  const { isHydrated, detailedStatus } = useAppState();

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
        title="Create New Project"
        subtitle="Generate a new prototype by brainstorming with the AI or by analyzing your existing files."
      />
      {detailedStatus ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>{detailedStatus}...</p>
          </div>
        ) : (
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Start from an Idea</TabsTrigger>
            <TabsTrigger value="upload">Analyze Existing Files</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <CardDescription className="text-center mb-4 px-2">
              Start a conversation with the AI to brainstorm and flesh out your ideas. A new "Chat Project" will be created. You can then ask the AI to save text as a document to create a full "Analysis Project".
            </CardDescription>
            <ChatInterface />
          </TabsContent>
          <TabsContent value="upload">
            <CardDescription className="text-center mb-4 px-2">
              Upload your existing documents, code, or project files. The AI will perform a deep analysis and generate a comprehensive report, creating a new "Analysis Project".
            </CardDescription>
            <FileUpload />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
