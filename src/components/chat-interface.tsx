
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, User, Copy, CopyCheck, Trash2 } from 'lucide-react';
import { chat } from '@/ai/flows/chat';
import type { Message } from '@/ai/flows/schemas';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/use-app-state';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isResponding, startResponding] = useTransition();
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  const { user } = useFirebase();
  const { toast } = useToast();
  const { startAnalysis, projectId, projectType, chatHistory, startChat, addChatMessage, detailedStatus, clearState } = useAppState();

  const isChatProject = projectType === 'chat';
  const messages = isChatProject ? chatHistory : [];
  const isLoading = !!detailedStatus;

  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSaveDocument = async (text: string) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to save a document.', variant: 'destructive' });
      return;
    }
    
    startResponding(async () => {
      try {
        const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
        const newProjectId = await startAnalysis([{ path: 'Pasted Text.txt', content: dataUrl }]);

        toast({ title: 'Analysis Started', description: 'The document is being analyzed. You can see progress on the main page.' });
        if (projectId) { 
            await addChatMessage(projectId, { role: 'model', content: `I've started analyzing the document under a new project. You'll be redirected once it's complete.`});
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ title: 'Operation Failed', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setInput('');
    
    try {
        if (!projectId || !isChatProject) {
            // This is the path for the FIRST message. It creates the project and gets the first AI response.
            startResponding(async () => {
                await startChat(userMessage);
            });
        } else {
            // This is a subsequent message in an existing chat.
            await addChatMessage(projectId, userMessage);
            startResponding(async () => {
                const historyForAI = [...(chatHistory || []), userMessage];
                const result = await chat(historyForAI, currentInput);
                const aiResponse: Message = { role: 'model', content: result.content };
                
                if (result.functionCall?.name === 'saveDocument') {
                    await addChatMessage(projectId, aiResponse);
                    const textToSave = result.functionCall.args.content;
                    await handleSaveDocument(textToSave);
                } else {
                    await addChatMessage(projectId, aiResponse);
                }
            });
        }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ title: "Failed to Send", description: errorMessage, variant: 'destructive' });
      if (projectId) {
          await addChatMessage(projectId, { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` });
      }
    }
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

  const handleClearChat = () => {
    clearState(false);
    toast({ title: "Chat cleared" });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
            Chat with the AI or paste text to create a new document for analysis.
            </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="outline" size="sm" onClick={handleCopyChat} disabled={messages.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearChat} disabled={messages.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 w-full rounded-md border" viewportRef={scrollAreaViewportRef}>
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`group/message flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                
                <div className="relative rounded-lg p-3 text-sm bg-muted">
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
            {isResponding && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-primary" />
                <div className="rounded-lg bg-muted p-3 text-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
             {messages.length === 0 && !isResponding && !isLoading && (
                <div className="text-center text-muted-foreground p-8">
                    <Bot className="h-10 w-10 mx-auto mb-4" />
                    <p>Start a new conversation.</p>
                    <p className="text-xs mt-2">Your chat history will be saved automatically.</p>
                </div>
             )}
              {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
          </div>
        </ScrollArea>
        <div className="flex items-start gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message here..."
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

    