"use client";

import { KeyboardEvent, useState } from "react";
import styles from "./SetDisplayName.module.css";

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

  const currentName = displayName ?? "Anonymous";

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
      setError("That name is already taken, try another");
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
      <div className={styles.inline}>
        <span className={styles.currentName}>{currentName}</span>
        <button type="button" className={styles.iconButton} onClick={startEdit} aria-label="Edit name">
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      <div className={styles.controls}>
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={20}
          className={styles.input}
          autoFocus
        />
        <button type="button" className={styles.confirmButton} onClick={() => void submit()} disabled={isLoading}>
          ✅
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
