'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();

  const handleCopyError = () => {
    const errorText = `Error: ${error.message}\n\nDigest: ${error.digest}\n\nStack: ${error.stack}`;
    navigator.clipboard.writeText(errorText);
    toast({
      title: "Error Copied",
      description: "The error details have been copied to your clipboard.",
    });
  };

  return (
    <html lang="en" className="dark">
        <head>
            <title>Application Error</title>
        </head>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">Application Error</CardTitle>
              <CardDescription>
                Something went wrong. You can try to recover or copy the error details for debugging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold">Error Message</h3>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
                {error.digest && (
                    <div className="space-y-2">
                        <h3 className="font-semibold">Digest</h3>
                        <p className="font-mono text-sm text-muted-foreground">{error.digest}</p>
                    </div>
                )}
              <div className="space-y-2">
                <h3 className="font-semibold">Stack Trace</h3>
                <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap break-words font-code">
                  {error.stack}
                </pre>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleCopyError}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Error
                </Button>
                <Button variant="outline" onClick={() => reset()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
