"use client"

export interface LeaderboardEntry {
  id: string
  name: string
  clicks: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string | null
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <div className="border border-border bg-card flex flex-col">
      <div className="p-8 pb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Leaderboard
        </p>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mt-1">
          Top 10 Brisbane
        </p>
      </div>

      <div className="flex flex-col">
        {entries.length === 0 && (
          <div className="px-8 py-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No scores yet. Be the first.
            </p>
          </div>
        )}
        {entries.map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId
          return (
            <div
              key={entry.id}
              className={`flex items-center px-8 py-3 border-t border-border relative ${
                isCurrentUser ? "bg-primary/5" : ""
              }`}
            >
              {isCurrentUser && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
              )}
              <span
                className={`font-mono text-xs w-8 ${
                  isCurrentUser
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`font-mono text-xs flex-1 ${
                  isCurrentUser ? "text-foreground" : "text-foreground/70"
                }`}
              >
                {entry.name}
              </span>
              <span
                className={`font-mono text-xs tabular-nums ${
                  isCurrentUser ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {entry.clicks.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
