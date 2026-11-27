<script setup lang="ts">
import { computed, ref } from "vue";

type Tile = { id:number; face:string; goldFace:string; isGold:boolean };
const normalFaces = ["tile-fa.png","tile-zhong.png","tile-frame.png","tile-wan.png","tile-bamboo-five.png","tile-two-bamboo.png","tile-two-dots.png"];
const goldFaces = ["tile-gold-fa.png","tile-gold-zhong.png","tile-gold-frame.png","tile-gold-wan.png","tile-gold-bamboo.png","tile-gold-two-bamboo.png","tile-gold-two-dots.png"];
const ROWS = [4,5,5,5,4] as const;
let tileId = 0;
const makeTile = ():Tile => {
  const i = Math.floor(Math.random()*normalFaces.length);
  const isGold = Math.random() < 0.13;
  return { id:++tileId, face:normalFaces[i], goldFace:goldFaces[i], isGold };
};
const makeReels = () => ROWS.map(n => Array.from({length:n},makeTile));
const reels = ref<Tile[][]>(makeReels());
const balance = ref(10000);
const bet = ref(1);
const win = ref(0);
const multiplier = ref(0);
const spinning = ref(false);
const auto = ref(false);
const turbo = ref(false);
const sound = ref(true);
const showWin = ref(false);
const message = ref("金色麻将符号可参与特殊中奖组合");
const factors = [1,2,3,5];
const betText = computed(()=>bet.value.toFixed(2));
const base = "./assets/mahjong-hulu2/";
const ui = (file:string)=>base+"effects/ui-original/"+file;
const tileSrc = (t:Tile)=>base+"effects/tiles/"+(t.isGold?"gold/"+t.goldFace:"normal/"+t.face);
let autoTimer:ReturnType<typeof setTimeout>|undefined;
let winTimer:ReturnType<typeof setTimeout>|undefined;

function spin(){
  if(spinning.value)return;
  if(balance.value<bet.value){message.value="余额不足，请降低投注金额";auto.value=false;return;}
  if(autoTimer)clearTimeout(autoTimer);
  spinning.value=true;showWin.value=false;win.value=0;
  balance.value=+(balance.value-bet.value).toFixed(2);
  message.value="旋转中…";
  window.setTimeout(()=>{
    reels.value=makeReels();
    const counts=new Map<string,number>();
    reels.value.flat().forEach(t=>counts.set(t.face,(counts.get(t.face)||0)+1));
    const top=Math.max(...counts.values());
    if(top>=3){
      win.value=+(bet.value*(top-2)*factors[multiplier.value]).toFixed(2);
      balance.value=+(balance.value+win.value).toFixed(2);
      multiplier.value=Math.min(3,multiplier.value+1);
      message.value="恭喜中奖！";
      showWin.value=true;
      if(winTimer)clearTimeout(winTimer);
      winTimer=window.setTimeout(()=>showWin.value=false,1500);
    }else{
      multiplier.value=0;
      message.value="再试一次好运";
    }
    spinning.value=false;
    if(auto.value)autoTimer=window.setTimeout(()=>{if(auto.value)spin();},turbo.value?280:1000);
  },turbo.value?420:780);
}
function toggleAuto(){
  auto.value=!auto.value;
  if(!auto.value&&autoTimer)clearTimeout(autoTimer);
  if(auto.value&&!spinning.value)spin();
}
function changeBet(delta:number){
  if(spinning.value)return;
  bet.value=Math.max(.2,Math.min(20,+(bet.value+delta).toFixed(2)));
}
</script>

<template>
  <main class="mh-page">
    <section class="mh-game" aria-label="麻将胡了2">
      <header class="mh-header">
        <h1>麻将胡了 <span>2</span></h1>
      </header>

      <section class="mh-multiplier" aria-label="中奖倍率">
        <img class="mh-multiplier-art" :src="ui('19_green_banner_blank_center_original.png')" alt="">
        <div class="mh-multiplier-values">
          <b v-for="(n,i) in factors" :key="n" :class="{active:i===multiplier}">×{{n}}</b>
        </div>
      </section>

      <section class="mh-reels" :class="{'spinning':spinning,'winning':showWin}" aria-label="五列二十三张麻将">
        <div v-for="(reel,col) in reels" :key="col" class="mh-reel" :class="{'edge-reel':col===0||col===4}">
          <div v-for="(tile,row) in reel" :key="tile.id" class="mh-tile"
            :class="{'gold-tile':tile.isGold}"
            :style="{animationDelay:spinning?(col*55+row*28)+'ms':'0ms'}">
            <img :src="tileSrc(tile)" :alt="'第'+(col+1)+'列第'+(row+1)+'张麻将牌'" draggable="false">
            <img v-if="tile.isGold&&showWin" class="mh-gold-flare" :src="base+'effects/win-free/06_gold_particle_burst.png'" alt="">
          </div>
        </div>
        <div v-if="showWin" class="mh-win-particles" aria-hidden="true"></div>
      </section>

      <div class="mh-notice">
        <img :src="base+'effects/ui-original/07_bottom_red_button_bar_original.png'" alt="">
        <strong>{{message}}</strong>
      </div>

      <section class="mh-wallet">
        <div class="wallet-panel">
          <img :src="ui('25_user_wallet_panel_transparent.png')" alt="">
          <small>余额</small><b>¥{{balance.toFixed(2)}}</b>
        </div>
        <div class="wallet-panel pg-panel">
          <img :src="ui('26_pg_panel_transparent.png')" alt=""><b>PG</b>
        </div>
        <div class="wallet-panel">
          <img :src="ui('27_balance_panel_transparent.png')" alt="">
          <small>下注金额</small><b>¥{{betText}}</b>
        </div>
      </section>

      <section class="mh-controls" aria-label="游戏控制按钮">
        <button class="control-btn" :class="{selected:turbo}" @click="turbo=!turbo">
          <b class="bolt">⚡</b><span>加速</span>
        </button>
        <button class="control-btn" :disabled="spinning" @click="changeBet(-.2)">
          <img :src="ui('21_minus_button_transparent.png')" alt=""><span>减注</span>
        </button>
        <button class="spin-btn" :class="{spinning}" :disabled="spinning" @click="spin" aria-label="开始旋转">
          <img :src="ui('22_spin_button_transparent.png')" alt="">
        </button>
        <button class="control-btn" :disabled="spinning" @click="changeBet(.2)">
          <img :src="ui('23_plus_button_transparent.png')" alt=""><span>加注</span>
        </button>
        <button class="control-btn" :class="{selected:auto}" @click="toggleAuto">
          <img :src="ui('24_auto_button_transparent.png')" alt=""><span>自动</span>
        </button>
      </section>

      <footer class="mh-footer">
        <button @click="sound=!sound">
          <img :src="ui('20_mute_button_transparent.png')" alt="">
          {{sound?"声音开启":"声音关闭"}}
        </button>
        <span>本轮赢分 ¥{{win.toFixed(2)}}</span>
      </footer>
    </section>
  </main>
</template>

<style>
*{box-sizing:border-box}
html,body,#app{width:100%;height:100%;min-height:100%;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#073b33}
button{font:inherit;-webkit-tap-highlight-color:transparent;cursor:pointer}
.mh-page{width:100%;min-height:100svh;min-height:100dvh;display:flex;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,#276b59 0%,#10483e 58%,#062d29 100%)}
.mh-game{
 width:min(100%,520px);height:100svh;height:100dvh;min-height:620px;max-height:100dvh;
 display:grid;grid-template-rows:7.5% 11.5% minmax(0,1fr) 7% 8% 15% 4.5%;
 padding:0 7px env(safe-area-inset-bottom);overflow:hidden;position:relative;
 background:linear-gradient(180deg,#d77859 0%,#bd5d48 52%,#a94b38 100%);
 border-left:3px solid #edc77e;border-right:3px solid #edc77e;
 box-shadow:inset 0 0 0 1px #ffe9b3,inset 0 0 28px #672b2455,0 0 25px #061b18aa
}
.mh-header{display:flex;align-items:center;justify-content:center;min-height:0;position:relative;background:linear-gradient(110deg,#b84f40,#df8060 48%,#b84f40);border-bottom:2px solid #e8bd78;box-shadow:inset 0 -5px 0 #79372b22}
.mh-header h1{margin:0;color:#ffe3a1;font-family:Georgia,"Noto Sans SC",serif;font-size:clamp(25px,7vw,37px);font-weight:1000;letter-spacing:.12em;text-shadow:0 2px #713226,0 0 8px #ffd68b66}
.mh-header h1 span{margin-left:5px}
.mh-multiplier{position:relative;min-height:0;overflow:hidden;border-bottom:4px solid #dfb36c;background:linear-gradient(#61bba5,#087568)}
.mh-multiplier-art{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none}
.mh-multiplier-values{position:absolute;inset:24% 2% 4%;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;text-align:center}
.mh-multiplier-values b{font-size:clamp(30px,9vw,48px);font-style:italic;font-weight:1000;line-height:1;color:#064c45;text-shadow:0 2px #033b35}
.mh-multiplier-values b.active{color:#ffe38a;transform:scale(1.08);text-shadow:0 0 9px #fff1a5,0 0 20px #f6d05f,0 2px #75451c;animation:multiplierGlow 900ms ease-in-out infinite alternate}
.mh-reels{
 min-height:0;position:relative;isolation:isolate;overflow:hidden;
 display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;
 gap:clamp(3px,.9vw,7px);padding:clamp(7px,1.4vh,13px) 3.2%;
 background:
  radial-gradient(ellipse at 50% 48%,#d77b60 0%,#c46852 62%,#a94b3d 100%);
 border-bottom:5px solid #dfb46e;
 box-shadow:inset 0 0 22px #6e302b66,inset 0 7px 8px #ffe3b322
}
.mh-reels:before,.mh-reels:after{content:"";position:absolute;z-index:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#88542e,#ffe9ac,#c58a45,#ffe9ac,#88542e);pointer-events:none}
.mh-reels:before{top:0}.mh-reels:after{bottom:0}
.mh-reel{z-index:1;min-width:0;min-height:0;height:100%;display:grid;grid-template-rows:repeat(5,minmax(0,1fr));gap:clamp(3px,.65vh,7px);align-self:stretch}
.mh-reel.edge-reel{height:80%;align-self:center;grid-template-rows:repeat(4,minmax(0,1fr))}
.mh-tile{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;overflow:visible}
.mh-tile>img:first-child{width:100%;height:100%;display:block;object-fit:contain;object-position:center;filter:drop-shadow(0 2px 2px #5d342b66);user-select:none;-webkit-user-drag:none}
.mh-tile.gold-tile>img:first-child{filter:drop-shadow(0 0 7px #ffe15c) drop-shadow(0 2px 2px #6e3c2766)}
.mh-gold-flare{position:absolute!important;inset:-20%!important;width:140%!important;height:140%!important;object-fit:contain;pointer-events:none;animation:goldBurst 850ms ease-out both}
.mh-win-particles{position:absolute;z-index:3;inset:0;pointer-events:none;background:url("./assets/mahjong-hulu2/effects/win-free/06_gold_particle_burst.png") center/contain no-repeat;animation:winBurst 1.2s ease-out both}
.mh-reels.spinning .mh-tile{animation:tileDrop 520ms cubic-bezier(.2,.8,.25,1) both}
.mh-reels.winning .mh-tile.gold-tile{animation:goldWinPulse 500ms ease-in-out 3 alternate}
.mh-notice{position:relative;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 7%;overflow:hidden}
.mh-notice>img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
.mh-notice strong{z-index:1;color:#ffe8b9;font-size:clamp(13px,3.7vw,18px);font-weight:1000;text-align:center;text-shadow:0 1px #6c1d29;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mh-wallet{min-height:0;display:grid;grid-template-columns:1.2fr .68fr 1.2fr;gap:5px;padding:3px 2% 5px}
.wallet-panel{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden}
.wallet-panel>img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
.wallet-panel small,.wallet-panel b{z-index:1;white-space:nowrap;color:#f3d5a4;text-shadow:0 1px 2px #4b2b2266}
.wallet-panel small{font-size:clamp(10px,2.8vw,13px)}
.wallet-panel b{font-size:clamp(14px,4vw,19px);font-weight:900;color:#f5ce7e}
.wallet-panel.pg-panel b{font-size:clamp(20px,6vw,29px)}
.mh-controls{min-height:0;display:grid;grid-template-columns:1fr 1fr 1.35fr 1fr 1fr;align-items:center;justify-items:center;gap:clamp(3px,.7vw,7px);padding:4px 3% 8px;background:linear-gradient(180deg,#c2664d,#a64a37);border-top:1px solid #edbd78}
.control-btn,.spin-btn{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #b67b4d;color:#ffe5b6;background:linear-gradient(160deg,#814633,#522820);box-shadow:inset 0 1px 2px #ffe1b044,0 3px 6px #57291f88}
.control-btn{width:100%;height:88%;max-height:86px;border-radius:clamp(12px,3.4vw,22px);gap:2px}
.control-btn img{width:68%;height:68%;max-height:58px;object-fit:contain}
.control-btn span{font-size:clamp(10px,2.9vw,14px);font-weight:900;line-height:1}
.control-btn:disabled,.spin-btn:disabled{opacity:.65}
.control-btn.selected{border-color:#ffe29a;box-shadow:0 0 12px #ffe18a88,inset 0 1px 3px #fff5}
.bolt{font-size:clamp(29px,8vw,43px);line-height:1;text-shadow:0 0 9px #ffd75e}
.spin-btn{width:min(100%,92px);aspect-ratio:1;border-radius:50%;padding:4px;border:5px solid #e9c97c;background:radial-gradient(circle at 35% 25%,#b8e7ce,#42b69e 48%,#087568 85%);box-shadow:0 0 0 3px #9db68d,0 0 17px #ffe08caa,0 5px 10px #51281e99;overflow:visible}
.spin-btn img{width:100%;height:100%;object-fit:contain}
.spin-btn.spinning img{animation:spinTurn 500ms linear infinite}
.mh-footer{min-height:0;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:#984b35;color:#f3d2a0;font-size:clamp(10px,2.8vw,13px);border-top:2px solid #e6bb75}
.mh-footer button{display:flex;align-items:center;gap:5px;border:0;padding:2px;background:transparent;color:inherit}
.mh-footer img{width:22px;height:22px;object-fit:contain}
@keyframes tileDrop{0%{transform:translateY(-115%);opacity:.25;filter:blur(2px)}70%{transform:translateY(5%);opacity:1;filter:blur(0)}100%{transform:translateY(0)}}
@keyframes spinTurn{to{transform:rotate(360deg)}}
@keyframes multiplierGlow{from{filter:brightness(1)}to{filter:brightness(1.25) drop-shadow(0 0 7px #ffe18b)}}
@keyframes goldWinPulse{from{filter:brightness(1)}to{filter:brightness(1.5) drop-shadow(0 0 10px #fff078)}}
@keyframes goldBurst{0%{transform:scale(.35);opacity:0}30%{opacity:1}100%{transform:scale(1.25);opacity:0}}
@keyframes winBurst{0%{opacity:0;transform:scale(.55)}35%{opacity:1}100%{opacity:0;transform:scale(1.12)}}
@media(max-height:740px){
 .mh-game{min-height:0;grid-template-rows:7% 11% minmax(0,1fr) 7% 8% 15% 4.5%}
 .mh-controls{padding-top:2px;padding-bottom:4px}
 .control-btn{max-height:68px}
 .spin-btn{width:min(100%,72px);border-width:4px}
}
@media(min-width:600px){.mh-game{width:min(90vw,520px)}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
</style>
