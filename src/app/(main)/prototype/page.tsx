'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat-interface";
import { FileUpload } from "@/components/file-upload";

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
        title="Prototype"
        subtitle="Generate a new prototype by chatting with the AI or uploading files for analysis."
      />
      {detailedStatus ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>{detailedStatus}...</p>
          </div>
        ) : (
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
      )}
    </div>
  );
}
