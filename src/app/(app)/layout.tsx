import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, getUserProfile, getActiveWorkspace } from '@/lib/supabase/cached';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { CommandPalette } from '@/components/command-palette';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile and active workspace in parallel with request-scoped caching
  let [profile, activeWsResult] = await Promise.all([
    getUserProfile(user.id),
    getActiveWorkspace(user.id),
  ]);

  const supabase = await createServerSupabase();

  // Handle rare first-time bootstrap if database triggers haven't populated profile
  if (!profile) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    await (supabase.from('profiles') as any).upsert({
      id: user.id,
      full_name: name,
      avatar_url: user.user_metadata?.avatar_url || null,
    });
    profile = {
      id: user.id,
      full_name: name,
      avatar_url: user.user_metadata?.avatar_url || null,
      timezone: 'UTC',
      week_start: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  let activeWorkspace = activeWsResult?.workspace;

  // Handle rare first-time workspace creation if not yet member of any workspace
  if (!activeWorkspace) {
    const defaultName = `${profile.full_name}'s Space`;
    const { data: newWs } = await (supabase.from('workspaces') as any)
      .insert({
        name: defaultName,
        created_by: user.id,
      })
      .select()
      .single();

    if (newWs) {
      await (supabase.from('workspace_members') as any).insert({
        workspace_id: newWs.id,
        user_id: user.id,
        role: 'owner',
      });
      activeWorkspace = newWs;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        workspaceName={activeWorkspace?.name}
        inviteCode={activeWorkspace?.invite_code}
        userName={profile.full_name}
        userAvatar={profile.avatar_url}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Cmd+K Palette */}
      <CommandPalette inviteCode={activeWorkspace?.invite_code} />
    </div>
  );
}
