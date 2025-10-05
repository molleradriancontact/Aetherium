
'use client';

import { PageHeader } from "@/components/page-header";
import { ResearchChatInterface } from "@/components/research-chat-interface";

export default function ResearchPage() {
    return (
        <div className="space-y-8">
            <PageHeader 
                title="Deep Research"
                subtitle="Engage with the AI to perform deep research on any topic, powered by web search."
            />
            <ResearchChatInterface />
        </div>
    );
}
