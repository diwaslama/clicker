"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ClickCounter } from "@/components/click-counter"
import { Leaderboard, type LeaderboardEntry } from "@/components/leaderboardNEW"
import { RankDisplay } from "@/components/rank-display"
import { AuthModal } from "@/components/auth-modal"
import { UsernameEditor } from "@/components/username-editor"

const STORAGE_KEYS = {
  clicks: "brisbane-clicks",
  userId: "brisbane-user-id",
  username: "brisbane-username",
  leaderboard: "brisbane-leaderboard",
  saved: "brisbane-saved",
} as const

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: "bot-01", name: "clickmaster", clicks: 14832 },
  { id: "bot-02", name: "brisbanite", clicks: 11204 },
  { id: "bot-03", name: "qld_rapid", clicks: 8765 },
  { id: "bot-04", name: "southbank", clicks: 6321 },
  { id: "bot-05", name: "river_city", clicks: 4890 },
  { id: "bot-06", name: "fortitude", clicks: 3412 },
  { id: "bot-07", name: "valley_clkr", clicks: 2105 },
  { id: "bot-08", name: "gabba_fan", clicks: 1567 },
  { id: "bot-09", name: "mtcootha", clicks: 899 },
  { id: "bot-10", name: "newstead", clicks: 412 },
]

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable
  }
}

export function BrisbaneClicker() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [clicks, setClicks] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState("anonymous")
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD)
  const [hasSaved, setHasSaved] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Hydrate from localStorage
  useEffect(() => {
    const storedClicks = loadFromStorage<number>(STORAGE_KEYS.clicks, 0)
    const storedUserId = loadFromStorage<string | null>(
      STORAGE_KEYS.userId,
      null
    )
    const storedUsername = loadFromStorage<string>(
      STORAGE_KEYS.username,
      "anonymous"
    )
    const storedLeaderboard = loadFromStorage<LeaderboardEntry[]>(
      STORAGE_KEYS.leaderboard,
      INITIAL_LEADERBOARD
    )
    const storedSaved = loadFromStorage<boolean>(STORAGE_KEYS.saved, false)

    setClicks(storedClicks)
    setUserId(storedUserId)
    setUsername(storedUsername)
    setLeaderboard(storedLeaderboard)
    setHasSaved(storedSaved)
    setIsHydrated(true)
  }, [])

  // Persist clicks
  useEffect(() => {
    if (!isHydrated) return
    saveToStorage(STORAGE_KEYS.clicks, clicks)
  }, [clicks, isHydrated])

  // Sorted top 10
  const top10 = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.clicks - a.clicks).slice(0, 10)
  }, [leaderboard])

  // Current user rank info
  const rankInfo = useMemo(() => {
    if (!userId) return { rank: null, clicksToNext: null, nextRank: null, isTopTen: false }

    const sorted = [...leaderboard].sort((a, b) => b.clicks - a.clicks)
    const userIndex = sorted.findIndex((e) => e.id === userId)

    if (userIndex === -1)
      return { rank: null, clicksToNext: null, nextRank: null, isTopTen: false }

    const rank = userIndex + 1
    const isTopTen = rank <= 10

    if (rank === 1) {
      return { rank, clicksToNext: null, nextRank: null, isTopTen }
    }

    const above = sorted[userIndex - 1]
    const clicksToNext = above.clicks - sorted[userIndex].clicks + 1

    return { rank, clicksToNext, nextRank: rank - 1, isTopTen }
  }, [leaderboard, userId])

  const handleClick = useCallback(() => {
    setClicks((prev) => {
      const next = prev + 1

      // Update leaderboard entry if user is saved
      if (userId) {
        setLeaderboard((prevBoard) => {
          const updated = prevBoard.map((entry) =>
            entry.id === userId ? { ...entry, clicks: next } : entry
          )
          saveToStorage(STORAGE_KEYS.leaderboard, updated)
          return updated
        })
      }

      return next
    })
  }, [userId])

  const handleReset = useCallback(() => {
    setClicks(0)
    saveToStorage(STORAGE_KEYS.clicks, 0)

    if (userId) {
      setLeaderboard((prevBoard) => {
        const updated = prevBoard.map((entry) =>
          entry.id === userId ? { ...entry, clicks: 0 } : entry
        )
        saveToStorage(STORAGE_KEYS.leaderboard, updated)
        return updated
      })
    }
  }, [userId])

  const handleSaveScore = useCallback(
    (email: string, _password: string) => {
      if (!email.includes("@")) {
        setAuthError("Enter a valid email")
        return
      }

      const newId = generateId()
      const newEntry: LeaderboardEntry = {
        id: newId,
        name: username,
        clicks,
      }

      setUserId(newId)
      setHasSaved(true)
      setShowAuthModal(false)
      setAuthError(null)

      const updated = [...leaderboard, newEntry]
      setLeaderboard(updated)

      saveToStorage(STORAGE_KEYS.userId, newId)
      saveToStorage(STORAGE_KEYS.saved, true)
      saveToStorage(STORAGE_KEYS.leaderboard, updated)
    },
    [clicks, username, leaderboard]
  )

  const handleUsernameChange = useCallback(
    (newName: string) => {
      setUsername(newName)
      saveToStorage(STORAGE_KEYS.username, newName)

      if (userId) {
        setLeaderboard((prevBoard) => {
          const updated = prevBoard.map((entry) =>
            entry.id === userId ? { ...entry, name: newName } : entry
          )
          saveToStorage(STORAGE_KEYS.leaderboard, updated)
          return updated
        })
      }
    },
    [userId]
  )

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.3em]">
          Loading
        </p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background relative">
      {/* Subtle radial gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {hasSaved && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Set Name
                </span>
                <UsernameEditor
                  username={username}
                  onSave={handleUsernameChange}
                />
              </>
            )}
          </div>
          {!hasSaved && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
            >
              Save Score
            </button>
          )}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <ClickCounter
              count={clicks}
              username={username}
              onClick={handleClick}
              onReset={handleReset}
            />
            <RankDisplay
              rank={rankInfo.rank}
              clicksToNextRank={rankInfo.clicksToNext}
              nextRankPosition={rankInfo.nextRank}
              isInTopTen={rankInfo.isTopTen}
            />
          </div>

          {/* Right column */}
          <Leaderboard entries={top10} currentUserId={userId} />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          setAuthError(null)
        }}
        onSave={handleSaveScore}
        error={authError}
      />
    </main>
  )
}
