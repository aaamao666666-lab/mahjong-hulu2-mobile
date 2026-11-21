export const NORMAL_MULTIPLIERS = [1, 2, 3, 5] as const;
export const FREE_MULTIPLIERS = [2, 4, 6, 10] as const;

export type SymbolId =
  | "zhong" | "fa" | "blueFrame" | "wan8" | "fiveDots"
  | "bambooRed" | "threeDots" | "twoDots" | "singleDots"
  | "wild" | "treasure";

export type Tile = {
  id: string;
  symbol: SymbolId;
  gold: boolean;
};

export type ReelGrid = Tile[][];

/** Values transcribed from the user's supplied payout-table screenshots. */
export const PAYTABLE: Partial<Record<SymbolId, { 3: number; 4: number; 5: number }>> = {
  fa: { 3: 10, 4: 25, 5: 50 },
  zhong: { 3: 8, 4: 20, 5: 40 },
  blueFrame: { 3: 6, 4: 15, 5: 30 },
  wan8: { 3: 5, 4: 10, 5: 15 },
  fiveDots: { 3: 3, 4: 5, 5: 12 },
  bambooRed: { 3: 3, 4: 5, 5: 12 },
  threeDots: { 3: 2, 4: 4, 5: 10 },
  twoDots: { 3: 1, 4: 3, 5: 6 },
  singleDots: { 3: 1, 4: 3, 5: 6 },
};

export type WinLine = {
  symbol: SymbolId;
  reelCount: 3 | 4 | 5;
  ways: number;
  positions: string[];
  tableValue: number;
};

export function countTreasureSymbols(grid: ReelGrid): number {
  return grid.flat().filter((tile) => tile.symbol === "treasure").length;
}

export function freeSpinsAwarded(scatterCount: number): number {
  return scatterCount >= 3 ? 10 + (scatterCount - 3) * 2 : 0;
}

export function isGoldEligible(symbol: SymbolId, reelIndex: number): boolean {
  // Reel indices 1, 2, 3 correspond to the 2nd, 3rd and 4th reels.
  return reelIndex >= 1 && reelIndex <= 3 && symbol !== "wild" && symbol !== "treasure";
}

export function getMultiplier(isFreeMode: boolean, spinIndex: number): number {
  const sequence = isFreeMode ? FREE_MULTIPLIERS : NORMAL_MULTIPLIERS;
  return sequence[Math.min(Math.max(0, spinIndex), sequence.length - 1)];
}

/**
 * All ways are counted left-to-right from reel 1. Wild substitutes for
 * ordinary paying symbols, but never for the treasure trigger.
 * A symbol pays only for its longest consecutive prefix (3, 4 or 5 reels).
 */
export function evaluateWays(grid: ReelGrid, bet: number): {
  wins: WinLine[];
  total: number;
  winningPositions: Set<string>;
} {
  const wins: WinLine[] = [];
  const winningPositions = new Set<string>();
  let total = 0;
  const payingSymbols = Object.keys(PAYTABLE) as SymbolId[];

  for (const symbol of payingSymbols) {
    const matches = grid.map((reel, reelIndex) =>
      reel.map((tile, rowIndex) => ({ tile, key: `${reelIndex}-${rowIndex}` }))
        .filter(({ tile }) => tile.symbol === symbol || tile.symbol === "wild")
    );
    if (matches.length < 3 || [0, 1, 2].some((i) => matches[i].length === 0)) continue;

    let reelCount: 3 | 4 | 5 = 3;
    if (matches[3]?.length) reelCount = 4;
    if (reelCount === 4 && matches[4]?.length) reelCount = 5;

    let ways = 1;
    for (let i = 0; i < reelCount; i++) ways *= matches[i].length;
    const tableValue = PAYTABLE[symbol]![reelCount];
    const amount = ways * (tableValue / 100) * bet;
    const positions = matches.slice(0, reelCount).flat().map(({ key }) => key);
    positions.forEach((key) => winningPositions.add(key));
    wins.push({ symbol, reelCount, ways, positions, tableValue });
    total += amount;
  }

  return { wins, total: Number(total.toFixed(2)), winningPositions };
}

/** Winning gold tiles turn into wilds after removal; ordinary winners disappear. */
export function resolveWinningReels(
  grid: ReelGrid,
  winningPositions: Set<string>,
  makeTile: (reelIndex: number) => Tile,
): ReelGrid {
  return grid.map((reel, reelIndex) => {
    const kept: Tile[] = [];
    reel.forEach((tile, rowIndex) => {
      if (!winningPositions.has(`${reelIndex}-${rowIndex}`)) {
        kept.push(tile);
      } else if (tile.gold && tile.symbol !== "wild" && tile.symbol !== "treasure") {
        kept.push({ ...tile, id: `wild-${tile.id}`, symbol: "wild", gold: false });
      }
    });
    const missing = reel.length - kept.length;
    return [...Array.from({ length: missing }, () => makeTile(reelIndex)), ...kept];
  });
}
