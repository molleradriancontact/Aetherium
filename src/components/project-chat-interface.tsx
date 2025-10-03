
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, User, Copy, CopyCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/use-app-state';
import { projectChat } from '@/ai/flows/project-chat';
import type { Message } from '@/ai/flows/schemas';

export function ProjectChatInterface() {
  const [input, setInput] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { projectId, chatHistory, addChatMessage, analysisReport, detailedStatus } = useAppState();

  const messages = chatHistory || [];
  const isLoading = !!detailedStatus;

  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;

    const userMessage: Message = { role: 'user', content: input };
    await addChatMessage(projectId, userMessage);
    setInput('');

    startResponding(async () => {
      try {
        const result = await projectChat({
          messages: [...messages, userMessage],
          analysisReport: analysisReport || "",
        });
        
        const aiResponse: Message = { role: 'model', content: result.content };
        await addChatMessage(projectId, aiResponse);
      } catch (error) {
        console.error('Project Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        const errorResponse: Message = { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` };
        if (projectId) {
            await addChatMessage(projectId, errorResponse);
        }
      }
    });
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(index);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedMessageId(null), 2000);
  }

  const handleCopyChat = () => {
    const chatHistoryText = messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(chatHistoryText);
    toast({ title: "Chat history copied!" });
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Project Chat</CardTitle>
            <CardDescription>
                Ask the AI anything about your project's analysis.
            </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyChat} disabled={messages.length === 0}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Chat
        </Button>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <ScrollArea className="flex-grow w-full rounded-md border" viewportRef={scrollAreaViewportRef}>
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`group/message flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                
                <div className="relative rounded-lg p-3 text-sm bg-muted max-w-xl">
                  <pre className="whitespace-pre-wrap font-sans break-words">{message.content}</pre>
                   <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
                    onClick={() => handleCopyMessage(message.content, index)}
                  >
                    {copiedMessageId === index ? <CopyCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
             {messages.length === 0 && !isResponding && (
                <div className="text-center text-muted-foreground p-8">
                    <Bot className="h-10 w-10 mx-auto mb-4" />
                    <p>This is the project-aware chat.</p>
                    <p className="text-xs mt-2">Ask me anything about the analysis report or suggest modifications.</p>
                </div>
             )}
              {isResponding && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-primary" />
                <div className="rounded-lg bg-muted p-3 text-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-start gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your project..."
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={3}
            disabled={isResponding || isLoading}
          />
          <Button onClick={handleSend} disabled={isResponding || isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
