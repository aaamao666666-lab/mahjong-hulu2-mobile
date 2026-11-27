<script setup lang="ts">
import { computed, ref } from "vue";

type Tile = { id:number; normal:string; gold:string; isGold:boolean };
const normalFaces = [
  "tile-fa.png", "tile-zhong.png", "tile-frame.png", "tile-wan.png",
  "tile-bamboo-five.png", "tile-two-bamboo.png", "tile-two-dots.png"
];
const goldFaces = [
  "tile-gold-fa.png", "tile-gold-zhong.png", "tile-gold-frame.png", "tile-gold-wan.png",
  "tile-gold-bamboo.png", "tile-gold-two-bamboo.png", "tile-gold-two-dots.png"
];
const REEL_ROWS = [4,5,5,5,4] as const;
let nextTileId = 0;
const makeTile = ():Tile => {
  const index = Math.floor(Math.random() * normalFaces.length);
  const isGold = Math.random() < 0.12;
  return { id:++nextTileId, normal:normalFaces[index], gold:goldFaces[index], isGold };
};
const makeReels = ():Tile[][] => REEL_ROWS.map(count => Array.from({length:count}, makeTile));
const reels = ref<Tile[][]>(makeReels());
const balance = ref(10000);
const bet = ref(1);
const win = ref(0);
const spinning = ref(false);
const auto = ref(false);
const turbo = ref(false);
const sound = ref(true);
const multiplierIndex = ref(0);
const message = ref("金色麻将符号可参与特殊中奖组合");
const multipliers = [1,2,3,5];
const betLabel = computed(() => bet.value.toFixed(2));
let autoTimer: ReturnType<typeof setTimeout> | undefined;

const ui = (name:string) => "./assets/mahjong-hulu2/ui/" + name;
const tileSrc = (tile:Tile) =>
  "./assets/mahjong-hulu2/effects/tiles/" + (tile.isGold ? "gold/" + tile.gold : "normal/" + tile.normal);

function spin() {
  if (spinning.value) return;
  if (balance.value < bet.value) {
    message.value = "余额不足，请降低投注金额";
    auto.value = false;
    return;
  }
  spinning.value = true;
  balance.value = +(balance.value - bet.value).toFixed(2);
  win.value = 0;
  message.value = "好运连连…";
  window.setTimeout(() => {
    reels.value = makeReels();
    const counts = new Map<string,number>();
    reels.value.flat().forEach(tile => {
      counts.set(tile.normal, (counts.get(tile.normal) || 0) + 1);
    });
    const bestCount = Math.max(...counts.values());
    if (bestCount >= 3) {
      win.value = +(bet.value * (bestCount - 2) * multipliers[multiplierIndex.value]).toFixed(2);
      balance.value = +(balance.value + win.value).toFixed(2);
      message.value = "本轮中奖";
      multiplierIndex.value = Math.min(3, multiplierIndex.value + 1);
    } else {
      message.value = "再试一次好运";
      multiplierIndex.value = 0;
    }
    spinning.value = false;
    if (auto.value) autoTimer = window.setTimeout(() => { if (auto.value) spin(); }, turbo.value ? 250 : 900);
  }, turbo.value ? 300 : 700);
}
function toggleAuto() {
  auto.value = !auto.value;
  if (autoTimer) window.clearTimeout(autoTimer);
  if (auto.value && !spinning.value) spin();
}
function changeBet(delta:number) {
  if (spinning.value) return;
  bet.value = Math.max(0.2, Math.min(20, +(bet.value + delta).toFixed(2)));
}
</script>

<template>
  <main class="mh-shell">
    <section class="mh-cabinet" aria-label="麻将胡了2游戏">
      <header class="mh-top">
        <img class="mh-top-dragon" :src="ui('02_top_left_dragon_original_crop.png')" alt="">
        <div class="mh-title">
          <h1>麻将胡了 <span>2</span></h1>
          <small>2000 路中奖组合</small>
        </div>
        <img class="mh-top-dragon mh-top-dragon--right" :src="ui('03_top_right_dragon_original_crop.png')" alt="">
      </header>

      <section class="mh-multipliers" aria-label="中奖倍率">
        <div v-for="(value,index) in multipliers" :key="value" :class="{ 'is-active': index === multiplierIndex }">
          ×{{ value }}
        </div>
      </section>

      <section class="mh-reels" :class="{ 'is-spinning': spinning }" aria-label="五列麻将，左右各四张，中间三列各五张">
        <img class="mh-corner mh-corner--tl" :src="ui('02_top_left_dragon_original_crop.png')" alt="">
        <img class="mh-corner mh-corner--tr" :src="ui('03_top_right_dragon_original_crop.png')" alt="">
        <img class="mh-corner mh-corner--bl" :src="ui('04_bottom_left_dragon_original_crop.png')" alt="">
        <img class="mh-corner mh-corner--br" :src="ui('05_bottom_right_dragon_original_crop.png')" alt="">
        <div v-for="(reel,columnIndex) in reels" :key="columnIndex" class="mh-reel" :class="{ 'mh-reel--edge': columnIndex === 0 || columnIndex === 4 }">
          <div v-for="(tile,rowIndex) in reel" :key="tile.id" class="mh-tile" :class="{ 'mh-tile--gold': tile.isGold }">
            <img :src="tileSrc(tile)" :alt="'第' + (columnIndex+1) + '列第' + (rowIndex+1) + '张麻将'" draggable="false">
          </div>
        </div>
      </section>

      <div class="mh-notice">
        <span class="mh-notice-flower">❖</span>
        <strong>{{ message }}</strong>
        <span class="mh-notice-flower">❖</span>
      </div>

      <section class="mh-account">
        <div class="mh-account-panel">
          <img :src="ui('25_user_wallet_panel_transparent.png')" alt="">
          <small>余额</small><strong>¥{{ balance.toFixed(2) }}</strong>
        </div>
        <div class="mh-account-panel mh-account-panel--pg">
          <img :src="ui('26_pg_panel_transparent.png')" alt="">
          <strong>PG</strong>
        </div>
        <div class="mh-account-panel">
          <img :src="ui('27_balance_panel_transparent.png')" alt="">
          <small>下注金额</small><strong>¥{{ betLabel }}</strong>
        </div>
      </section>

      <section class="mh-controls" aria-label="游戏控制">
        <button class="mh-control" :class="{ 'is-selected': turbo }" @click="turbo = !turbo" aria-label="加速">
          <b class="mh-zap">⚡</b><small>加速</small>
        </button>
        <button class="mh-control" :disabled="spinning" @click="changeBet(-0.2)" aria-label="减注">
          <img :src="ui('21_minus_button_transparent.png')" alt=""><small>减注</small>
        </button>
        <button class="mh-spin" :disabled="spinning" @click="spin" aria-label="旋转">
          <img :src="ui('22_spin_button_transparent.png')" alt="">
        </button>
        <button class="mh-control" :disabled="spinning" @click="changeBet(0.2)" aria-label="加注">
          <img :src="ui('23_plus_button_transparent.png')" alt=""><small>加注</small>
        </button>
        <button class="mh-control" :class="{ 'is-selected': auto }" @click="toggleAuto" aria-label="自动旋转">
          <img :src="ui('24_auto_button_transparent.png')" alt=""><small>自动</small>
        </button>
      </section>

      <footer class="mh-status">
        <button @click="sound = !sound">
          <img :src="ui('20_mute_button_transparent.png')" alt="">
          {{ sound ? "声音开启" : "声音关闭" }}
        </button>
        <span>本轮赢分 ¥{{ win.toFixed(2) }}</span>
      </footer>
    </section>
  </main>
</template>

<style>
:root { color-scheme: dark; }
* { box-sizing:border-box; }
html, body, #app { margin:0; width:100%; min-height:100%; }
body { font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif; background:#0c3a32; }
button { font:inherit; -webkit-tap-highlight-color:transparent; }
.mh-shell {
  width:100%; min-height:100svh; min-height:100dvh; display:flex; justify-content:center;
  padding:0; overflow:hidden;
  background:
    radial-gradient(ellipse at 50% 38%,#3b8066 0%,#174f43 48%,#082e2a 100%);
}
.mh-cabinet {
  --mh-gap:clamp(3px,.65vh,7px);
  width:min(100%,520px); height:100svh; height:100dvh; min-height:660px;
  max-height:100dvh; display:grid; grid-template-rows:
    minmax(62px,8.5%) minmax(54px,7.5%) minmax(0,1fr)
    minmax(48px,6.5%) minmax(62px,8.5%) minmax(92px,13.5%) minmax(30px,4.5%);
  padding:0 7px env(safe-area-inset-bottom); overflow:hidden; position:relative;
  background:linear-gradient(180deg,#d36e53 0%,#c05e49 55%,#a84b38 100%);
  border-left:3px solid #e5bb79; border-right:3px solid #e5bb79;
  box-shadow:inset 0 0 0 1px #ffe2a4, inset 0 0 26px #6f302b55,0 0 28px #071b18aa;
}
.mh-top {
  min-height:0; position:relative; display:flex; align-items:center; justify-content:space-between;
  padding:0 3%; overflow:hidden; border-bottom:3px solid #d4a15f;
  background:radial-gradient(ellipse at 50% 0%,#e88c66 0%,#cf654d 65%,#a84738 100%);
  box-shadow:inset 0 -5px 0 #793b3022;
}
.mh-title { position:relative; z-index:2; text-align:center; flex:1; }
.mh-title h1 {
  margin:0; color:#ffe4a5; font-family:Georgia,"Noto Sans SC",serif;
  font-size:clamp(23px,6.5vw,34px); font-weight:1000; letter-spacing:.12em;
  text-shadow:0 2px #7a372c,0 0 12px #ffd99377;
}
.mh-title h1 span { margin-left:3px; }
.mh-title small { color:#f8d9a5; font-size:clamp(9px,2.6vw,13px); font-weight:800; letter-spacing:.14em; }
.mh-top-dragon { width:clamp(42px,13vw,72px); height:88%; object-fit:contain; opacity:.96; }
.mh-top-dragon--right { transform:scaleX(-1); }

.mh-multipliers {
  min-height:0; display:grid; grid-template-columns:repeat(4,1fr); align-items:center; text-align:center;
  margin:0 -1px; border-bottom:4px solid #e1b36e;
  background:
    url("./assets/mahjong-hulu2/effects/ui-original/19_green_banner_blank_center_original.png") center/100% 100% no-repeat,
    linear-gradient(180deg,#65bca5,#087366);
  filter:saturate(.96);
}
.mh-multipliers div {
  font-size:clamp(32px,9vw,49px); font-style:italic; font-weight:1000; color:#07564f;
  text-shadow:0 2px 0 #073d37; line-height:1;
}
.mh-multipliers div.is-active {
  color:#ffe18d; transform:translateY(-2px) scale(1.08);
  text-shadow:0 0 10px #fff0a5,0 0 20px #f6ce5c,0 2px 0 #74451d;
}

.mh-reels {
  position:relative; min-height:0; display:grid; grid-template-columns:repeat(5,minmax(0,1fr));
  align-items:stretch; gap:clamp(3px,1vw,7px); padding:clamp(8px,1.8vh,14px) 4.2%;
  overflow:hidden; isolation:isolate;
  background:
    radial-gradient(ellipse at 50% 50%,#dc8268 0%,#c76853 58%,#a74b40 100%);
  border-bottom:5px solid #d9ad6b;
  box-shadow:inset 0 0 20px #6c302a66,inset 0 8px 10px #ffffff14;
}
.mh-reels:before,.mh-reels:after {
  content:""; position:absolute; z-index:0; left:0; right:0; height:5px; pointer-events:none;
  background:linear-gradient(90deg,#89542e,#ffe8a9,#c58a45,#ffe8a9,#89542e);
  box-shadow:0 0 8px #ffe1a0;
}
.mh-reels:before { top:0; } .mh-reels:after { bottom:0; }
.mh-reel {
  position:relative; z-index:1; min-width:0; min-height:0; height:100%;
  display:flex; flex-direction:column; align-items:stretch; justify-content:center;
  gap:var(--mh-gap);
}
.mh-tile {
  flex:0 0 calc((100% - var(--mh-gap) - var(--mh-gap) - var(--mh-gap) - var(--mh-gap)) / 5);
  height:calc((100% - var(--mh-gap) - var(--mh-gap) - var(--mh-gap) - var(--mh-gap)) / 5);
  width:100%; min-width:0; min-height:0; display:flex; align-items:center; justify-content:center;
  overflow:visible; position:relative; background:transparent; border:0; border-radius:0;
}
.mh-tile img {
  display:block; width:100%; height:100%; object-fit:contain; object-position:center;
  filter:drop-shadow(0 3px 2px #56362c66); user-select:none; -webkit-user-drag:none;
}
.mh-tile--gold img { filter:drop-shadow(0 0 6px #ffe17b) drop-shadow(0 3px 2px #56362c66); }
.mh-corner {
  position:absolute; z-index:2; width:18%; height:16%; object-fit:contain;
  opacity:.56; pointer-events:none; filter:drop-shadow(0 2px 4px #793c2d88);
}
.mh-corner--tl { top:1%; left:-1%; }
.mh-corner--tr { top:1%; right:-1%; transform:scaleX(-1); }
.mh-corner--bl { bottom:0; left:-1%; }
.mh-corner--br { bottom:0; right:-1%; transform:scaleX(-1); }

.mh-notice {
  min-height:0; margin:0; padding:0 3%; display:flex; align-items:center; justify-content:space-between;
  gap:6px; overflow:hidden; white-space:nowrap; text-align:center;
  border-top:3px solid #f0ce87; border-bottom:3px solid #f0ce87;
  background:linear-gradient(90deg,#851e30 0%,#b32a3d 48%,#851e30 100%);
  box-shadow:inset 0 2px 4px #ffddab22,inset 0 -2px 4px #4a111d66;
  color:#ffe6b5; text-shadow:0 1px #681a27;
}
.mh-notice strong { font-size:clamp(13px,3.8vw,18px); font-weight:1000; overflow:hidden; text-overflow:ellipsis; }
.mh-notice-flower { flex:none; color:#f8d782; font-size:clamp(16px,4vw,22px); }

.mh-account {
  min-height:0; display:grid; grid-template-columns:1.18fr .68fr 1.18fr;
  gap:clamp(4px,1vw,8px); padding:5px 2% 7px; align-items:stretch;
}
.mh-account-panel {
  min-width:0; position:relative; overflow:hidden; display:flex; flex-direction:column;
  justify-content:center; align-items:center; gap:2px; color:#f4d8a8;
}
.mh-account-panel>img {
  position:absolute; inset:0; z-index:0; width:100%; height:100%; object-fit:fill; pointer-events:none;
}
.mh-account-panel small,.mh-account-panel strong { position:relative; z-index:1; }
.mh-account-panel small { font-size:clamp(10px,2.8vw,13px); color:#e9c8a0; }
.mh-account-panel strong {
  font-size:clamp(14px,4vw,19px); color:#f4ce7f; font-weight:900;
  white-space:nowrap; text-shadow:0 1px 2px #4d2b2266;
}
.mh-account-panel--pg strong { font-size:clamp(20px,6vw,29px); }

.mh-controls {
  min-height:0; display:grid; grid-template-columns:1fr 1fr 1.4fr 1fr 1fr;
  gap:clamp(3px,.8vw,7px); align-items:center; justify-items:center;
  padding:4px 3% 9px; background:linear-gradient(180deg,#c2664d 0%,#a94b37 100%);
  border-top:1px solid #e8b16d;
}
.mh-control,.mh-spin {
  border:0; outline:0; margin:0; padding:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; background:transparent; color:#ffe5b9;
}
.mh-control {
  width:100%; height:100%; max-height:76px; gap:2px; border-radius:18px;
  background:linear-gradient(180deg,#804633,#542a24); border:1px solid #bd8553;
  box-shadow:inset 0 1px 2px #ffe2b044,0 3px 6px #53281f88;
}
.mh-control img { width:70%; height:70%; max-height:54px; object-fit:contain; }
.mh-control small { font-size:clamp(10px,2.8vw,13px); font-weight:900; line-height:1; }
.mh-control:disabled,.mh-spin:disabled { opacity:.62; }
.mh-control.is-selected { box-shadow:0 0 12px #ffe08a88,inset 0 1px 3px #fff5; border-color:#f0ce87; }
.mh-zap { font-size:clamp(28px,8vw,42px); line-height:1; text-shadow:0 0 8px #ffd45b; }
.mh-spin {
  width:min(100%,86px); aspect-ratio:1; border-radius:50%;
  background:radial-gradient(circle at 35% 25%,#b5e5c9,#4cae99 50%,#087466 80%);
  border:6px solid #e3c477; box-shadow:0 0 0 3px #8ca68a,0 0 16px #ffe08a88,0 5px 10px #4e271f88;
  overflow:visible; position:relative;
}
.mh-spin img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 1px 4px #254d3c88); }

.mh-status {
  min-height:0; display:flex; align-items:center; justify-content:space-between;
  padding:0 5%; color:#f1d0a0; background:#954933; font-size:clamp(10px,2.8vw,12px);
}
.mh-status button { display:flex; align-items:center; gap:5px; border:0; padding:2px; color:inherit; background:transparent; }
.mh-status img { width:22px; height:22px; object-fit:contain; }

@media (max-height:740px) {
  .mh-cabinet { min-height:0; grid-template-rows:60px 52px minmax(0,1fr) 44px 58px 88px 28px; }
  .mh-reels { padding-top:6px; padding-bottom:6px; }
  .mh-controls { padding-top:3px; padding-bottom:5px; }
  .mh-control { max-height:68px; }
  .mh-spin { width:min(100%,68px); border-width:5px; }
}
@media (min-width:600px) {
  .mh-cabinet { width:min(90vw,520px); }
  .mh-title h1 { font-size:34px; }
}
@media (prefers-reduced-motion: no-preference) {
  .mh-multipliers div.is-active { animation:mh-active-pulse 1.1s ease-in-out infinite alternate; }
  @keyframes mh-active-pulse { from { filter:brightness(1); } to { filter:brightness(1.2) drop-shadow(0 0 7px #ffe08b); } }
}
</style>
