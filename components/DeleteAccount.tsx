"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DeleteAccountProps {
  userId: string | null;
}

export default function DeleteAccount({ userId }: DeleteAccountProps) {
  const supabase = useMemo(() => createClient(), []);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    if (userId === null || userId.startsWith("local-")) {
      return;
    }

    const storedUserId = localStorage.getItem("anon_user_id");
    if (storedUserId === null || storedUserId.trim().length === 0 || storedUserId.startsWith("local-")) {
      setError("Failed to delete account. Please try again.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/session/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: storedUserId }),
      });

      if (!response.ok) {
        setError("Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      localStorage.removeItem("anon_user_id");
      localStorage.removeItem("anon_display_name");
      localStorage.removeItem("is_anonymous");
      localStorage.removeItem("clickerCount");

      await supabase.auth.signOut();
      window.location.reload();
    } catch {
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }, [supabase, userId]);

  if (userId === null || userId.startsWith("local-")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowModal(true);
        }}
        className="group bg-transparent border-none p-1.5 cursor-pointer transition-colors duration-200"
        aria-label="Delete account"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#666] group-hover:text-[#ef4444] transition-colors duration-200"
        >
          <path
            d="M2.5 4.5H13.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
          <path
            d="M6 2.5H10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
          <path
            d="M3.5 4.5L4.25 13.5H11.75L12.5 4.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
          <path
            d="M6.5 7V11"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
          <path
            d="M9.5 7V11"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => {
            if (!isDeleting) {
              setShowModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm account deletion"
        >
          <div
            className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.08)] w-full max-w-xs mx-4 p-6"
            style={{ borderRadius: "4px" }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-mono text-sm text-[#e5e5e5] mb-2">
              {"Delete everything?"}
            </p>
            <p className="font-mono text-[11px] leading-relaxed text-[#666] mb-6">
              {"This removes your account, score and all data permanently."}
            </p>

            {error && (
              <p className="font-mono text-[11px] leading-relaxed text-[#ef4444] mb-4">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-transparent border-none font-mono text-[11px] uppercase tracking-[0.15em] text-[#666] hover:text-[#e5e5e5] transition-colors duration-200 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="flex-1 bg-[#ef4444] text-[#fff] font-mono text-[11px] uppercase tracking-[0.15em] py-2.5 border-none cursor-pointer hover:bg-[#dc2626] active:bg-[#b91c1c] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ borderRadius: "4px" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
