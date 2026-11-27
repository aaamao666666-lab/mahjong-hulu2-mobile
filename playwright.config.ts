import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",
  timeout:120000,
  expect:{timeout:15000},
  fullyParallel:false,
  workers:1,
  reporter:"list",
  use:{
    baseURL:"http://127.0.0.1:4173",
    browserName:"chromium",
    viewport:{width:390,height:844},
    screenshot:"only-on-failure"
  },
  webServer:{
    command:"npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url:"http://127.0.0.1:4173",
    reuseExistingServer:false,
    timeout:120000
  }
});
