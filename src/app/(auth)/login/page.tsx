'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Shield, Sparkles, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setIsSubmitting(true);
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || err?.msg || '';
      if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('unsupported provider')) {
        toast.error(
          `${provider === 'google' ? 'Google' : 'GitHub'} sign-in is not enabled in your Supabase project yet. Enable it in Supabase Dashboard (Auth → Providers), or sign in with Email & Password below.`,
          { duration: 7000 }
        );
      } else {
        toast.error(msg || `Failed to sign in with ${provider}`);
      }
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email or proceed if email confirmation is disabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Signed in successfully');
        window.location.href = '/today';
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background text-foreground relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold text-2xl mb-1 shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sproj</h1>
          <p className="text-sm text-muted-foreground">
            A session replaces the task. Live study & work accountability with your partner.
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/80 bg-card/80 backdrop-blur-md shadow-md">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-xs">
              Connect to your shared workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={() => handleOAuth('google')}
                disabled={isSubmitting}
                className="w-full h-10 text-xs font-medium gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOAuth('github')}
                disabled={isSubmitting}
                className="w-full h-10 text-xs font-medium gap-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                GitHub
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <span className="w-full border-t border-border" />
              <span className="bg-card px-2 text-[10px] uppercase text-muted-foreground tracking-wider absolute">
                or email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer transition-colors"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
          <div className="p-2 rounded-lg bg-card/40 border border-border/50">
            <span className="font-semibold text-foreground block">Server-Saved</span>
            Survives closing tab
          </div>
          <div className="p-2 rounded-lg bg-card/40 border border-border/50">
            <span className="font-semibold text-foreground block">Realtime</span>
            Live partner presence
          </div>
          <div className="p-2 rounded-lg bg-card/40 border border-border/50">
            <span className="font-semibold text-foreground block">Offline PWA</span>
            Queues timer actions
          </div>
        </div>
      </div>
    </div>
  );
}
