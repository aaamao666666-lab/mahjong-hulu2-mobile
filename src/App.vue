<script setup lang="ts">
import { computed, ref } from "vue";
type Tile={id:number;normal:string;gold:string;isGold:boolean};
const normal=["tile-fa.png","tile-zhong.png","tile-frame.png","tile-wan.png","tile-bamboo-five.png","tile-two-bamboo.png","tile-two-dots.png"];
const gold=["tile-gold-fa.png","tile-gold-zhong.png","tile-gold-frame.png","tile-gold-wan.png","tile-gold-bamboo.png","tile-gold-two-bamboo.png","tile-gold-two-dots.png"];
let id=0;
const makeTile=():Tile=>{const i=Math.floor(Math.random()*normal.length),g=Math.random()<.12;return{id:++id,normal:normal[i],gold:gold[i],isGold:g};};
const makeGrid=()=>Array.from({length:20},makeTile);
const tiles=ref<Tile[]>(makeGrid()),balance=ref(10000),bet=ref(1),win=ref(0);
const spinning=ref(false),auto=ref(false),sound=ref(true),turbo=ref(false),multiplier=ref(0);
const message=ref("金色麻将符号可参与特殊中奖组合");
const factors=[1,2,3,5],betText=computed(()=>bet.value.toFixed(2));
const ui=(name:string)=>`./assets/mahjong-hulu2/ui/${name}`;
const tileSrc=(t:Tile)=>`./assets/mahjong-hulu2/effects/tiles/${t.isGold?"gold":"normal"}/${t.isGold?t.gold:t.normal}`;
function spin(){
 if(spinning.value)return;
 if(balance.value<bet.value){message.value="余额不足，请降低投注金额";auto.value=false;return;}
 spinning.value=true;balance.value=+(balance.value-bet.value).toFixed(2);win.value=0;message.value="本轮旋转中";
 window.setTimeout(()=>{
  tiles.value=makeGrid();
  const counts=new Map<string,number>();tiles.value.forEach(t=>counts.set(t.normal,(counts.get(t.normal)||0)+1));
  const best=Math.max(...counts.values());
  if(best>=3){win.value=+(bet.value*(best-2)*factors[multiplier.value]).toFixed(2);balance.value=+(balance.value+win.value).toFixed(2);message.value="本轮中奖";multiplier.value=Math.min(3,multiplier.value+1);}
  else{message.value="再试一次好运";multiplier.value=0;}
  spinning.value=false;if(auto.value)window.setTimeout(()=>{if(auto.value)spin();},turbo.value?250:900);
 },turbo.value?220:650);
}
function toggleAuto(){auto.value=!auto.value;if(auto.value&&!spinning.value)spin();}
function changeBet(d:number){bet.value=Math.max(.2,Math.min(20,+(bet.value+d).toFixed(2)));}
</script>
<template>
<main class="game-page"><div class="game-frame">
<header class="top-banner"><span class="dragon-mark">龍</span><div class="heading"><h1>麻将胡了<span>2</span></h1><small>2000路中奖组合</small></div><span class="dragon-mark">龍</span></header>
<section class="multipliers"><div v-for="(v,i) in factors" :key="v" :class="{active:i===multiplier}">×{{v}}</div></section>
<section class="tile-grid" aria-label="4行5列麻将"><div v-for="(t,i) in tiles" :key="t.id" class="tile-cell" :class="{gold:t.isGold}"><img :src="tileSrc(t)" :alt="`麻将牌 ${i+1}`" draggable="false"></div></section>
<div class="notice"><span>❖</span>{{message}}<span>❖</span></div>
<section class="account-row"><div class="account-panel"><small>余额</small><strong>¥{{balance.toFixed(2)}}</strong></div><div class="account-panel pg"><strong>PG</strong></div><div class="account-panel"><small>下注金额</small><strong>¥{{betText}}</strong></div></section>
<section class="controls">
<button class="control-button" :class="{selected:turbo}" @click="turbo=!turbo"><b>⚡</b><small>加速</small></button>
<button class="control-button" :disabled="spinning" @click="changeBet(-.2)"><img :src="ui('21_minus_button_transparent.png')" alt=""><small>减注</small></button>
<button class="spin-button" :disabled="spinning" aria-label="旋转" @click="spin"><img :src="ui('22_spin_button_transparent.png')" alt=""></button>
<button class="control-button" :disabled="spinning" @click="changeBet(.2)"><img :src="ui('23_plus_button_transparent.png')" alt=""><small>加注</small></button>
<button class="control-button" :class="{selected:auto}" @click="toggleAuto"><img :src="ui('24_auto_button_transparent.png')" alt=""><small>自动</small></button>
</section>
<footer class="bottom-bar"><button @click="sound=!sound"><img :src="ui('20_mute_button_transparent.png')" alt="">{{sound?"声音开启":"声音关闭"}}</button><span>本轮赢分 ¥{{win.toFixed(2)}}</span></footer>
</div></main>
</template>
<style>
*{box-sizing:border-box}html,body,#app{margin:0;min-height:100%;width:100%}body{background:#173f38;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}button{font:inherit;-webkit-tap-highlight-color:transparent}
.game-page{min-height:100svh;display:flex;justify-content:center;background:radial-gradient(ellipse at center,#4e7861,#173c35)}
.game-frame{width:min(100%,520px);min-height:100svh;padding:0 9px env(safe-area-inset-bottom);display:flex;flex-direction:column;background:linear-gradient(#9d4938,#6f302b);border-inline:4px solid #d5a45d;box-shadow:0 0 26px #160e0b88}
.top-banner{height:78px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:linear-gradient(#d98262,#a84e3c);border-bottom:3px solid #e6bd78}.heading{text-align:center}.heading h1{margin:0;color:#ffe4a5;font:900 clamp(25px,7vw,34px) Georgia,serif;letter-spacing:.12em;text-shadow:0 2px #773323}.heading h1 span{margin-left:3px}.heading small{color:#ffedc8;font-weight:700;letter-spacing:.12em}.dragon-mark{color:#f8d58e;font:32px Georgia;text-shadow:0 2px #793b2b}
.multipliers{height:62px;flex:none;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;text-align:center;background:linear-gradient(#69bda7,#14766d);border-bottom:4px solid #d9ad6a}.multipliers div{color:#064e48;font-size:clamp(32px,9vw,46px);font-style:italic;font-weight:900}.multipliers .active{color:#ffe18c;text-shadow:0 0 10px #fff0a8,0 2px #71431e}
.tile-grid{flex:1 0 auto;min-height:330px;max-height:54svh;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:5px;padding:12px 3%;background:linear-gradient(90deg,#a94e42,#d47b61 50%,#a94e42);border-bottom:5px solid #d9ac6b}.tile-cell{min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;padding:3px;border:1px solid #cbbd9d;border-radius:8px;background:linear-gradient(145deg,#fffdf5,#e5ddc9);box-shadow:0 3px 5px #512b2766,inset 0 1px #fff}.tile-cell img{display:block;width:100%;height:100%;object-fit:contain}.tile-cell.gold{border:2px solid #ffe28c;background:linear-gradient(145deg,#fff3b2,#dba73d);box-shadow:0 0 9px #f8d46b}
.notice{margin:9px 3% 6px;min-height:42px;display:flex;align-items:center;justify-content:center;gap:10px;padding:7px 10px;color:#ffe9be;text-align:center;font-size:clamp(12px,3.6vw,16px);font-weight:800;background:linear-gradient(90deg,#842b37,#bd4c4b,#842b37);border:2px solid #d8aa69;border-radius:24px}.notice span{color:#ffdc8b}
.account-row{display:grid;grid-template-columns:1.2fr .75fr 1.2fr;gap:7px;padding:4px 3px 8px}.account-panel{min-width:0;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1px solid #b77a4c;border-radius:26px;color:#ffe2a4;background:linear-gradient(#804433,#592e27)}.account-panel small{font-size:11px;color:#e7c49a}.account-panel strong{font-size:clamp(13px,3.6vw,17px);white-space:nowrap}.account-panel.pg strong{font-size:20px}
.controls{flex:none;display:flex;align-items:center;justify-content:space-around;gap:5px;padding:7px 0 12px}.control-button{width:58px;height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;color:#ffe4b3;background:linear-gradient(#895039,#603127);border:1px solid #d0a16a;border-radius:12px}.control-button img{width:34px;height:34px;object-fit:contain}.control-button small{font-size:10px}.control-button b{font-size:27px;line-height:34px}.control-button.selected{background:linear-gradient(#b27b42,#77432c)}.control-button:disabled{opacity:.55}
.spin-button{width:82px;height:82px;flex:none;padding:0;border:5px solid #e4c77f;border-radius:50%;background:linear-gradient(#3eae91,#086d64);box-shadow:0 0 0 3px #648b70,0 4px 9px #311b19aa}.spin-button img{width:100%;height:100%;object-fit:contain}.spin-button:disabled{opacity:.7}
.bottom-bar{min-height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 8px 8px;color:#f5d9a6;font-size:12px}.bottom-bar button{display:inline-flex;align-items:center;gap:5px;border:0;padding:4px;color:inherit;background:transparent}.bottom-bar img{width:24px;height:24px;object-fit:contain}
@media(max-height:740px){.top-banner{height:62px}.multipliers{height:52px}.tile-grid{min-height:260px;max-height:48svh}.spin-button{width:68px;height:68px}.control-button{height:52px}}
</style>
