"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./Leaderboard.module.css";

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
    <section className={styles.panel}>
      <h2 className={styles.title}>🏆 Top 10 Brisbane</h2>
      <ol className={styles.list}>
        {rows.map((row, index) => (
          <li
            key={row.user_id}
            className={`${styles.row} ${row.user_id === currentUserId ? styles.currentUser : ""} ${pulseByUserId[row.user_id] ? styles.pulse : ""}`}
          >
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.name}>{row.display_name ?? "Anonymous"}</span>
            <span className={styles.clicks}>{row.total_clicks.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
