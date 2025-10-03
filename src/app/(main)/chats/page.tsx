
'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { ArchitectProject, useAppState } from "@/app/provider";
import { MessageSquare, Loader2, PlusCircle, ArrowRight, Edit, Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from 'date-fns';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ChatsPage() {
  const { user, firestore } = useFirebase();
  const { clearState, isHydrated, setProjectId } = useAppState();
  const [chats, setChats] = useState<ArchitectProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !firestore) return;

    const chatsColRef = collection(firestore, 'users', user.uid, 'projects');
    const q = query(chatsColRef, where('projectType', '==', 'chat'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as ArchitectProject;
      });
      setChats(userChats);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  useEffect(() => {
    if (renamingId && inputRef.current) {
        inputRef.current.focus();
    }
  }, [renamingId])

  const handleNewChat = () => {
    clearState(true);
  };

  const startRename = (project: ArchitectProject) => {
    setRenamingId(project.id);
    setNewName(project.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setNewName("");
  };

  const confirmRename = async () => {
    if (!renamingId || !newName.trim() || !user || !firestore) return;
    
    const chatDocRef = doc(firestore, 'users', user.uid, 'projects', renamingId);
    try {
      await updateDoc(chatDocRef, { name: newName.trim() });
      toast({ title: "Chat renamed successfully!" });
    } catch (error) {
      console.error("Failed to rename chat:", error);
      toast({ title: "Failed to rename chat", variant: "destructive" });
    } finally {
      cancelRename();
    }
  };
  
  if (!isHydrated || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Chats"
          subtitle="Manage your past conversations or start a new one."
          className="mb-0"
        />
        <Link href="/" onClick={handleNewChat}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Chat
            </Button>
        </Link>
      </div>

      {chats.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Chats Found</CardTitle>
            <CardDescription className="mt-2">
                Get started by starting a new conversation in The Lab.
            </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chats.map(p => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                {renamingId === p.id ? (
                    <div className="flex items-center gap-2">
                        <Input 
                            ref={inputRef}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                            className="text-xl"
                        />
                         <Button variant="ghost" size="icon" onClick={confirmRename}><Check className="h-4 w-4"/></Button>
                         <Button variant="ghost" size="icon" onClick={cancelRename}><X className="h-4 w-4"/></Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl truncate">{p.name}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => startRename(p)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <CardDescription>
                  Started {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.chatHistory?.slice(-1)[0]?.content || 'No messages yet.'}
                 </p>
              </CardContent>
              <CardContent>
                 <Link href="/" onClick={() => setProjectId(p.id)}>
                    <Button className="w-full" variant="secondary">
                        Continue Chat
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
