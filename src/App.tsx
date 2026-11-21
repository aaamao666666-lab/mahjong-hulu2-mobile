import { useMemo, useState } from "react";
import { Volume2, VolumeX, Zap, Minus, Plus, PlayCircle, UserCircle, Shield, Coins } from "lucide-react";

type Tile = { face: string; kind?: "gold" | "wild" | "red" | "green" | "blue" };
const initial: Tile[][] = [
 [{face:"🀙"},{face:"🀙"},{face:"🀙"},{face:"🀙"},{face:"🀙"}],
 [{face:"🀅"},{face:"🀄",kind:"gold"},{face:"🀆"},{face:"🀀"},{face:"🀄"}],
 [{face:"🀆"},{face:"🀅"},{face:"🀄",kind:"wild"},{face:"🀅"},{face:"🀆"}],
 [{face:"🀙"},{face:"🀄",kind:"gold"},{face:"🀅"},{face:"🀆"},{face:"🀙"}],
 [{face:"🀆"},{face:"🀙"},{face:"🀄",kind:"gold"},{face:"🀅"},{face:"🀆"}]
];
const symbols = ["🀄","🀅","🀆","🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠"];
export default function App(){
 const [spinning,setSpinning]=useState(false),[balance,setBalance]=useState(1000),[bet,setBet]=useState(.4),[win,setWin]=useState(0),[sound,setSound]=useState(true),[round,setRound]=useState(0);
 const [grid,setGrid]=useState<Tile[][]>(initial);
 const multiplier=round===0?1:round===1?2:round===2?3:5;
 const rows=useMemo(()=>[0,1,2,3,4],[]);
 function spin(){
  if(spinning||balance<bet)return;
  setSpinning(true);setBalance(v=>+(v-bet).toFixed(2));setWin(0);
  let ticks=0;
  const timer=window.setInterval(()=>{ticks++;setGrid(rows.map((_,c)=>Array.from({length:5},(_,r)=>({face:symbols[Math.floor(Math.random()*symbols.length)],kind:(c>0&&c<4&&Math.random()<.08?"gold":undefined) as Tile["kind"]}))));
   if(ticks>=12){window.clearInterval(timer);setSpinning(false);setRound(v=>Math.min(v+1,3));const prize=Math.random()<.32?+(bet*(2+Math.random()*12)*multiplier).toFixed(2):0;setWin(prize);setBalance(v=>+(v+prize).toFixed(2));}
  },110);
 }
 return <main className="game-shell"><div className="game-frame">
  <header className="top-banner"><div className="dragon dragon-left">♢</div><span>✦ 2000 路中奖组合 ✦</span><div className="dragon dragon-right">♢</div></header>
  <section className="multiplier">{[1,2,3,5].map((n,i)=><div className={multiplier===n?"active":""} key={n}>x{n}</div>)}</section>
  <section className="reels" aria-label="麻将牌阵">{grid.map((col,c)=><div className={`reel ${spinning?"moving":""}`} key={c}>{col.map((tile,r)=><div className={`tile ${tile.kind||""}`} key={r}><span>{tile.face}</span></div>)}</div>)}</section>
  <div className="notice">{win>0?`恭喜中奖 ¥${win.toFixed(2)}！`:"保证出现的金色麻将符号！"}</div>
  <section className="account-row"><div><UserCircle/><b>¥{balance.toFixed(2)}</b></div><div className="pg"><Shield/><b>PG</b></div><div><b>¥{bet.toFixed(2)}</b><Coins/></div></section>
  <section className="controls"><button aria-label="加速" onClick={()=>setSound(v=>!v)}><Zap/></button><button aria-label="减注" onClick={()=>setBet(v=>Math.max(.2,+(v-.2).toFixed(2)))}><Minus/></button><button className={`spin ${spinning?"busy":""}`} onClick={spin} disabled={spinning}><span>⟳</span></button><button aria-label="加注" onClick={()=>setBet(v=>+(v+.2).toFixed(2))}><Plus/></button><button aria-label="自动旋转" onClick={spin}><PlayCircle/></button></section>
  <footer><button onClick={()=>setSound(v=>!v)}>{sound?<Volume2/>:<VolumeX/>}声音</button><button onClick={()=>alert("赔付表：正式赔付数值待接入原始规则数据")}>∿ 赔付表</button><button onClick={()=>alert("规则以你提供的规则图为准")}>ⓘ 规则</button><button onClick={()=>alert("历史记录将在下一阶段接入")}>◷ 历史</button><button onClick={()=>alert("退出游戏")}>↩ 退出</button></footer>
 </div></main>
}