import { describe, expect, it } from "vitest";
import {
  ROWS, PAYTABLE, createGrid, createTile, countTreasureSymbols, freeSpinsAwarded,
  getMultiplier, isGoldEligible, evaluateWays, resolveWinningReels,
  calculateCascadeSequence, isValidGrid, type ReelGrid, type SymbolId, type Tile
} from "../src/game/engine";

const make = (symbol:SymbolId,id:string,gold=false):Tile => ({symbol,id,gold});
function fullGrid(firstRows:SymbolId[], filler:SymbolId[]=["treasure","treasure","treasure","treasure","treasure"]):ReelGrid {
  return ROWS.map((count,col)=>Array.from({length:count},(_,row)=>
    make(row===0?firstRows[col]:filler[col],String(col)+"-"+String(row))
  ));
}
function seeded(seed:number){
  let state=seed>>>0;
  return ()=>{state=(state*1664525+1013904223)>>>0;return state/0x100000000;};
}

describe("Mahjong Ways 2 rules engine",()=>{
  it("uses the 4-5-5-5-4 board and 2,000 ways",()=>{
    expect(ROWS).toEqual([4,5,5,5,4]);
    expect(ROWS.reduce((a,b)=>a*b,1)).toBe(2000);
  });

  it("awards 10 free spins for 3 scatters and +2 per additional scatter",()=>{
    const board=fullGrid(["treasure","zhong","treasure","treasure","fa"],["fa","zhong","blueFrame","wan8","fiveDots"]);
    expect(countTreasureSymbols(board)).toBe(3);
    expect(freeSpinsAwarded(2)).toBe(0);
    expect(freeSpinsAwarded(3)).toBe(10);
    expect(freeSpinsAwarded(4)).toBe(12);
    expect(freeSpinsAwarded(5)).toBe(14);
  });

  it("keeps gold symbols on reels 2, 3 and 4 only",()=>{
    expect(isGoldEligible("fa",0)).toBe(false);
    expect(isGoldEligible("fa",1)).toBe(true);
    expect(isGoldEligible("fa",2)).toBe(true);
    expect(isGoldEligible("fa",3)).toBe(true);
    expect(isGoldEligible("fa",4)).toBe(false);
    expect(isGoldEligible("wild",2)).toBe(false);
    expect(isGoldEligible("treasure",2)).toBe(false);
  });

  it("uses normal and free-spin multiplier ladders",()=>{
    expect([0,1,2,3,9].map(n=>getMultiplier(false,n))).toEqual([1,2,3,5,5]);
    expect([0,1,2,3,9].map(n=>getMultiplier(true,n))).toEqual([2,4,6,10,10]);
  });

  it("contains the main symbol payout rows",()=>{
    expect(PAYTABLE.wild).toEqual({3:10,4:25,5:50});
    expect(PAYTABLE.zhong).toEqual({3:8,4:20,5:40});
    expect(PAYTABLE.fa).toEqual({3:10,4:25,5:50});
  });

  it("counts all adjacent left-to-right ways, not scattered matches",()=>{
    const board=ROWS.map((count,col)=>{
      const symbols=[
        ["fa","zhong","fa","zhong"],
        ["fa","zhong","zhong","fa","zhong"],
        ["fa","zhong","fa","zhong","zhong"],
        ["zhong","zhong","zhong","zhong","zhong"],
        ["zhong","zhong","zhong","zhong"]
      ][col];
      return Array.from({length:count},(_,row)=>make(symbols[row],String(col)+"-"+String(row)));
    });
    const result=evaluateWays(board,1);
    const fa=result.wins.find(w=>w.symbol==="fa");
    expect(fa?.reelCount).toBe(3);
    expect(fa?.ways).toBe(8);
    expect(fa?.positions).not.toContain("3-0");
  });

  it("allows Wild to substitute for ordinary paying symbols",()=>{
    const board=fullGrid(["fa","wild","fa","zhong","fa"]);
    expect(evaluateWays(board,1).wins.some(w=>w.symbol==="fa"&&w.reelCount>=3)).toBe(true);
  });

  it("does not allow Wild to substitute for Scatter",()=>{
    const board=fullGrid(
      ["treasure","wild","treasure","zhong","fa"],
      ["fa","zhong","blueFrame","wan8","fiveDots"]
    );
    expect(countTreasureSymbols(board)).toBe(2);
    expect(evaluateWays(board,1).winningPositions.size).toBe(0);
  });

  it("pays a direct Wild combination according to its own payout row",()=>{
    const board=fullGrid(["wild","wild","wild","fa","zhong"]);
    expect(evaluateWays(board,1).wins.find(w=>w.symbol==="wild")?.tableValue).toBe(10);
  });

  it("converts winning gold tiles into Wilds and removes ordinary winners",()=>{
    const board=fullGrid(["fa","fa","fa","zhong","zhong"]);
    board[1][0].gold=true;
    const next=resolveWinningReels(board,new Set(["0-0","1-0","2-0"]),()=>make("zhong","new"));
    expect(next[1].some(t=>t.symbol==="wild"&&t.id==="wild-1-0")).toBe(true);
    expect(next.every((reel,index)=>reel.length===board[index].length)).toBe(true);
    expect(next[0].some(t=>t.id==="0-0")).toBe(false);
  });

  it("turns every eligible symbol on reel 3 gold during Free Spins",()=>{
    const board=createGrid(seeded(7721),true);
    expect(board[2].every(t=>t.symbol==="wild"||t.symbol==="treasure"||t.gold)).toBe(true);
    expect(board[0].every(t=>!t.gold)).toBe(true);
    expect(board[4].every(t=>!t.gold)).toBe(true);
  });

  it("rejects malformed reel counts rather than paying from a broken board",()=>{
    expect(isValidGrid([[],[],[],[],[]])).toBe(false);
    expect(evaluateWays([[],[],[],[],[]],1).total).toBe(0);
  });

  it.each(Array.from({length:20},(_,i)=>i+1))(
    "runs deterministic gameplay verification %i/20",
    (round)=>{
      const random=seeded(0x20260000+round);
      const board=createGrid(random,false);
      expect(board.map(reel=>reel.length)).toEqual([...ROWS]);
      for(let col=0;col<5;col++){
        for(const tile of board[col]){
          if(col===0||col===4)expect(tile.gold).toBe(false);
          if(tile.symbol==="wild"||tile.symbol==="treasure")expect(tile.gold).toBe(false);
        }
      }

      board[0][0]=make("fa","forced-"+round+"-0");
      board[1][0]=make("fa","forced-"+round+"-1",true);
      board[2][0]=make("fa","forced-"+round+"-2",true);
      const first=evaluateWays(board,0.2);
      expect(first.wins.some(w=>w.symbol==="fa"&&w.reelCount>=3)).toBe(true);

      const sequence=calculateCascadeSequence(
        board,0.2,false,(reelIndex)=>createTile(reelIndex,random,false)
      );
      expect(sequence.steps.length).toBeGreaterThan(0);
      expect(sequence.steps.length).toBeLessThanOrEqual(100);
      expect(sequence.finalGrid.map(reel=>reel.length)).toEqual([...ROWS]);
      expect(Number.isFinite(sequence.total)).toBe(true);
      for(const step of sequence.steps){
        expect(step.multiplier).toBeGreaterThanOrEqual(1);
        expect(step.result.winningPositions.size).toBeGreaterThan(0);
        expect(step.nextGrid.map(reel=>reel.length)).toEqual([...ROWS]);
      }
      expect(sequence.stoppedBySafetyLimit).toBe(false);
    }
  );
});
