"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./ClaimAccount.module.css";

const STORAGE_KEY = "anon_user_id";

interface ClaimAccountProps {
  markAsClaimed: () => void;
}

export default function ClaimAccount({ markAsClaimed }: ClaimAccountProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const anonUserId = localStorage.getItem(STORAGE_KEY);
    if (!anonUserId) {
      setErrorMessage("Anonymous session not found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMessage(error.message || "Email already registered");
      setIsLoading(false);
      return;
    }

    const authUserId = data.user?.id;
    if (!authUserId) {
      setErrorMessage("Account created, but user ID was not returned.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/session/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonUserId, authUserId }),
    });

    if (!response.ok) {
      setErrorMessage("Failed to save account claim.");
      setIsLoading(false);
      return;
    }

    markAsClaimed();
    setSuccessMessage("✅ Score saved!");
    setIsLoading(false);

    window.setTimeout(() => {
      setIsOpen(false);
      setEmail("");
      setPassword("");
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 2000);
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setIsOpen(true)}>
        💾 Save your score
      </button>

      {isOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Save your score">
          <div className={styles.modal}>
            <h3 className={styles.title}>Save your score</h3>
            <form className={styles.form} onSubmit={onSubmit}>
              <label className={styles.label}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={styles.input}
                />
              </label>
              <label className={styles.label}>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className={styles.input}
                />
              </label>
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}
              {successMessage && <p className={styles.success}>{successMessage}</p>}
              <div className={styles.actions}>
                <button type="button" onClick={() => setIsOpen(false)} className={styles.secondary}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className={styles.primary}>
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
