'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle2, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PWAInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult?.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">App Installed</p>
              <p className="text-xs text-muted-foreground">
                Sproj is running in standalone Progressive Web App mode.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // On iOS Safari
  if (isIOS) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Install on iPhone / iPad</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To install Sproj on iOS, tap the <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Share className="h-3 w-3 inline" /> Share</span> button in Safari, then select <strong className="text-foreground font-semibold">&quot;Add to Home Screen&quot;</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  // On Android/Chrome with deferred prompt
  if (deferredPrompt) {
    return (
      <Card className="border-primary/40 bg-primary/5 backdrop-blur-xs">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Install Sproj App</p>
              <p className="text-xs text-muted-foreground">
                Install to home screen for fullscreen focus and offline access.
              </p>
            </div>
          </div>
          <Button onClick={handleInstallClick} size="sm" className="gap-1.5 cursor-pointer shrink-0">
            <Download className="h-3.5 w-3.5" />
            Install
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
