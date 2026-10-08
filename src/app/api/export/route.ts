import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sessions, error }: any = await supabase
    .from('sessions')
    .select('id, started_at, ended_at, total_seconds, status, focus_type, intent, outcome, notes, project_tag, source')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const privateCacheHeaders = {
    'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (format === 'csv') {
    const headers = [
      'id',
      'started_at',
      'ended_at',
      'duration_minutes',
      'focus_type',
      'intent',
      'outcome',
      'project_tag',
      'source',
    ];

    // Mitigate CSV formula injection (CWE-1236)
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = (sessions || []).map((s: any) => [
      escapeCsv(s.id),
      escapeCsv(s.started_at),
      escapeCsv(s.ended_at),
      escapeCsv(Math.round((s.total_seconds || 0) / 60)),
      escapeCsv(s.focus_type),
      escapeCsv(s.intent),
      escapeCsv(s.outcome),
      escapeCsv(s.project_tag),
      escapeCsv(s.source),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sproj-sessions.csv"',
        ...privateCacheHeaders,
      },
    });
  }

  return NextResponse.json(sessions, {
    headers: {
      'Content-Disposition': 'attachment; filename="sproj-sessions.json"',
      ...privateCacheHeaders,
    },
  });
}
