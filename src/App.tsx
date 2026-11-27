import "./game-effects.css";
import "./design-overrides.css";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BookOpen, History as HistoryIcon, Volume2, VolumeX, X, Zap, UserRound, CircleDollarSign } from "lucide-react";
import {
  type Tile, type SymbolId, type ReelGrid, type PayingSymbol,
  ROWS, NORMAL_MULTIPLIERS, FREE_MULTIPLIERS, PAYTABLE,
  createTile, createGrid, createReel, countTreasureSymbols, freeSpinsAwarded,
  getMultiplier, evaluateWays, resolveWinningReels, MAX_CASCADE_ROUNDS,
} from "./game/engine";

const ASSET_BASE = "./assets/mahjong-hulu2";
const asset = (path:string) => ASSET_BASE + "/" + path;
const QA_MODE = new URLSearchParams(window.location.search).get("qa") === "1";
const wait = (ms:number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const effectAssetStyle:CSSProperties = {
  "--mh-gold-tile-glow": 'url("' + asset("effects/win-free/vfx_08_gold_shards_and_sparkles.png") + '")',
  "--mh-gold-tile-burst": 'url("' + asset("effects/win-free/vfx_07_gold_particle_spark_burst.png") + '")',
  "--mh-gold-landing": 'url("' + asset("effects/spin/12_ground_glow_ring.png") + '")',
  "--mh-gold-particles": 'url("' + asset("effects/win-free/06_gold_particle_burst.png") + '")',
  "--mh-spin-orbit": 'url("' + asset("effects/spin/05_spin_orbit_glow.png") + '")',
  "--mh-spin-idle": 'url("' + asset("effects/spin/01_spin_idle.png") + '")',
  "--mh-free-banner": 'url("' + asset("effects/win-free/08_free_spins_gold_banner_5_times.png") + '")',
  "--mh-win-banner": 'url("' + asset("effects/ui-original/07_bottom_red_button_bar_original.png") + '")',
} as CSSProperties;

const LABELS:Record<SymbolId,string> = {
  fa:"發", zhong:"中", blueFrame:"框牌", wan8:"八萬",
  fiveDots:"彩筒", bambooRed:"红绿条", threeDots:"三色筒",
  twoDots:"双色筒", singleDots:"绿条", wild:"百搭", treasure:"胡",
};
const IMAGE_FACES:Partial<Record<SymbolId,{normal:string;gold:string}>> = {
  fa:{normal:"tile-fa.png",gold:"tile-gold-fa.png"},
  zhong:{normal:"tile-zhong.png",gold:"tile-gold-zhong.png"},
  blueFrame:{normal:"tile-frame.png",gold:"tile-gold-frame.png"},
  wan8:{normal:"tile-wan.png",gold:"tile-gold-wan.png"},
  twoDots:{normal:"tile-two-dots.png",gold:"tile-gold-two-dots.png"},
};

function TileFace({symbol,gold=false}:{symbol:SymbolId;gold?:boolean}) {
  const image=IMAGE_FACES[symbol];
  if(image) {
    return <img className="tile-art tile-image" src={asset("effects/tiles/" + (gold?"gold/":"normal/") + (gold?image.gold:image.normal))} alt={LABELS[symbol]} draggable="false"/>;
  }

  if(symbol==="wild") {
    return <span className="wild-symbol"><b>百搭</b><small>WILD</small><i>金元寶</i></span>;
  }
  if(symbol==="treasure") {
    return <span className="tile-word scatter-word">胡</span>;
  }

  const dotSets:Record<string,Array<[number,number,string]>> = {
    fiveDots:[[27,27,"#26884e"],[73,27,"#6650ae"],[50,50,"#c23535"],[27,73,"#26884e"],[73,73,"#6650ae"]],
    threeDots:[[50,23,"#6650ae"],[28,53,"#26884e"],[72,53,"#c23535"]],
    twoDots:[[50,30,"#6650ae"],[50,70,"#26884e"]],
    singleDots:[[50,28,"#26884e"],[50,72,"#26884e"]],
  };
  if(dotSets[symbol]) {
    return <svg className="tile-art dots-art" viewBox="0 0 100 100" aria-hidden="true">
      {dotSets[symbol].map(([x,y,color],i)=><g key={i}>
        <circle cx={x} cy={y} r="12" fill={color}/>
        <circle cx={x-3} cy={y-3} r="3" fill="#ffffff99"/>
      </g>)}
    </svg>;
  }
  if(symbol==="bambooRed") {
    return <svg className="tile-art bamboo-art" viewBox="0 0 100 100" aria-hidden="true">
      {[27,50,73].map((x,i)=><g key={x}>
        <rect x={x-5} y="14" width="10" height="72" rx="5" fill={i===1?"#c23535":"#26884e"}/>
        <path d={"M"+(x-5)+" 34h10 M"+(x-5)+" 56h10 M"+(x-5)+" 77h10"} stroke="#f4e8ce" strokeWidth="3"/>
        <path d={"M"+x+" 15q-13 -12 -14 -2q8 8 14 2 M"+x+" 15q13 -12 14 -2q-8 8 -14 2"} fill="#26884e"/>
      </g>)}
    </svg>;
  }
  return <span className="tile-word">{LABELS[symbol]}</span>;
}

function DragonArt({side="left"}:{side?:"left"|"right"}) {
 return <svg className={"dragon-art "+side} viewBox="0 0 150 90" aria-hidden="true">
  <defs><linearGradient id={"dragon-gold-"+side} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0b2"/><stop offset=".45" stopColor="#e7b45e"/><stop offset="1" stopColor="#a65b35"/></linearGradient></defs>
  <g fill="none" stroke={"url(#dragon-gold-"+side+")"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
   <path d="M8 78 Q34 54 38 31 Q43 8 63 15 Q80 20 75 37 Q70 51 53 48 Q42 45 47 34 Q53 24 62 31"/>
   <path d="M61 15 Q52 2 40 7 L47 20 M66 16 Q78 2 91 8 L79 22 M73 29 Q93 19 106 29 L91 35"/>
   <path d="M53 48 Q77 58 96 44 Q115 31 139 13 M67 54 Q91 68 116 51 L143 34"/>
   <path d="M92 43 l9 12 -4 13 M112 33 l13 7 3 13 M37 31 l-14 -8 -8 7"/>
   <path d="M18 78 Q44 68 63 78 Q91 91 121 72" strokeWidth="2"/>
   <circle cx="64" cy="30" r="2.5" fill="#fff0b2" stroke="none"/>
  </g>
 </svg>;
}

type ModalKind = "rules"|"paytable"|"history"|null;
type HistoryRecord = {id:number;bet:number;win:number;free:boolean;scatters:number;};

export default function App() {
  const [grid,setGrid]=useState<ReelGrid>(()=>createGrid());
  const [balance,setBalance]=useState(10000);
  const [betLevel,setBetLevel]=useState(2);
  const [win,setWin]=useState(0);
  const [spinning,setSpinning]=useState(false);
  const [currentSpinFree,setCurrentSpinFree]=useState(false);
  const [turbo,setTurbo]=useState(false);
  const [sound,setSound]=useState(true);
  const [rolling,setRolling]=useState<boolean[]>([false,false,false,false,false]);
  const [freeSpins,setFreeSpins]=useState(0);
  const [freeMode,setFreeMode]=useState(false);
  const [combo,setCombo]=useState(0);
  const [highlight,setHighlight]=useState<Set<string>>(new Set());
  const [tip,setTip]=useState("金色麻将符号中奖后将转化为百搭");
  const [effect,setEffect]=useState<"none"|"win"|"gold-win"|"cascade">("none");
  const [winPanel,setWinPanel]=useState("");
  const [modal,setModal]=useState<ModalKind>(null);
  const [selectedSymbol,setSelectedSymbol]=useState<SymbolId>("fa");
  const [auto,setAuto]=useState(false);
  const [roundNumber,setRoundNumber]=useState(0);
  const [history,setHistory]=useState<HistoryRecord[]>([]);
  const busy=useRef(false);
  const autoRef=useRef(false);
  const autoTimer=useRef<number|undefined>(undefined);
  const bet=Number((0.2*betLevel).toFixed(2));
  const multipliers=(spinning?currentSpinFree:freeMode)?FREE_MULTIPLIERS:NORMAL_MULTIPLIERS;
  const activeMultiplier=getMultiplier((spinning?currentSpinFree:freeMode),combo);

  useEffect(()=>()=>{if(autoTimer.current!==undefined)window.clearTimeout(autoTimer.current);},[]);

  async function spin() {
    if(busy.current)return;
    const isFreeSpin=freeMode&&freeSpins>0;
    if(!isFreeSpin&&balance<bet) {
      autoRef.current=false;setAuto(false);setTip("余额不足，请降低投注金额");return;
    }

    busy.current=true;
    setSpinning(true);
    setCurrentSpinFree(isFreeSpin);
    setHighlight(new Set());
    setWin(0);
    setWinPanel("");
    setEffect("none");
    setCombo(0);
    setTip(isFreeSpin?"免费旋转中…":"旋转中…");

    const intervals:number[]=[];
    let scatterAwarded=0;
    let accumulated=0;
    let current:ReelGrid=grid;
    try {
      if(isFreeSpin) setFreeSpins(v=>Math.max(0,v-1));
      else setBalance(v=>Number((v-bet).toFixed(2)));

      const finalGrid=createGrid(Math.random,isFreeSpin);
      setRolling([true,true,true,true,true]);
      ROWS.forEach((count,reelIndex)=>{
        intervals[reelIndex]=window.setInterval(()=>{
          setGrid(previous=>previous.map((reel,index)=>
            index===reelIndex?createReel(reelIndex,Math.random,isFreeSpin):reel
          ));
        },QA_MODE?22:(turbo?54:78));
      });

      for(let reelIndex=0;reelIndex<5;reelIndex++) {
        await wait(QA_MODE?45:(turbo?240:440)+(turbo?65:130)*reelIndex);
        window.clearInterval(intervals[reelIndex]);
        setGrid(previous=>previous.map((reel,index)=>index===reelIndex?finalGrid[reelIndex]:reel));
        setRolling(previous=>previous.map((value,index)=>index===reelIndex?false:value));
      }

      current=finalGrid;
      const scatterCount=countTreasureSymbols(current);
      scatterAwarded=freeSpinsAwarded(scatterCount);
      if(scatterAwarded>0) {
        setFreeMode(true);
        setFreeSpins(v=>v+scatterAwarded);
        setTip("胡牌符号触发免费旋转 +" + scatterAwarded);
      }

      for(let cascadeIndex=0;cascadeIndex<MAX_CASCADE_ROUNDS;cascadeIndex++) {
        const result=evaluateWays(current,bet);
        if(result.wins.length===0||result.winningPositions.size===0)break;

        // A base-game spin that triggers Free Spins still uses its base-game multiplier.
        const multiplier=getMultiplier(isFreeSpin,cascadeIndex);
        const amount=Number((result.total*multiplier).toFixed(2));
        accumulated=Number((accumulated+amount).toFixed(2));
        setWin(accumulated);
        setBalance(v=>Number((v+amount).toFixed(2)));
        setHighlight(result.winningPositions);
        const hasWinningGold=[...result.winningPositions].some(key=>{
          const parts=key.split("-").map(Number);
          return Boolean(current[parts[0]]?.[parts[1]]?.gold);
        });
        setEffect(hasWinningGold?"gold-win":"win");
        const best=[...result.wins].sort((a,b)=>b.amount-a.amount)[0];
        setWinPanel(best?LABELS[best.symbol]+" · "+best.ways+" 路 · ×"+multiplier:"中奖");
        setTip("连锁中奖 +" + amount.toFixed(2));
        setCombo(cascadeIndex);
        await wait(QA_MODE?18:(turbo?190:460));

        setEffect("cascade");
        await wait(QA_MODE?12:(turbo?90:180));
        current=resolveWinningReels(current,result.winningPositions,
          (reelIndex)=>createTile(reelIndex,Math.random,isFreeSpin));
        setGrid(current);
        setHighlight(new Set());
        setWinPanel("");
        setEffect("none");
        await wait(QA_MODE?8:(turbo?70:130));
      }

      if(accumulated===0&&scatterAwarded===0) {
        setTip(isFreeSpin?"本次免费旋转结束":"再试一次好运");
      } else if(accumulated>0) {
        setTip("本轮累计赢分 ¥"+accumulated.toFixed(2));
      }

      if(isFreeSpin&&freeSpins===1&&scatterAwarded===0) {
        setFreeSpins(0);
        setFreeMode(false);
        setTip("免费旋转结束");
      }

      setHistory(previous=>[
        {id:roundNumber+1,bet:isFreeSpin?0:bet,win:accumulated,free:isFreeSpin,scatters:scatterCount},
        ...previous
      ].slice(0,20));
    } catch(error) {
      console.error("Spin failed",error);
      setTip("本轮出现异常，请重新旋转");
      autoRef.current=false;
      setAuto(false);
    } finally {
      intervals.forEach(id=>window.clearInterval(id));
      setRolling([false,false,false,false,false]);
      setSpinning(false);
      setCurrentSpinFree(false);
      setRoundNumber(v=>v+1);
      busy.current=false;
      if(autoRef.current) {
        autoTimer.current=window.setTimeout(()=>{if(autoRef.current&&!busy.current)void spin();},QA_MODE?30:650);
      }
    }
  }

  function toggleAuto() {
    const next=!autoRef.current;
    autoRef.current=next;
    setAuto(next);
    if(!next&&autoTimer.current!==undefined)window.clearTimeout(autoTimer.current);
    if(next&&!busy.current)void spin();
  }

  function changeBet(delta:number) {
    if(spinning||freeMode)return;
    setBetLevel(v=>Math.max(1,Math.min(10,v+delta)));
  }

  function openTileInfo(symbol:SymbolId) {
    setSelectedSymbol(symbol);
    setModal("paytable");
  }

  const isPayingSymbol=(symbol:SymbolId):symbol is PayingSymbol=>symbol!=="treasure";
  const selectedPay= isPayingSymbol(selectedSymbol)?PAYTABLE[selectedSymbol]:null;

  return <main className={"game-shell effect-"+effect} style={effectAssetStyle}>
    <div className="game-frame" data-testid="game-frame" data-round={roundNumber} data-spinning={spinning}>
      <header className="top-banner">
        <DragonArt side="left"/>
        <div className="top-banner-caption" role="button" tabIndex={0} onClick={()=>setModal("rules")} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setModal("rules");}}}>
          <h1 className="game-title">麻将胡了<span>2</span></h1>
          <small>2000 路中奖组合</small>
        </div>
        <DragonArt side="right"/>
      </header>

      <div className="multiplier" aria-label="中奖倍率">
        {multipliers.map((value,index)=><div className={index===Math.min(combo,3)?"active":""} key={value}>×{value}</div>)}
      </div>

      {freeMode&&<div className="free-tag">免费旋转剩余：{freeSpins}</div>}

      <section className={"reels "+(spinning?"spinning":"")} aria-label="五列二十三张麻将">
        <div className="dragon-corner tl"><DragonArt side="left"/></div>
        <div className="dragon-corner tr"><DragonArt side="right"/></div>
        <div className="dragon-corner bl"><DragonArt side="left"/></div>
        <div className="dragon-corner br"><DragonArt side="right"/></div>

        {grid.map((reel,columnIndex)=><div
          className={"reel "+(rolling[columnIndex]?"rolling":"")+(columnIndex===0||columnIndex===4?" edge-reel":"")}
          key={columnIndex} data-testid="reel" data-reel-index={columnIndex}
        >
          {reel.map((tile,rowIndex)=>{
            const key=columnIndex+"-"+rowIndex;
            const isWin=highlight.has(key);
            return <button
              key={tile.id} type="button" className={"tile "+(tile.gold?"gold":"")+(tile.symbol==="wild"?" wild":"")+(tile.symbol==="treasure"?" treasure":"")+(isWin?" winning":"")}
              data-testid="tile" aria-label={LABELS[tile.symbol]+"麻将牌，第"+(columnIndex+1)+"列第"+(rowIndex+1)+"行"}
              onClick={()=>{if(!spinning)openTileInfo(tile.symbol);}}
            >
              <TileFace symbol={tile.symbol} gold={tile.gold}/>
              {tile.gold&&<i className="gold-label">金</i>}
            </button>;
          })}
        </div>)}

        <div className={"fx-overlay fx-"+effect} aria-hidden="true"/>
        {winPanel&&<div className="win-panel">{winPanel}<strong>¥{win.toFixed(2)}</strong></div>}
      </section>

      <div className="notice">
        <img src={asset("effects/ui-original/07_bottom_red_button_bar_original.png")} alt=""/>
        <span>{tip||"金色麻将符号可参与特殊中奖组合"}</span>
      </div>

      <section className="account-row" aria-label="账户信息">
        <div className="stat-pill">
          <UserRound aria-hidden="true"/>
          <b>¥{balance.toFixed(2)}</b>
        </div>
        <div className="stat-pill pg-pill"><b>PG</b></div>
        <div className="stat-pill">
          <b>¥{bet.toFixed(2)}</b>
          <CircleDollarSign aria-hidden="true"/>
        </div>
      </section>

      <section className="controls reference-controls" aria-label="游戏控制">
        <button className={turbo?"selected control-round":"control-round"} type="button" aria-label="加速" onClick={()=>setTurbo(v=>!v)}>
          <Zap/>
        </button>
        <button className="asset-control control-round" type="button" aria-label="减注" disabled={spinning||freeMode||betLevel<=1} onClick={()=>changeBet(-1)}>
          <img src={asset("effects/ui-original/21_minus_button_transparent.png")} alt=""/>
        </button>
        <button className="spin asset-control" type="button" data-testid="spin" aria-label="旋转" disabled={spinning} onClick={()=>void spin()}>
          <img src={asset("effects/ui-original/22_spin_button_transparent.png")} alt=""/>
        </button>
        <button className="asset-control control-round" type="button" aria-label="加注" disabled={spinning||freeMode||betLevel>=10} onClick={()=>changeBet(1)}>
          <img src={asset("effects/ui-original/23_plus_button_transparent.png")} alt=""/>
        </button>
        <button className={auto?"asset-control control-round selected":"asset-control control-round"} type="button" aria-label="自动" onClick={toggleAuto}>
          <img src={asset("effects/ui-original/24_auto_button_transparent.png")} alt=""/>
        </button>
      </section>

      <div className="sound-strip">
        <button type="button" onClick={()=>setSound(v=>!v)}>
          <img src={asset("effects/ui-original/20_mute_button_transparent.png")} alt=""/>
          {sound?<Volume2/>:<VolumeX/>}<span>{sound?"声音开启":"声音关闭"}</span>
        </button>
        <span className="round-win">本轮赢分 ¥{win.toFixed(2)}</span>
      </div>

      <footer className="game-menu">
        <button type="button" onClick={()=>setModal("paytable")}><span>赔率</span></button>
        <button type="button" onClick={()=>setModal("rules")}><BookOpen/><span>规则</span></button>
        <button type="button" onClick={()=>setModal("history")}><HistoryIcon/><span>记录</span></button>
      </footer>
    </div>

    {modal&&<div className="paytable-backdrop" role="presentation" onClick={()=>setModal(null)}>
      <section className="paytable-card" role="dialog" aria-modal="true" aria-label={modal==="rules"?"游戏规则":modal==="history"?"游戏记录":"赔率表"} onClick={event=>event.stopPropagation()}>
        <button className="paytable-close" type="button" aria-label="关闭" onClick={()=>setModal(null)}><X/></button>
        {modal==="rules"&&<>
          <div className="paytable-kicker">MAHJONG WAYS 2</div><h2>游戏规则</h2>
          <ul className="rule-list">
            <li>5列牌阵：4－5－5－5－4，共2,000种中奖组合。</li>
            <li>从最左列开始，连续3至5列出现相同符号即可中奖；Wild可替代普通麻将，不替代胡牌Scatter。</li>
            <li>金色牌只出现在第2、3、4列；参与中奖后，在下一轮连消中转化为百搭。</li>
            <li>中奖牌消除，上方牌面下落并补入新牌，持续结算直至没有新中奖组合。</li>
            <li>普通倍率：×1、×2、×3、×5；免费旋转倍率：×2、×4、×6、×10。</li>
            <li>3个胡牌Scatter触发10次免费旋转，每多1个增加2次；免费旋转中第3列普通牌全部镀金，并可再次触发。</li>
          </ul>
        </>}
        {modal==="paytable"&&<>
          <div className="paytable-kicker">MAHJONG WAYS 2</div>
          <h2>{LABELS[selectedSymbol]} <span>赔率表</span></h2>
          {selectedPay?<table>
            <thead><tr><th>连续列数</th><th>基础表值</th><th>本注额参考</th></tr></thead>
            <tbody>{([3,4,5] as const).map(count=><tr key={count}>
              <td>{count}列</td><td>{PAYTABLE[selectedSymbol as PayingSymbol][count]}</td>
              <td>¥{(PAYTABLE[selectedSymbol as PayingSymbol][count]*bet/100).toFixed(2)}</td>
            </tr>)}</tbody>
          </table>:<p className="paytable-special">胡牌Scatter：3个触发10次免费旋转，每增加1个额外Scatter再增加2次。</p>}
          <p className="paytable-note">每个符号的基础表值按连续中奖路数相乘，并应用当前连消倍率。</p>
        </>}
        {modal==="history"&&<>
          <div className="paytable-kicker">RECENT ROUNDS</div><h2>游戏记录</h2>
          {history.length===0?<p className="paytable-special">尚无旋转记录。</p>:<div className="history-list">
            {history.map(item=><div className="history-row" key={item.id}>
              <span>第 {item.id} 轮{item.free?" · 免费旋转":""}</span>
              <span>注额 ¥{item.bet.toFixed(2)}</span>
              <b>赢分 ¥{item.win.toFixed(2)}</b>
            </div>)}
          </div>}
        </>}
      </section>
    </div>}
  </main>;
}
