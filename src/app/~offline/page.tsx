import React from 'react';
import Link from 'next/link';
import { WifiOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-border bg-card">
        <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re Offline</h1>
        <p className="text-sm text-muted-foreground">
          Don&apos;t worry! Your timer actions and session logs are being queued locally in your browser and will automatically synchronize when your internet connection is restored.
        </p>
        <div className="pt-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/today">
              <RotateCcw className="h-4 w-4" />
              Return to Today&apos;s Timer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
