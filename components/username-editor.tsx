"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UsernameEditorProps {
  username: string
  onSave: (name: string) => void
}

export function UsernameEditor({ username, onSave }: UsernameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(username)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== username) {
      onSave(trimmed)
    } else {
      setValue(username)
    }
    setIsEditing(false)
  }, [value, username, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      } else if (e.key === "Escape") {
        setValue(username)
        setIsEditing(false)
      }
    },
    [handleSubmit, username]
  )

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="username-input" className="sr-only">
          Set username
        </label>
        <input
          ref={inputRef}
          id="username-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          maxLength={20}
          className="bg-transparent border border-border px-3 py-1 font-mono text-xs text-foreground outline-none focus:border-primary transition-colors w-36"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none underline underline-offset-4 decoration-border"
    >
      {username}
    </button>
  )
}
