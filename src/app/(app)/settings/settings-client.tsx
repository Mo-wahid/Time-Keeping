'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateProfile } from '@/actions/profile';
import { createWorkspace, joinWorkspace, regenerateInviteCode } from '@/actions/workspace';
import { signOut } from '@/actions/auth';
import { useTheme } from 'next-themes';
import {
  User,
  Users,
  Bell,
  Palette,
  Shield,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Download,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsClientProps {
  profile: any;
  workspace: any;
  isOwner: boolean;
  userEmail: string;
}

export function SettingsClient({
  profile,
  workspace,
  isOwner,
  userEmail,
}: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Profile Form state
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [timezone, setTimezone] = useState(
    profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [weekStart, setWeekStart] = useState<number>(profile.week_start ?? 1);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Workspace form state
  const [inviteCode, setInviteCode] = useState(workspace?.invite_code || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Join workspace state
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Create workspace state
  const [newWsName, setNewWsName] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      await updateProfile({
        full_name: fullName.trim(),
        timezone,
        week_start: weekStart,
      });
      toast.success('Profile preferences updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateInvite = async () => {
    if (!workspace?.id) return;
    try {
      setIsRegenerating(true);
      const updated = await regenerateInviteCode(workspace.id);
      setInviteCode(updated.invite_code);
      toast.success('New invite code generated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate invite code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setIsJoining(true);
      const formData = new FormData();
      formData.set('invite_code', joinCode.trim());
      await joinWorkspace(formData);
      toast.success('Successfully joined workspace!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join workspace');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      setIsCreatingWs(true);
      const formData = new FormData();
      formData.set('name', newWsName.trim());
      await createWorkspace(formData);
      toast.success('Workspace created!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleTogglePush = async (checked: boolean) => {
    if (checked) {
      if (!('Notification' in window)) {
        toast.error('This browser does not support push notifications.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Push notifications enabled for partner sessions!');
      } else {
        toast.error('Notification permission was not granted.');
        setPushEnabled(false);
      }
    } else {
      setPushEnabled(false);
      toast.info('Push notifications disabled');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your profile, partner workspace, and app preferences.
        </p>
      </div>

      {/* 1. Profile Section */}
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-500" />
            Profile Preferences
          </CardTitle>
          <CardDescription className="text-xs">
            How your accountability partner identifies you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prof-name" className="text-xs">
                  Display Name
                </Label>
                <Input
                  id="prof-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prof-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="prof-email"
                  value={userEmail}
                  disabled
                  className="h-8 text-xs bg-muted/40 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prof-tz" className="text-xs">
                  Timezone
                </Label>
                <Input
                  id="prof-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Week Starts On</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekStart(1)}
                    className={`h-8 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${
                      weekStart === 1
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    Monday
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStart(0)}
                    className={`h-8 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${
                      weekStart === 0
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    Sunday
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Workspace & Partner Section */}
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            Accountability Workspace
          </CardTitle>
          <CardDescription className="text-xs">
            Share this invite code with your accountability partner to pair up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Active Workspace</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {workspace?.name || 'Accountability Space'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Invite Code: <span className="font-bold text-foreground">{inviteCode}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInvite}
                  className="h-8 text-xs gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>

                {isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateInvite}
                    disabled={isRegenerating}
                    title="Regenerate code"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
            {/* Join another workspace */}
            <form onSubmit={handleJoinWorkspace} className="space-y-2">
              <Label htmlFor="join-code" className="text-xs">
                Join Another Workspace
              </Label>
              <div className="flex gap-2">
                <Input
                  id="join-code"
                  placeholder="Enter 12-char code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isJoining || !joinCode.trim()}
                  className="h-8 text-xs"
                >
                  Join
                </Button>
              </div>
            </form>

            {/* Create new workspace */}
            <form onSubmit={handleCreateWorkspace} className="space-y-2">
              <Label htmlFor="create-ws" className="text-xs">
                Create New Workspace
              </Label>
              <div className="flex gap-2">
                <Input
                  id="create-ws"
                  placeholder="Workspace Name"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingWs || !newWsName.trim()}
                  className="h-8 text-xs"
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* 3. Notifications & Appearance */}
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-emerald-500" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme selector */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Appearance Theme</Label>
              <p className="text-xs text-muted-foreground">Select color theme</p>
            </div>
            <div className="flex items-center gap-1 border border-border p-1 rounded-lg">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-all cursor-pointer ${
                    mounted && theme === t
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Push notification toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-primary" />
                Browser Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your partner starts a focus session
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handleTogglePush}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Danger / Account Zone */}
      <Card className="border-border bg-card/60 backdrop-blur-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Sign Out</p>
            <p className="text-xs text-muted-foreground">
              Sign out from this device
            </p>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
