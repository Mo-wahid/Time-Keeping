import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { joinWorkspace } from '@/actions/workspace';

export const dynamic = 'force-dynamic';

export default async function JoinWorkspacePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${code}`);
  }

  // Find workspace by invite code
  const { data: workspace }: any = await supabase
    .from('workspaces')
    .select('id, name, created_by, profiles:created_by(full_name)')
    .eq('invite_code', code)
    .single();

  if (!workspace) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <CardTitle className="text-xl">Invalid Invite Link</CardTitle>
          <CardDescription>
            This workspace invite code does not exist or has expired.
          </CardDescription>
          <Button asChild className="mx-auto">
            <a href="/today">Go to My Space</a>
          </Button>
        </Card>
      </div>
    );
  }

  const creatorName = (workspace as any).profiles?.full_name || 'Your partner';

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card className="max-w-md w-full border-border bg-card/80 backdrop-blur-md shadow-md text-center">
        <CardHeader className="pb-2">
          <div className="h-12 w-12 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Join &ldquo;{workspace.name}&rdquo;
          </CardTitle>
          <CardDescription>
            {creatorName} invited you to join their study and accountability space.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            You will be able to see each other&apos;s live timers, daily hours, goals, and Friday reflections.
          </p>

          <form action={joinWorkspace}>
            <input type="hidden" name="invite_code" value={code} />
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              Accept Invite & Join Space
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
