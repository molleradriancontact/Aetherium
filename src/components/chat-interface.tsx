
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, User, FilePlus } from 'lucide-react';
import { chat } from '@/ai/flows/chat';
import type { Message } from '@/ai/flows/schemas';
import { startAnalysisAction } from '@/app/actions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/use-app-state';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { user } = useFirebase();
  const { toast } = useToast();
  const { setIsLoading: setAppIsLoading, clearState } = useAppState();

  const scrollToBottom = () => {
    setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
  };
  
  const handleSaveDocument = async (text: string) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to save a document.', variant: 'destructive' });
      return;
    }
    
    setAppIsLoading(true);
    clearState(false);
    
    try {
      const dataUrl = `data:text/plain;base64,${btoa(text)}`;
      const result = await startAnalysisAction({
        userId: user.uid,
        files: [{ path: 'Pasted Text.txt', content: dataUrl }]
      });

      if (result.success) {
        toast({ title: 'Analysis Started', description: 'The document is being analyzed. You can see progress in the History page.' });
        setMessages(prev => [...prev, { role: 'model', content: "I've started analyzing the document. You'll be redirected once it's complete."}])
      } else {
        toast({ title: 'Analysis Failed', description: result.error, variant: 'destructive' });
        setAppIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Operation Failed', description: errorMessage, variant: 'destructive' });
      setAppIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const result = await chat([...messages, userMessage]);
      
      if (result.functionCall?.name === 'saveDocument') {
        const textToSave = result.functionCall.args.content;
        await handleSaveDocument(textToSave);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: result.content }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setMessages(prev => [...prev, { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>
          Chat with the AI or paste text to create a new document for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && <Bot className="h-6 w-6 text-primary" />}
                <div className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <pre className="whitespace-pre-wrap font-sans break-words">{message.content}</pre>
                </div>
                {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-primary" />
                <div className="rounded-lg bg-muted p-3 text-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
             {messages.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground p-8">
                    <Bot className="h-10 w-10 mx-auto mb-4" />
                    <p>Start a conversation with the AI.</p>
                    <p className="text-xs mt-2">For example, you can paste a block of code or text and ask me to "save this as a document".</p>
                </div>
             )}
          </div>
        </ScrollArea>
        <div className="flex items-start gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message here, or paste content to be saved as a file..."
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={3}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
