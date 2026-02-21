"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CHANNEL_NAME = "clicker-sync";
const STORAGE_KEY = "clickerCount";

type SyncMessage =
  | { type: "update"; value: number }
  | { type: "reset" };

export function useSyncCounter() {
  const [count, setCount] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initial load from localStorage (persists on refresh)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        setCount(parsed);
      }
    }
  }, []);

  // Broadcast channel: listen for real-time updates from other tabs
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;
      if (!message || typeof message !== "object") return;

      if (message.type === "reset") {
        setCount(0);
        localStorage.removeItem(STORAGE_KEY);
      } else if (message.type === "update" && typeof message.value === "number") {
        setCount(message.value);
        localStorage.setItem(STORAGE_KEY, String(message.value));
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((message: SyncMessage) => {
    if (typeof BroadcastChannel !== "undefined" && channelRef.current) {
      channelRef.current.postMessage(message);
    }
  }, []);

  const updateCount = useCallback(
    (newValue: number) => {
      setCount(newValue);
      localStorage.setItem(STORAGE_KEY, String(newValue));
      broadcast({ type: "update", value: newValue });
    },
    [broadcast]
  );

  const reset = useCallback(() => {
    setCount(0);
    localStorage.removeItem(STORAGE_KEY);
    broadcast({ type: "reset" });
  }, [broadcast]);

  return { count, updateCount, reset };
}
