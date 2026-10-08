'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/30 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            {error.message || 'An unexpected error occurred while loading this view.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground text-center">
          {error.digest && <code>Error code: {error.digest}</code>}
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => retry()} className="gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button asChild className="gap-2 cursor-pointer">
            <Link href="/today">
              <Home className="w-4 h-4" />
              Go to Today
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
