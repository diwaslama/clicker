"use client"

import { useState, useCallback } from "react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (email: string, password: string) => void
  error: string | null
}

export function AuthModal({ isOpen, onClose, onSave, error }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (email.trim() && password.trim()) {
        onSave(email.trim(), password.trim())
      }
    },
    [email, password, onSave]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Save score"
    >
      <div
        className="bg-card border border-border w-full max-w-sm mx-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-8">
          Save Score
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="auth-email"
              className="sr-only"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="auth-password"
              className="sr-only"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-mono text-xs uppercase tracking-[0.2em] py-3 rounded-[4px] hover:brightness-110 active:brightness-90 transition-all cursor-pointer mt-2"
          >
            Save
          </button>

          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
