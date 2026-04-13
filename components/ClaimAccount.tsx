"use client"

import { FormEvent, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const STORAGE_KEY = "anon_user_id"

interface ClaimAccountProps {
  markAsClaimed: () => void
}

export default function ClaimAccount({ markAsClaimed }: ClaimAccountProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const anonUserId = localStorage.getItem(STORAGE_KEY)
    if (!anonUserId) {
      setErrorMessage("Anonymous session not found.")
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setErrorMessage(error.message || "Email already registered")
      setIsLoading(false)
      return
    }

    const authUserId = data.user?.id
    if (!authUserId) {
      setErrorMessage("Account created, but user ID was not returned.")
      setIsLoading(false)
      return
    }

    const response = await fetch("/api/session/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonUserId, authUserId }),
    })

    if (!response.ok) {
      setErrorMessage("Failed to save account claim.")
      setIsLoading(false)
      return
    }

    markAsClaimed()
    setSuccessMessage("Score saved!")
    setIsLoading(false)

    window.setTimeout(() => {
      setIsOpen(false)
      setEmail("")
      setPassword("")
      setSuccessMessage(null)
      setErrorMessage(null)
    }, 2000)
  }

  return (
    <>
      {/* Trigger button — muted, no fill, no border, monospace, small, uppercase */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-transparent border-none font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
      >
        Save Score
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => {
            if (!isLoading) {
              setIsOpen(false)
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Save your score"
        >
          <div
            className="bg-[#0a0a0a] text-[#e5e5e5] border border-[rgba(255,255,255,0.08)] rounded-[4px] w-full max-w-sm mx-4 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-8">
              Save Score
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="claim-email"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#525252]"
                >
                  Email
                </label>
                <input
                  id="claim-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#0f0f0f] border border-[rgba(255,255,255,0.15)] rounded-[4px] px-4 py-3 font-mono text-xs text-[#f5f5f5] caret-[#f5f5f5] placeholder:text-[#737373] outline-none focus:border-[#6366f1] transition-colors duration-200"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="claim-password"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#525252]"
                >
                  Password
                </label>
                <input
                  id="claim-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0f0f0f] border border-[rgba(255,255,255,0.15)] rounded-[4px] px-4 py-3 font-mono text-xs text-[#f5f5f5] caret-[#f5f5f5] placeholder:text-[#737373] outline-none focus:border-[#6366f1] transition-colors duration-200"
                  placeholder="Min 6 characters"
                />
              </div>

              {/* Error message */}
              {errorMessage && (
                <p className="font-mono text-[11px] text-[#ef4444]">
                  {errorMessage}
                </p>
              )}

              {/* Success message */}
              {successMessage && (
                <p className="font-mono text-[11px] text-[#22c55e]">
                  {successMessage}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#6366f1] text-[#fff] font-mono text-xs uppercase tracking-[0.2em] py-3 rounded-[4px] border-none cursor-pointer hover:bg-[#5558e6] active:bg-[#4f46e5] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="bg-transparent border-none font-mono text-[11px] uppercase tracking-[0.15em] text-[#525252] hover:text-foreground transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
