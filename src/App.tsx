import { useRef, useState } from "react";
import { Volume2, VolumeX, Zap, Play, Pause, RotateCcw, Plus, Minus, Sparkles } from "lucide-react";
import {
  type Tile, type SymbolId, type ReelGrid, PAYTABLE, NORMAL_MULTIPLIERS,
  FREE_MULTIPLIERS, countTreasureSymbols, freeSpinsAwarded, getMultiplier,
  isGoldEligible, evaluateWays, resolveWinningReels
} from "./game/engine";

const ROWS = [4,5,5,5,4];
const SYMBOLS: SymbolId[] = ["fa","zhong","blueFrame","wan8","fiveDots","bambooRed","threeDots","twoDots","singleDots"];
const LABELS: Record<SymbolId,string> = {
 fa:"發",zhong:"中",blueFrame:"白",wan8:"八萬",fiveDots:"五筒",bambooRed:"三条",
 threeDots:"三筒",twoDots:"二筒",singleDots:"二条",wild:"百搭",treasure:"夺宝"
};
const COLORS: Record<SymbolId,string> = {
 fa:"#16834a",zhong:"#c52b32",blueFrame:"#2776b9",wan8:"#292929",fiveDots:"#c52b32",
 bambooRed:"#18834b",threeDots:"#2875b8",twoDots:"#272727",singleDots:"#16834a",wild:"#a56a12",treasure:"#8046a0"
};
let seq=0;
function makeTile(reel:number):Tile {
 const roll=Math.random();
 const symbol:SymbolId=roll<.025?"treasure":SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
 return {id:String(++seq),symbol,gold:isGoldEligible(symbol,reel)&&Math.random()<.14};
}
function makeGrid():ReelGrid{return ROWS.map((n,c)=>Array.from({length:n},()=>makeTile(c)));}
const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms));

export default function App(){
 const [grid,setGrid]=useState<ReelGrid>(()=>makeGrid());
 const [balance,setBalance]=useState(10000),[betLevel,setBetLevel]=useState(1),[win,setWin]=useState(0);
 const [spinning,setSpinning]=useState(false),[turbo,setTurbo]=useState(false),[sound,setSound]=useState(true);
 const [freeSpins,setFreeSpins]=useState(0),[freeMode,setFreeMode]=useState(false),[combo,setCombo]=useState(0);
 const [highlight,setHighlight]=useState<Set<string>>(new Set()),[tip,setTip]=useState("金色牌中奖后转化为百搭");
 const [panel,setPanel]=useState("");
 const [auto,setAuto]=useState(false);
 const busy=useRef(false);
 const bet=Number((.2*betLevel).toFixed(2));
 const multipliers=freeMode?FREE_MULTIPLIERS:NORMAL_MULTIPLIERS;
 const multiplier=getMultiplier(freeMode,combo);

 function randomize(){setGrid(makeGrid());}
 async function spin(){
  if(busy.current||(!freeMode&&balance<bet))return;
  busy.current=true;setSpinning(true);setHighlight(new Set());setWin(0);setPanel("");
  const isFree=freeMode&&freeSpins>0;
  if(!isFree)setBalance(v=>Number((v-bet).toFixed(2)));
  else setFreeSpins(v=>Math.max(0,v-1));
  setCombo(0);setTip(isFree?"免费旋转中…":"好运连连…");
  // Reel motion preview, then stop as a single round; column stagger is visual only.
  for(let i=0;i<8;i++){randomize();await wait(turbo?55:105);}
  let current=makeGrid();setGrid(current);
  await wait(turbo?100:350);
  let accumulated=0,chain=0,scatter=countTreasureSymbols(current);
  const awarded=freeSpinsAwarded(scatter);
  if(awarded>0){setFreeMode(true);setFreeSpins(v=>v+awarded);setTip(`夺宝触发：增加 ${awarded} 次免费旋转`);}
  while(chain<12){
    const result=evaluateWays(current,bet);
    if(!result.winningPositions.size)break;
    const mult=getMultiplier(isFree||awarded>0,chain);
    const amount=Number((result.total*mult).toFixed(2));
    accumulated=Number((accumulated+amount).toFixed(2));
    setWin(accumulated);setBalance(v=>Number((v+amount).toFixed(2)));
    setHighlight(result.winningPositions);
    const best=[...result.wins].sort((a,b)=>b.ways-a.ways)[0];
    setPanel(best?`${LABELS[best.symbol]}  ·  ${best.ways}路  ·  ×${mult}`:"中奖");
    setTip(`连锁中奖 +${amount.toFixed(2)}`);
    await wait(turbo?220:650);
    current=resolveWinningReels(current,result.winningPositions,makeTile);
    setGrid(current);setHighlight(new Set());setPanel("");
    chain++;setCombo(chain);
    await wait(turbo?80:180);
  }
  if(accumulated===0&&awarded===0)setTip(isFree?"本次免费旋转结束":"再试一次好运");
  else if(accumulated>0)setTip(`本轮累计赢分 ¥${accumulated.toFixed(2)}`);
  setSpinning(false);busy.current=false;
  if(isFree&&freeSpins===1&&awarded===0){setFreeMode(false);setTip("免费旋转结束");}
  if(auto)window.setTimeout(()=>{if(!busy.current)void spin();},700);
 }
 const startAuto=()=>setAuto(v=>!v);
 return <main className="game-shell"><div className="game-frame">
  <header className="top-banner"><span className="dragon">♢</span><div><b>麻将胡了2</b><small>2000 路中奖组合</small></div><span className="dragon">♢</span></header>
  <div className="multiplier">{multipliers.map((m,i)=><div className={(!spinning&&i===Math.min(combo,multipliers.length-1))|| (spinning&&i===Math.min(combo,multipliers.length-1))?"active":""} key={m}>×{m}</div>)}</div>
  {freeMode&&<div className="free-tag">免费旋转剩余：{freeSpins}</div>}
  <section className={`reels ${spinning?"spinning":""}`}>{grid.map((reel,c)=><div className="reel" key={c}>{reel.map((tile,r)=>{
    const key=`${c}-${r}`;const isWin=highlight.has(key);
    return <div key={tile.id} className={`tile ${tile.gold?"gold":""} ${tile.symbol==="wild"?"wild":""} ${tile.symbol==="treasure"?"treasure":""} ${isWin?"winning":""}`}><span style={{color:COLORS[tile.symbol]}}>{LABELS[tile.symbol]}</span>{tile.gold&&<i>金</i>}</div>;
  })}</div>)}
  {panel&&<div className="win-panel">{panel}<strong>¥{win.toFixed(2)}</strong></div>}</section>
  <div className="notice">{tip}</div>
  <section className="account-row"><div><small>余额</small><b>¥{balance.toFixed(2)}</b></div><div><small>本轮赢分</small><b>¥{win.toFixed(2)}</b></div><div><small>投注</small><b>¥{bet.toFixed(2)}</b></div></section>
  <section className="controls">
   <button onClick={()=>setTurbo(v=>!v)} className={turbo?"selected":""}><Zap/>加速</button>
   <div className="bet-control"><button disabled={spinning||freeMode} onClick={()=>setBetLevel(v=>Math.max(1,v-1))}><Minus/></button><span>{betLevel}倍</span><button disabled={spinning||freeMode} onClick={()=>setBetLevel(v=>Math.min(20,v+1))}><Plus/></button></div>
   <button className="spin" disabled={spinning} onClick={()=>void spin()}><RotateCcw/></button>
   <button onClick={startAuto} className={auto?"selected":""}>{auto?<Pause/>:<Play/>}自动</button>
   <button onClick={()=>setSound(v=>!v)}>{sound?<Volume2/>:<VolumeX/>}声音</button>
  </section>
  <footer><button onClick={()=>setPanel("赔付表已按规则图录入")}>赔付表</button><button onClick={()=>setPanel("3个夺宝符号触发10次免费旋转，每多1个增加2次")}>游戏规则</button><button onClick={()=>setPanel("中奖组合按从左至右连续3至5列计算")}>中奖说明</button></footer>
 </div></main>;
}
