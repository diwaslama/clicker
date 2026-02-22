"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardProps {
  city: string;
  currentUserId: string | null;
}

interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  total_clicks: number;
}

export default function Leaderboard({ city, currentUserId }: LeaderboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [pulseByUserId, setPulseByUserId] = useState<Record<string, boolean>>({});
  const prevCountsRef = useRef<Record<string, number>>({});
  const timeoutIdsRef = useRef<number[]>([]);

  const fetchTopTen = useCallback(async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("user_id, display_name, city, total_clicks")
      .order("total_clicks", { ascending: false })
      .limit(10);
    console.warn('[leaderboard] data:', data)
    console.warn('[leaderboard] error:', error)

    if (error || !data) return;

    const nextRows = data as LeaderboardRow[];
    const changed = nextRows
      .filter((nextRow) => prevCountsRef.current[nextRow.user_id] !== nextRow.total_clicks)
      .map((row) => row.user_id);

    setRows(nextRows);
    prevCountsRef.current = Object.fromEntries(nextRows.map((row) => [row.user_id, row.total_clicks]));

    if (changed.length === 0) return;
    setPulseByUserId((prev) => ({ ...prev, ...Object.fromEntries(changed.map((id) => [id, true])) }));
    const timeoutId = window.setTimeout(() => {
      setPulseByUserId((prev) => {
        const next = { ...prev };
        changed.forEach((id) => delete next[id]);
        return next;
      });
    }, 700);
    timeoutIdsRef.current.push(timeoutId);
  }, [city, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTopTen();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchTopTen]);

  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard:${city}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "clicks" }, () => {
        void fetchTopTen();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "clicks" }, () => {
        void fetchTopTen();
      })
      .subscribe();

    return () => {
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutIdsRef.current = [];
      void supabase.removeChannel(channel);
    };
  }, [city, fetchTopTen, supabase]);

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
        {rows.length === 0 && (
          <div className="px-8 py-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No scores yet. Be the first.
            </p>
          </div>
        )}
        {rows.map((row, index) => {
          const isCurrentUser = row.user_id === currentUserId;
          const isPulsing = pulseByUserId[row.user_id] === true;

          return (
            <div
              key={row.user_id}
              className={`flex items-center px-8 py-3 border-t border-border relative transition-transform duration-700 ${
                isCurrentUser ? "bg-primary/5" : ""
              } ${isPulsing ? "scale-[1.012]" : "scale-100"}`}
            >
              {isCurrentUser && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />
              )}
              <span
                className={`font-mono text-xs w-8 ${
                  isCurrentUser ? "text-primary" : "text-muted-foreground/40"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`font-mono text-xs flex-1 ${
                  isCurrentUser ? "text-foreground" : "text-foreground/70"
                }`}
              >
                {row.display_name ?? "Anonymous"}
              </span>
              <span
                className={`font-mono text-xs tabular-nums ${
                  isCurrentUser ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {row.total_clicks.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
