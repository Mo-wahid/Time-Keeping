export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus = 'running' | 'paused' | 'completed';
export type FocusType = 'explore' | 'learn' | 'build' | 'review' | 'plan';
export type SessionSource = 'timer' | 'manual';
export type AttachmentKind = 'file' | 'link';
export type GoalType = 'hours' | 'sessions' | 'outcome';
export type GoalStatus = 'active' | 'completed' | 'missed';
export type WorkspaceRole = 'owner' | 'member';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  week_start: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  profiles?: Profile;
}

export interface Session {
  id: string;
  user_id: string;
  workspace_id: string;
  status: SessionStatus;
  focus_type: FocusType;
  intent: string;
  outcome: string | null;
  notes: string | null;
  source: SessionSource;
  project_tag: string | null;
  started_at: string;
  ended_at: string | null;
  total_seconds: number;
  created_at: string;
  updated_at: string;
  session_segments?: SessionSegment[];
  attachments?: Attachment[];
  reactions?: Reaction[];
  profiles?: Profile;
}

export interface SessionSegment {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_s: number | null;
}

export interface Attachment {
  id: string;
  session_id: string;
  user_id: string;
  kind: AttachmentKind;
  name: string;
  url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  workspace_id: string;
  week_start: string;
  type: GoalType;
  title: string;
  target: number | null;
  current: number;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  workspace_id: string;
  week_start: string;
  wins: string | null;
  blockers: string | null;
  next_week: string | null;
  created_at: string;
  updated_at: string;
  reactions?: Reaction[];
  profiles?: Profile;
}

export interface Reaction {
  id: string;
  user_id: string;
  session_id: string | null;
  reflection_id: string | null;
  emoji: string;
  created_at: string;
  profiles?: Profile;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, 'id' | 'invite_code' | 'created_at'> & {
          id?: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: Partial<Workspace>;
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: WorkspaceMember;
        Update: Partial<WorkspaceMember>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'total_seconds'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          total_seconds?: number;
        };
        Update: Partial<Session>;
        Relationships: [];
      };
      session_segments: {
        Row: SessionSegment;
        Insert: Omit<SessionSegment, 'id'> & { id?: string };
        Update: Partial<SessionSegment>;
        Relationships: [];
      };
      attachments: {
        Row: Attachment;
        Insert: Omit<Attachment, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Attachment>;
        Relationships: [];
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current' | 'status'> & {
          id?: string;
          current?: number;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Goal>;
        Relationships: [];
      };
      weekly_reflections: {
        Row: WeeklyReflection;
        Insert: Omit<WeeklyReflection, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeeklyReflection>;
        Relationships: [];
      };
      reactions: {
        Row: Reaction;
        Insert: Omit<Reaction, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Reaction>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscription;
        Insert: Omit<PushSubscription, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<PushSubscription>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: {
        Args: { ws_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      session_status: SessionStatus;
      focus_type: FocusType;
      session_source: SessionSource;
      attachment_kind: AttachmentKind;
      goal_type: GoalType;
      goal_status: GoalStatus;
    };
  };
}
