"use client";

import { LearningSession } from "@/lib/learning-types";

interface RecentSessionsProps {
  mode: string;
  isLoadingRecent: boolean;
  recentError: string | null;
  sessions: LearningSession[];
  onSelectSession: (sessionId: string, mode: string) => void;
}

export function RecentSessions({
  mode,
  isLoadingRecent,
  recentError,
  sessions,
  onSelectSession,
}: RecentSessionsProps) {
  if (mode === "dictation") {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
        <p className="font-semibold">How Dictation Is Checked</p>
        <p className="text-muted-foreground">
          Ignore punctuation and uppercase/lowercase.
        </p>
        <p className="text-muted-foreground">
          Every wrong word shows the correct word under it.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-semibold mb-2">Recent Sessions</p>
      {isLoadingRecent ? (
        <p className="text-sm text-muted-foreground">Loading sessions...</p>
      ) : recentError ? (
        <p className="text-sm text-red-700 dark:text-red-400">{recentError}</p>
      ) : sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectSession(item.id, item.mode)}
              className="w-full rounded-lg border border-border px-3 py-2 text-left hover:border-primary"
            >
              <p className="text-sm font-medium line-clamp-1">
                {item.title || "Untitled session"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.mode.replace("_", " ")} - {item.topic}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      )}
    </div>
  );
}
