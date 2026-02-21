"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "anon_user_id";
const DISPLAY_NAME_KEY = "anon_display_name";
const IS_ANONYMOUS_KEY = "is_anonymous";

interface SessionData {
  userId: string;
  displayName: string;
}

function generateDisplayName(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Clicker #${num}`;
}

function generateFallbackUserId(): string {
  return `local-${crypto.randomUUID()}`;
}

function getStoredSession(): SessionData | null {
  if (typeof window === "undefined") return null;

  const userId = localStorage.getItem(STORAGE_KEY);
  const displayName = localStorage.getItem(DISPLAY_NAME_KEY);

  if (userId && displayName) {
    return { userId, displayName };
  }

  return null;
}

function storeSession(userId: string, displayName: string): void {
  localStorage.setItem(STORAGE_KEY, userId);
  localStorage.setItem(DISPLAY_NAME_KEY, displayName);
  localStorage.setItem(IS_ANONYMOUS_KEY, "true");
}

function getStoredIsAnonymous(): boolean {
  if (typeof window === "undefined") return true;

  const stored = localStorage.getItem(IS_ANONYMOUS_KEY);
  if (stored === "false") return false;
  return true;
}

async function createSession(displayName: string, city: string): Promise<SessionData> {
  const res = await fetch("/api/session/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: displayName, city }),
  });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  const data = (await res.json()) as { id: string; display_name: string | null };
  return {
    userId: data.id,
    displayName: data.display_name ?? displayName,
  };
}

export interface UseAnonymousSessionOptions {
  city: string;
}

export interface UseAnonymousSessionResult {
  userId: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  isLoading: boolean;
  markAsClaimed: () => void;
}

export function useAnonymousSession({ city }: UseAnonymousSessionOptions): UseAnonymousSessionResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();

    if (stored) {
      setUserId(stored.userId);
      setDisplayName(stored.displayName);
      setIsAnonymous(getStoredIsAnonymous());
      setIsLoading(false);
      return;
    }

    const displayNameToUse = generateDisplayName();

    createSession(displayNameToUse, city)
      .then((session) => {
        storeSession(session.userId, session.displayName);
        setUserId(session.userId);
        setDisplayName(session.displayName);
      })
      .catch(() => {
        const fallbackUserId = generateFallbackUserId();
        storeSession(fallbackUserId, displayNameToUse);
        setUserId(fallbackUserId);
        setDisplayName(displayNameToUse);
        setIsAnonymous(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [city]);

  const markAsClaimed = () => {
    localStorage.setItem(IS_ANONYMOUS_KEY, "false");
    setIsAnonymous(false);
  };

  return {
    userId,
    displayName,
    isAnonymous,
    isLoading,
    markAsClaimed,
  };
}
