import { describe, expect, it } from "vitest";
import {
  countTreasureSymbols, freeSpinsAwarded, getMultiplier, isGoldEligible,
  evaluateWays, resolveWinningReels, type ReelGrid, type Tile
} from "../src/game/engine";

const tile = (symbol: Tile["symbol"], id: string, gold = false): Tile => ({ symbol, id, gold });
const grid = (symbols: Tile["symbol"][][]): ReelGrid => symbols.map((reel, c) => reel.map((s, r) => tile(s, `${c}-${r}`)));

describe("mahjong game engine", () => {
  it("counts treasure symbols and awards free spins at three or more", () => {
    const board = grid([["treasure"], ["zhong"], ["treasure"], ["treasure"], ["fa"]]);
    expect(countTreasureSymbols(board)).toBe(3);
    expect(freeSpinsAwarded(2)).toBe(0);
    expect(freeSpinsAwarded(3)).toBe(10);
    expect(freeSpinsAwarded(5)).toBe(14);
  });

  it("limits gold tiles to the middle three reels", () => {
    expect(isGoldEligible("fa", 0)).toBe(false);
    expect(isGoldEligible("fa", 1)).toBe(true);
    expect(isGoldEligible("fa", 3)).toBe(true);
    expect(isGoldEligible("fa", 4)).toBe(false);
    expect(isGoldEligible("wild", 2)).toBe(false);
  });

  it("uses the correct normal and free-spin multiplier sequence", () => {
    expect([0, 1, 2, 3, 9].map(n => getMultiplier(false, n))).toEqual([1, 2, 3, 5, 5]);
    expect([0, 1, 2, 3, 9].map(n => getMultiplier(true, n))).toEqual([2, 4, 6, 10, 10]);
  });

  it("calculates a three-reel win using all ways and the bet", () => {
    const board = grid([
      ["fa", "zhong"], ["fa", "fa"], ["fa", "zhong"], ["zhong"], ["zhong"]
    ]);
    const result = evaluateWays(board, 1);
    const win = result.wins.find(w => w.symbol === "fa");
    expect(win?.ways).toBe(2);
    expect(win?.reelCount).toBe(3);
    expect(result.total).toBeGreaterThan(0);
    expect(result.winningPositions.has("0-0")).toBe(true);
  });

  it("lets wild substitute for a paying symbol", () => {
    const board = grid([["fa"], ["wild"], ["fa"], ["zhong"], ["zhong"]]);
    const result = evaluateWays(board, 1);
    expect(result.wins.some(w => w.symbol === "fa" && w.reelCount === 3)).toBe(true);
  });

  it("converts winning gold tiles into wilds and removes ordinary winners", () => {
    const board = grid([["fa", "zhong"], ["fa", "zhong"], ["fa", "zhong"], ["zhong"], ["zhong"]]);
    board[1][0].gold = true;
    const positions = new Set(["0-0", "1-0", "2-0"]);
    let id = 0;
    const next = resolveWinningReels(board, positions, () => tile("zhong", `new-${++id}`));
    expect(next[1].some(t => t.symbol === "wild" && t.id === "wild-1-0")).toBe(true);
    expect(next.every(reel => reel.length === board[0].length)).toBe(true);
    expect(next[0].some(t => t.id === "0-0")).toBe(false);
  });
});
