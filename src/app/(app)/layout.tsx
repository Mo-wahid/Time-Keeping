import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { CommandPalette } from '@/components/command-palette';
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  let { data: profile }: any = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Fallback if trigger hasn't fired or during development
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    await (supabase.from('profiles') as any).insert({
      id: user.id,
      full_name: name,
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

  // Get user's active workspace membership
  const { data: memberRows }: any = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .limit(1);

  let activeWorkspace = memberRows?.[0]?.workspaces as any;

  // If user has no workspace yet, auto-create a default one
  if (!activeWorkspace) {
    const defaultName = `${profile.full_name}'s Space`;
    const { data: newWs } = await supabase
      .from('workspaces')
      .insert({
        name: defaultName,
        created_by: user.id,
      })
      .select()
      .single();

    if (newWs) {
      await supabase.from('workspace_members').insert({
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
