
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppState } from "@/hooks/use-app-state";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight, Code, Database, FileText } from "lucide-react";

interface InfoAccordionProps {
    analysisReport: string | null;
    frontendSuggestions: { suggestedChanges: string; reasoning: string } | null;
    backendSuggestions: { suggestedChanges: string; reasoning: string } | null;
}

export function InfoAccordion({ analysisReport, frontendSuggestions, backendSuggestions }: InfoAccordionProps) {
    return (
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            {analysisReport && (
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-medium">Analysis Report</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-4">
                            {analysisReport}
                        </p>
                        <Link href="/analysis">
                            <Button size="sm">View Full Report <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </AccordionContent>
                </AccordionItem>
            )}
            {frontendSuggestions && (
                 <AccordionItem value="item-2">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <Code className="h-5 w-5 text-primary" />
                            <span className="font-medium">Frontend Suggestions</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                            {frontendSuggestions.suggestedChanges}
                        </p>
                        <Link href="/frontend">
                            <Button size="sm" variant="secondary">Prototype Frontend</Button>
                        </Link>
                    </AccordionContent>
                </AccordionItem>
            )}
             {backendSuggestions && (
                <AccordionItem value="item-3">
                    <AccordionTrigger>
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-primary" />
                            <span className="font-medium">Backend Suggestions</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                            {backendSuggestions.suggestedChanges}
                        </p>
                        <Link href="/backend">
                            <Button size="sm" variant="secondary">Prototype Backend</Button>
                        </Link>
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
    );
}
