
'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { Loader2 } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { FileUpload } from "@/components/file-upload";
import { CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                 <CardDescription className="text-center mb-4 px-2">
                    Start a conversation to brainstorm your ideas. The AI can then save your conversation as a document to begin a full analysis.
                </CardDescription>
                <ChatInterface />
            </div>
             <div>
                <CardDescription className="text-center mb-4 px-2">
                    Or, upload existing documents, code, or project files. The AI will perform a deep analysis and generate a comprehensive report.
                </CardDescription>
                <FileUpload />
            </div>
        </div>
      )}
    </div>
  );
}
