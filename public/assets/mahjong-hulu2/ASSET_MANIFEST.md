# Mahjong Hulu 2 — Production Art Asset Manifest

This manifest is the source of truth for the visual asset integration. Do not substitute generated mockups for production cutouts.

## Locked visual reference
- Main game page: warm red + light brown frame, gold dragon/cloud ornament, jade-green slightly curved multiplier ribbon.
- Preserve the reference screenshot's geometry and spacing.
- Tile proportions must remain fixed; use `object-fit: contain` and never stretch tile artwork.
- Dragon artwork is a separate overlay layer. Tune opacity per placement so tile faces remain unobstructed.
- The record/history page is a separate page and must not be merged into the game screen.

## Allowed tile families only
- Bamboo: original green bamboo with red center detail where shown.
- Dots: original purple, green, and red dot combinations.
- Characters: original 万 tiles (including 八萬 as shown).
- Honor tiles: 红中 and 绿發.
- Special symbols: 百搭 / wild, 胡, and the gold-highlighted versions shown in the supplied reference.
- Do not add 东、南、西、北风 tiles or any unreferenced tile family.

## Asset directory and naming
Place production PNGs under `public/assets/mahjong-hulu2/`:

| File | Purpose |
|---|---|
| `tiles/bamboo-*.png` | Individual bamboo tile faces |
| `tiles/dots-*.png` | Individual dot tile faces |
| `tiles/characters-*.png` | Individual character tile faces |
| `tiles/hong-zhong.png` | Red 中 tile |
| `tiles/green-fa.png` | Green 發 tile |
| `tiles/wild.png` | 百搭 tile |
| `tiles/hu.png` | 胡 special symbol |
| `tiles/gold-*.png` | Gold-highlighted tile variants |
| `frame/red-brown-frame.png` | Main warm red/light-brown frame |
| `ornaments/dragon-left.png`, `dragon-right.png` | Separate dragon overlays |
| `ornaments/cloud-left.png`, `cloud-right.png` | Separate cloud overlays |
| `header/2000-ways-title.png` | 2000-way title ornament |
| `header/jade-multiplier-ribbon.png` | Jade-green gently curved multiplier ribbon |
| `header/multiplier-x1.png` … `multiplier-x5.png` | Independent multiplier labels |
| `panels/win-message.png` | Red/gold win-message plaque |
| `controls/*.png` | Balance, bet, spin, plus/minus, turbo, auto controls |
| `effects/*.png` | Win glow, gold flash, tile clear, cascade, coin particles |

## Export requirements
- PNG with a real alpha channel for all overlays and isolated elements.
- A checkerboard preview is not transparency; verify alpha before integration.
- Remove no attribution or watermark from third-party source artwork. If a supplied image has a baked-in generator mark, recreate that artwork cleanly from the user's reference rather than erasing the mark.
- Keep a high-resolution master and export @2x/@3x variants where useful.
- Keep all tile face canvases on one shared aspect ratio and identical pixel dimensions.
- Do not crop away tile shadows, bevels, or corner radii.
- Keep the original warm red/light-brown palette; do not shift the frame to gray or dark coffee.
- Dragon opacity is configured at the layer level, not baked into the source PNG.

## Integration acceptance checks
1. Compare against the supplied reference at the same viewport ratio.
2. Confirm every tile has identical width/height ratio and no distortion.
3. Confirm no wind tiles appear in code, assets, or random tile generation.
4. Confirm each image has a true alpha channel where required.
5. Confirm dragon overlays do not cover tile faces or text.
6. Confirm the history/record page remains independent.
7. Confirm iPhone Safari scaling preserves the tile aspect ratio.
