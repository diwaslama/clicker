"use client"

interface ClickCounterProps {
  count: number
  username: string
  onClick: () => void
  onReset: () => void
}

export function ClickCounter({
  count,
  username,
  onClick,
  onReset,
}: ClickCounterProps) {
  return (
    <div className="flex flex-col items-center justify-between border border-border bg-card p-8 md:p-12 min-h-[400px]">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
        Brisbane Clicker
      </p>

      <div className="flex flex-col items-center gap-3">
        <span className="font-mono text-7xl md:text-8xl lg:text-9xl font-light text-foreground tabular-nums leading-none">
          {count.toLocaleString()}
        </span>
        <p className="font-mono text-xs text-muted-foreground">
          {"Playing as "}
          {username}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={onClick}
          className="w-full bg-primary text-primary-foreground font-mono text-sm uppercase tracking-[0.2em] py-4 rounded-[4px] hover:brightness-110 active:brightness-90 transition-all cursor-pointer"
        >
          Click
        </button>
        <button
          onClick={onReset}
          className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
