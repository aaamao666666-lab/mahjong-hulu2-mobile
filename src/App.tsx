import { useRef, useState } from "react";
import { Volume2, VolumeX, Zap, Play, Pause, RotateCcw, Plus, Minus, UserRound, ShieldCheck, CircleDollarSign } from "lucide-react";
import {
  type Tile, type SymbolId, type ReelGrid, NORMAL_MULTIPLIERS,
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


function TileFace({symbol}:{symbol:SymbolId}){
 const dotSets:Record<string,Array<[number,number,string]>>={
  fiveDots:[[28,28,"#248b52"],[72,28,"#6652ad"],[50,50,"#c33b39"],[28,72,"#248b52"],[72,72,"#6652ad"]],
  threeDots:[[50,25,"#6652ad"],[50,50,"#c33b39"],[50,75,"#248b52"]],
  twoDots:[[50,30,"#6652ad"],[50,70,"#248b52"]],
  singleDots:[[50,50,"#248b52"]]
 };
 if(dotSets[symbol]) return <svg className="tile-art dots-art" viewBox="0 0 100 100" aria-hidden="true">{dotSets[symbol].map(([x,y,color],i)=><g key={i}><circle cx={x} cy={y} r="12" fill={color}/><circle cx={x-3} cy={y-3} r="3" fill="#ffffff99"/></g>)}</svg>;
 if(symbol==="bambooRed") return <svg className="tile-art bamboo-art" viewBox="0 0 100 100" aria-hidden="true">{[27,50,73].map((x,i)=><g key={x}><rect x={x-5} y="17" width="10" height="66" rx="5" fill={i===1?"#c33b35":"#21844c"}/><path d={`M${x-5} 34h10 M${x-5} 55h10 M${x-5} 75h10`} stroke="#f4e8ce" strokeWidth="3"/><path d={`M${x} 17q-13 -12 -14 -2q8 8 14 2 M${x} 17q13 -12 14 -2q-8 8 -14 2`} fill="#27864d"/></g>)}</svg>;
 if(symbol==="blueFrame") return <svg className="tile-art frame-art" viewBox="0 0 100 100" aria-hidden="true"><rect x="17" y="13" width="66" height="74" rx="5" fill="none" stroke="#5143a0" strokeWidth="7"/><rect x="27" y="23" width="46" height="54" rx="2" fill="none" stroke="#5143a0" strokeWidth="3"/><path d="M28 31q9 0 9-8 M72 31q-9 0-9-8 M28 69q9 0 9 8 M72 69q-9 0-9 8" fill="none" stroke="#5143a0" strokeWidth="3"/></svg>;
 if(symbol==="wan8") return <span className="tile-word wan-word"><i>八</i><i>萬</i></span>;
 if(symbol==="fa"||symbol==="zhong") return <span className={`tile-word honor-word ${symbol}`}>{LABELS[symbol]}</span>;
 if(symbol==="treasure") return <span className="tile-word treasure-word">夺宝</span>;
 if(symbol==="wild") return <span className="tile-word wild-word">百搭</span>;
 return <span className="tile-word">{LABELS[symbol]}</span>;
}
\nexport default function App(){
 const [grid,setGrid]=useState<ReelGrid>(()=>makeGrid());
 const [balance,setBalance]=useState(10000),[betLevel,setBetLevel]=useState(1),[win,setWin]=useState(0);
 const [spinning,setSpinning]=useState(false),[turbo,setTurbo]=useState(false),[sound,setSound]=useState(true);
 const [rolling,setRolling]=useState<boolean[]>([false,false,false,false,false]);
 const [freeSpins,setFreeSpins]=useState(0),[freeMode,setFreeMode]=useState(false),[combo,setCombo]=useState(0);
 const [highlight,setHighlight]=useState<Set<string>>(new Set()),[tip,setTip]=useState("金色牌中奖后转化为百搭");
 const [panel,setPanel]=useState("");
 const [auto,setAuto]=useState(false);
 const busy=useRef(false);
 const autoRef=useRef(false);
 const bet=Number((.2*betLevel).toFixed(2));
 const multipliers=freeMode?FREE_MULTIPLIERS:NORMAL_MULTIPLIERS;
 const multiplier=getMultiplier(freeMode,combo);

 async function spin(){
  if(busy.current||(!freeMode&&balance<bet))return;
  busy.current=true;setSpinning(true);setHighlight(new Set());setWin(0);setPanel("");
  const isFree=freeMode&&freeSpins>0;
  if(!isFree)setBalance(v=>Number((v-bet).toFixed(2)));
  else setFreeSpins(v=>Math.max(0,v-1));
  setCombo(0);setTip(isFree?"免费旋转中…":"好运连连…");
  // Spin each reel independently and stop them from left to right.
  const finalGrid=makeGrid();
  const timers:number[]=[];
  setRolling([true,true,true,true,true]);
  ROWS.forEach((count,reelIndex)=>{
    timers[reelIndex]=window.setInterval(()=>{
      setGrid(previous=>previous.map((reel,index)=>index===reelIndex?Array.from({length:count},()=>makeTile(reelIndex)):reel));
    },turbo?55:78);
  });
  for(let reelIndex=0;reelIndex<5;reelIndex++){
    await wait((turbo?260:520)+(turbo?90:180)*reelIndex);
    window.clearInterval(timers[reelIndex]);
    setGrid(previous=>previous.map((reel,index)=>index===reelIndex?finalGrid[reelIndex]:reel));
    setRolling(previous=>previous.map((value,index)=>index===reelIndex?false:value));
  }
  let current=finalGrid;
  await wait(turbo?100:280);
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
  setRolling([false,false,false,false,false]);setSpinning(false);busy.current=false;
  if(isFree&&freeSpins===1&&awarded===0){setFreeMode(false);setTip("免费旋转结束");}
  if(autoRef.current)window.setTimeout(()=>{if(autoRef.current&&!busy.current)void spin();},700);
 }
 const startAuto=()=>{const next=!autoRef.current;autoRef.current=next;setAuto(next);if(next&&!busy.current)void spin();};
 return <main className="game-shell"><div className="game-frame">
  <header className="top-banner"><span className="dragon dragon-left">龍</span><div><b>2000 路中奖组合</b><small>LUCKY MAHJONG · GRAND WAYS</small></div><span className="dragon dragon-right">龍</span></header>
  <div className="multiplier">{multipliers.map((m,i)=><div className={(!spinning&&i===Math.min(combo,multipliers.length-1))|| (spinning&&i===Math.min(combo,multipliers.length-1))?"active":""} key={m}>×{m}</div>)}</div>
  {freeMode&&<div className="free-tag">免费旋转剩余：{freeSpins}</div>}
  <section className={`reels ${spinning?"spinning":""}`}>{grid.map((reel,c)=><div className={`reel ${rolling[c]?"rolling":""}`} key={c}>{reel.map((tile,r)=>{
    const key=`${c}-${r}`;const isWin=highlight.has(key);
    return <div key={tile.id} className={`tile ${tile.gold?"gold":""} ${tile.symbol==="wild"?"wild":""} ${tile.symbol==="treasure"?"treasure":""} ${isWin?"winning":""}`}><TileFace symbol={tile.symbol}/>{tile.gold&&<i>金</i>}</div>;
  })}</div>)}
  {panel&&<div className="win-panel">{panel}<strong>¥{win.toFixed(2)}</strong></div>}</section>
  <div className="notice"><span className="notice-flourish">❖</span>{spinning?tip:"保证出现的金色麻将符号！"}<span className="notice-flourish">❖</span></div>
  <section className="account-row">
   <div className="stat-pill"><UserRound/><b>¥{balance.toFixed(2)}</b></div>
   <div className="stat-pill pg-pill"><ShieldCheck/><b>PG</b></div>
   <div className="stat-pill"><b>¥{bet.toFixed(2)}</b><CircleDollarSign/></div>
  </section>
  <section className="controls reference-controls">
   <button aria-label="加速" onClick={()=>setTurbo(v=>!v)} className={turbo?"selected":""}><Zap/></button>
   <button aria-label="减少投注" disabled={spinning||freeMode} onClick={()=>setBetLevel(v=>Math.max(1,v-1))}><Minus/></button>
   <button className="spin" aria-label="旋转" disabled={spinning} onClick={()=>void spin()}><RotateCcw/></button>
   <button aria-label="增加投注" disabled={spinning||freeMode} onClick={()=>setBetLevel(v=>Math.min(20,v+1))}><Plus/></button>
   <button aria-label="自动旋转" onClick={startAuto} className={auto?"selected":""}>{auto?<Pause/>:<Play/>}</button>
  </section>
  <div className="sound-strip"><button onClick={()=>setSound(v=>!v)}>{sound?<Volume2/>:<VolumeX/>} {sound?"声音开启":"声音关闭"}</button><span>本轮赢分 ¥{win.toFixed(2)}</span></div>
  <footer><button onClick={()=>setPanel("赔付表已按规则图录入")}>赔付表</button><button onClick={()=>setPanel("3个夺宝符号触发10次免费旋转，每多1个增加2次")}>游戏规则</button><button onClick={()=>setPanel("中奖组合按从左至右连续3至5列计算")}>中奖说明</button></footer>
 </div></main>;
}
