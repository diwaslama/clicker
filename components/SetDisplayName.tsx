"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface SetDisplayNameProps {
  userId: string | null;
  displayName: string | null;
  onDisplayNameChange: (displayName: string) => void;
}

export default function SetDisplayName({
  userId,
  displayName,
  onDisplayNameChange,
}: SetDisplayNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentName = displayName ?? "Anonymous";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEdit = () => {
    setDraftName(currentName);
    setError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftName("");
    setError(null);
    setIsEditing(false);
  };

  const submit = async () => {
    if (!userId) {
      setError("User session not found.");
      return;
    }

    const trimmed = draftName.trim();
    if (trimmed.length < 1) {
      setError("Name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/session/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, displayName: trimmed }),
    });

    if (response.status === 409) {
      setError("That name is already taken");
      setIsLoading(false);
      return;
    }

    if (!response.ok) {
      setError("Could not update name.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { ok: true; displayName: string };
    onDisplayNameChange(data.displayName);
    localStorage.setItem("anon_display_name", data.displayName);
    setIsLoading(false);
    setIsEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none underline underline-offset-4 decoration-border"
      >
        {currentName}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="display-name-input" className="sr-only">
          Set display name
        </label>
        <input
          ref={inputRef}
          id="display-name-input"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={20}
          className="bg-transparent border border-border px-3 py-1 font-mono text-xs text-foreground outline-none focus:border-primary transition-colors w-36"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isLoading}
          className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-[4px] hover:brightness-110 active:brightness-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
