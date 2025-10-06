
'use client';

import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export function ProjectActivityFeed() {
    const { history, isHydrated } = useAppState();

    if (!isHydrated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }
    
    // Get the last 5 items and reverse them to show most recent first
    const recentHistory = history.slice(-5).reverse();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                     <GitBranch className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {recentHistory.length > 0 ? (
                     <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-[7px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                        
                        <ul className="space-y-6">
                            {recentHistory.map((item) => (
                            <li key={item.id} className="relative flex items-start">
                                <div className="absolute left-[-6px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-foreground leading-tight">{item.message}</p>
                                    <time className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                    </time>
                                </div>
                            </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No activity recorded for this project yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
