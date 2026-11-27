export const ROWS = [4, 5, 5, 5, 4] as const;
export const NORMAL_MULTIPLIERS = [1, 2, 3, 5] as const;
export const FREE_MULTIPLIERS = [2, 4, 6, 10] as const;
export const MAX_CASCADE_ROUNDS = 100;

export type SymbolId =
  | "zhong" | "fa" | "blueFrame" | "wan8" | "fiveDots"
  | "bambooRed" | "threeDots" | "twoDots" | "singleDots"
  | "wild" | "treasure";
export type Tile = { id: string; symbol: SymbolId; gold: boolean };
export type ReelGrid = Tile[][];
export type PayoutTable = { 3: number; 4: number; 5: number };
export type PayingSymbol = Exclude<SymbolId, "treasure">;

export const PAYTABLE: Record<PayingSymbol, PayoutTable> = {
  wild:       { 3: 10, 4: 25, 5: 50 },
  zhong:      { 3: 8,  4: 20, 5: 40 },
  fa:         { 3: 6,  4: 15, 5: 30 },
  blueFrame:  { 3: 6,  4: 15, 5: 30 },
  wan8:       { 3: 5,  4: 10, 5: 15 },
  fiveDots:   { 3: 3,  4: 5,  5: 12 },
  bambooRed:  { 3: 3,  4: 5,  5: 12 },
  threeDots:  { 3: 2,  4: 4,  5: 10 },
  twoDots:    { 3: 1,  4: 3,  5: 6 },
  singleDots: { 3: 1,  4: 3,  5: 6 },
};

export type WinLine = {
  symbol: PayingSymbol; reelCount: 3 | 4 | 5; ways: number;
  positions: string[]; tableValue: number; amount: number;
};
export type WaysResult = { wins: WinLine[]; total: number; winningPositions: Set<string> };
export type CascadeStep = {
  grid: ReelGrid; result: WaysResult; multiplier: number; amount: number; nextGrid: ReelGrid;
};
export type CascadeSequence = {
  steps: CascadeStep[]; finalGrid: ReelGrid; total: number; stoppedBySafetyLimit: boolean;
};

const PAYING_SYMBOLS = Object.keys(PAYTABLE) as PayingSymbol[];
const REGULAR_SYMBOLS: SymbolId[] = [
  "fa", "zhong", "blueFrame", "wan8", "fiveDots",
  "bambooRed", "threeDots", "twoDots", "singleDots",
];
let tileSequence = 0;

export function isGoldEligible(symbol: SymbolId, reelIndex: number): boolean {
  return reelIndex >= 1 && reelIndex <= 3 && symbol !== "wild" && symbol !== "treasure";
}

export function createTile(
  reelIndex: number, random: () => number = Math.random, freeSpin = false,
): Tile {
  const roll = random();
  let symbol: SymbolId;
  if (roll < 0.025) symbol = "treasure";
  else if (roll < 0.055) symbol = "wild";
  else symbol = REGULAR_SYMBOLS[Math.floor(random() * REGULAR_SYMBOLS.length)];

  const eligible = isGoldEligible(symbol, reelIndex);
  const gold = eligible && (freeSpin && reelIndex === 2 ? true : random() < 0.14);
  return { id: String(++tileSequence), symbol, gold };
}

export function createReel(
  reelIndex: number, random: () => number = Math.random, freeSpin = false,
): Tile[] {
  return Array.from({ length: ROWS[reelIndex] }, () => createTile(reelIndex, random, freeSpin));
}

export function createGrid(random: () => number = Math.random, freeSpin = false): ReelGrid {
  return ROWS.map((_, reelIndex) => createReel(reelIndex, random, freeSpin));
}

export function isValidGrid(grid: ReelGrid): boolean {
  return grid.length === 5 && grid.every((reel, index) => reel.length === ROWS[index]);
}

export function countTreasureSymbols(grid: ReelGrid): number {
  return grid.flat().filter((tile) => tile.symbol === "treasure").length;
}

export function freeSpinsAwarded(scatterCount: number): number {
  return scatterCount >= 3 ? 10 + (scatterCount - 3) * 2 : 0;
}

export function getMultiplier(isFreeMode: boolean, cascadeIndex: number): number {
  const sequence = isFreeMode ? FREE_MULTIPLIERS : NORMAL_MULTIPLIERS;
  const index = Math.max(0, Math.min(Math.floor(cascadeIndex), sequence.length - 1));
  return sequence[index];
}

export function evaluateWays(grid: ReelGrid, bet: number): WaysResult {
  const wins: WinLine[] = [];
  const winningPositions = new Set<string>();
  let total = 0;
  if (!isValidGrid(grid) || !Number.isFinite(bet) || bet < 0) {
    return { wins, total: 0, winningPositions };
  }

  for (const symbol of PAYING_SYMBOLS) {
    const matches = grid.map((reel, reelIndex) =>
      reel
        .map((tile, rowIndex) => ({ tile, key: \`\${reelIndex}-\${rowIndex}\` }))
        .filter(({ tile }) => symbol === "wild"
          ? tile.symbol === "wild"
          : tile.symbol === symbol || tile.symbol === "wild")
    );

    let reelCount = 0;
    while (reelCount < 5 && matches[reelCount].length > 0) reelCount++;
    if (reelCount < 3) continue;

    const count = reelCount as 3 | 4 | 5;
    let ways = 1;
    for (let reelIndex = 0; reelIndex < reelCount; reelIndex++) {
      ways *= matches[reelIndex].length;
    }

    const tableValue = PAYTABLE[symbol][count];
    const amount = Number((ways * (tableValue / 100) * bet).toFixed(4));
    const positions = matches.slice(0, reelCount).flat().map(({ key }) => key);
    positions.forEach((key) => winningPositions.add(key));
    wins.push({ symbol, reelCount: count, ways, positions, tableValue, amount });
    total += amount;
  }

  return { wins, total: Number(total.toFixed(2)), winningPositions };
}

export function resolveWinningReels(
  grid: ReelGrid, winningPositions: Set<string>, makeTile: (reelIndex: number) => Tile,
): ReelGrid {
  return grid.map((reel, reelIndex) => {
    const survivors: Tile[] = [];
    reel.forEach((tile, rowIndex) => {
      const key = \`\${reelIndex}-\${rowIndex}\`;
      if (!winningPositions.has(key)) survivors.push(tile);
      else if (tile.gold && tile.symbol !== "wild" && tile.symbol !== "treasure") {
        survivors.push({ ...tile, id: \`wild-\${tile.id}\`, symbol: "wild", gold: false });
      }
    });
    const missing = reel.length - survivors.length;
    const dropped = Array.from({ length: missing }, () => makeTile(reelIndex));
    return [...dropped, ...survivors];
  });
}

export function calculateCascadeSequence(
  initialGrid: ReelGrid, bet: number, isFreeSpin: boolean,
  makeTile: (reelIndex: number) => Tile, maxRounds = MAX_CASCADE_ROUNDS,
): CascadeSequence {
  let current = initialGrid;
  let total = 0;
  const steps: CascadeStep[] = [];

  while (steps.length < maxRounds) {
    const result = evaluateWays(current, bet);
    if (result.wins.length === 0 || result.winningPositions.size === 0) break;
    const multiplier = getMultiplier(isFreeSpin, steps.length);
    const amount = Number((result.total * multiplier).toFixed(2));
    total = Number((total + amount).toFixed(2));
    const nextGrid = resolveWinningReels(current, result.winningPositions, makeTile);
    steps.push({ grid: current, result, multiplier, amount, nextGrid });
    current = nextGrid;
  }

  const stoppedBySafetyLimit = steps.length === maxRounds &&
    evaluateWays(current, bet).winningPositions.size > 0;
  return { steps, finalGrid: current, total, stoppedBySafetyLimit };
}
