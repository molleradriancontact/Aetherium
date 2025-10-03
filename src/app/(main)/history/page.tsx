
'use client';

import { PageHeader } from "@/components/page-header";
import { useAppState } from "@/hooks/use-app-state";
import { GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HistoryPage() {
  const { history, isHydrated } = useAppState();

  if (!isHydrated) return null;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="History"
        subtitle="A log of all operations performed in this session."
      />

      {history.length === 0 ? (
         <Card className="flex flex-col items-center justify-center p-12 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No History Yet</CardTitle>
            <CardDescription className="mt-2">
                Perform an analysis to start building your history log.
            </CardDescription>
            <Link href="/" >
                <Button className="mt-6">Go to Dashboard</Button>
            </Link>
        </Card>
      ) : (
        <Card>
            <CardContent className="pt-6">
                <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-[30px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                    
                    <ul className="space-y-8">
                        {history.slice().reverse().map((item) => (
                        <li key={item.id} className="relative flex items-start">
                            <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary ring-8 ring-background">
                            </div>
                            <div className="ml-12">
                                <p className="font-medium text-foreground">{item.message}</p>
                                <time className="text-xs text-muted-foreground">
                                    {item.timestamp.toLocaleTimeString()}
                                </time>
                            </div>
                        </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
