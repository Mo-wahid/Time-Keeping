import React from 'react';

export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-20 rounded-xl bg-muted/50 border border-border/40" />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-64 rounded-xl bg-muted/40 border border-border/40" />
        <div className="md:col-span-1 h-64 rounded-xl bg-muted/40 border border-border/40" />
      </div>

      {/* List / Feed Skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-40 rounded bg-muted/60" />
        <div className="h-24 rounded-xl bg-muted/30 border border-border/40" />
        <div className="h-24 rounded-xl bg-muted/30 border border-border/40" />
      </div>
    </div>
  );
}
