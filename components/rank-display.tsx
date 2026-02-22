"use client"

interface RankDisplayProps {
  rank: number | null
  clicksToNextRank: number | null
  nextRankPosition: number | null
  isInTopTen: boolean
}

export function RankDisplay({
  rank,
  clicksToNextRank,
  nextRankPosition,
  isInTopTen,
}: RankDisplayProps) {
  return (
    <div className="border border-border bg-card p-8">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
        Your Rank
      </p>

      {rank !== null ? (
        <>
          <p className="font-mono text-4xl md:text-5xl font-light text-foreground mt-4 leading-none">
            {"#"}
            {rank}
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            {isInTopTen
              ? "You are in the top 10"
              : clicksToNextRank !== null && nextRankPosition !== null
                ? `${clicksToNextRank.toLocaleString()} clicks to climb to #${nextRankPosition}`
                : "Keep clicking"}
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-4xl md:text-5xl font-light text-muted-foreground/30 mt-4 leading-none">
            --
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            Save your score to see your rank
          </p>
        </>
      )}
    </div>
  )
}
