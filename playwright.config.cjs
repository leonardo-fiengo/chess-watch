const { defineConfig } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const cache = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const installed = fs.existsSync(cache) ? fs.readdirSync(cache).filter(x=>/^chromium-\d+$/.test(x)).sort().reverse()[0] : null;
const executablePath = process.env.CHROMIUM_PATH || (installed ? path.join(cache,installed,'chrome-win64','chrome.exe') : undefined);
module.exports = defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://127.0.0.1:4173',headless:true,launchOptions:executablePath ? {executablePath} : {},screenshot:'only-on-failure'},
  webServer:{command:'node tools/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:true,timeout:15000}
});
