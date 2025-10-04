
'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PreviewComponent = () => {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<string | null>(null);

    const dataUrl = useMemo(() => {
        if (!code) return null;
        const blob = new Blob([code], { type: 'text/javascript' });
        return URL.createObjectURL(blob);
    }, [code]);

    useEffect(() => {
        if (dataUrl) {
            import(/* @vite-ignore */ dataUrl)
                .then(module => {
                    if (module.default) {
                        setComponent(() => module.default);
                    } else {
                        setError("The component doesn't have a default export.");
                    }
                })
                .catch(err => {
                    console.error("Error loading dynamic component:", err);
                    setError(`Failed to load component: ${err.message}`);
                });
        }
    }, [dataUrl]);
    
    if (error) {
        return <div className="p-4 text-destructive-foreground bg-destructive rounded-md">Error: {error}</div>;
    }

    if (!Component) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return <Component />;
};


export function Preview() {
    return (
        <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PreviewComponent />
        </Suspense>
    )
}

