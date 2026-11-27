import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("iPhone reference layout, real artwork and 20 consecutive game rounds", async ({ page }) => {
  const pageErrors:string[]=[];
  page.on("pageerror",error=>pageErrors.push(error.message));
  await page.addInitScript(()=>{
    let state=0x20261127;
    Math.random=()=>{
      state=(state*1664525+1013904223)>>>0;
      return state/0x100000000;
    };
  });
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/?qa=1");

  const frame=page.getByTestId("game-frame");
  const board=page.locator(".reels");
  await expect(frame).toBeVisible();
  await expect(page.locator(".reel")).toHaveCount(5);
  await expect(page.locator(".tile")).toHaveCount(23);

  const shape=async()=>page.locator(".reel").evaluateAll(nodes=>
    nodes.map(node=>node.querySelectorAll(".tile").length)
  );
  expect(await shape()).toEqual([4,5,5,5,4]);

  // Capture every visual iteration before geometry assertions, including failed iterations.
  await mkdir("test-results",{recursive:true});
  await page.screenshot({path:"test-results/mahjong-iphone-reference.png",fullPage:true});

  const dimensions=await frame.evaluate(node=>{
    const r=node.getBoundingClientRect();
    return {width:r.width,height:r.height,ratio:r.width/r.height};
  });
  expect(dimensions.ratio).toBeGreaterThan(0.52);
  expect(dimensions.ratio).toBeLessThan(0.61);

  await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete));
  const brokenImages=await page.locator("img").evaluateAll(images=>
    images.filter(image=>{
      const node=image as HTMLImageElement;
      return node.getAttribute("src")&&node.naturalWidth===0;
    }).map(image=>(image as HTMLImageElement).src)
  );
  expect(brokenImages).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);

  const assetPaths=[
    "normal/tile-fa.png","normal/tile-zhong.png","normal/tile-frame.png","normal/tile-wan.png",
    "normal/tile-bamboo-five.png","normal/tile-two-bamboo.png","normal/tile-two-dots.png",
    "gold/tile-gold-fa.png","gold/tile-gold-zhong.png","gold/tile-gold-frame.png",
    "gold/tile-gold-wan.png","gold/tile-gold-bamboo.png","gold/tile-gold-two-bamboo.png",
    "gold/tile-gold-two-dots.png","gold/tile-gold-dots.png"
  ];
  for(const path of assetPaths){
    const response=await page.request.get("/assets/mahjong-hulu2/effects/tiles/"+path);
    expect(response.ok(),path).toBe(true);
  }

  const boardSize=await board.evaluate(node=>{
    const r=node.getBoundingClientRect();
    return {top:r.top,height:r.height};
  });
  const tileSize=await page.locator(".reel:not(.edge-reel) .tile").first().evaluate(node=>{
    const r=node.getBoundingClientRect();
    return {width:r.width,height:r.height};
  });
  console.log("VISUAL_GEOMETRY",JSON.stringify({
    frame:dimensions,board:boardSize,
    boardRatio:boardSize.height/dimensions.height,
    tile:tileSize,tileAspect:tileSize.height/tileSize.width,
    tileToBoard:tileSize.height/boardSize.height
  }));
  expect(boardSize.height/dimensions.height).toBeGreaterThan(0.46);
  expect(tileSize.height/boardSize.height).toBeGreaterThan(0.145);
  expect(tileSize.height/tileSize.width).toBeGreaterThan(1.13);

  const sideAlignment=await page.locator(".reel").evaluateAll(nodes=>{
    const boxes=nodes.map(node=>{
      const rect=node.getBoundingClientRect();
      return {top:rect.top,height:rect.height};
    });
    const center=boxes[2].top+boxes[2].height/2;
    return Math.max(
      Math.abs(boxes[0].top+boxes[0].height/2-center),
      Math.abs(boxes[4].top+boxes[4].height/2-center)
    );
  });
  expect(sideAlignment).toBeLessThan(14);


  // Rules panel must be reachable from the title and expose the 2,000-ways feature.
  await page.locator(".top-banner-caption").click();
  await expect(page.getByRole("dialog")).toContainText("2,000种中奖组合");
  await page.getByRole("button",{name:"关闭"}).click();

  for(let round=1;round<=20;round++){
    await page.getByTestId("spin").click();
    await expect(frame).toHaveAttribute("data-round",String(round),{timeout:20000});
    await expect(page.locator(".reel")).toHaveCount(5);
    await expect(page.locator(".tile")).toHaveCount(23);
    expect(await shape()).toEqual([4,5,5,5,4]);
  }
  expect(pageErrors).toEqual([]);
});
