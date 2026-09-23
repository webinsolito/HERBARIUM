import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  testMatch:'p0a-model.spec.mjs',
  timeout:240000,
  expect:{timeout:15000},
  fullyParallel:false,
  workers:1,
  retries:0,
  use:{baseURL:'http://127.0.0.1:8080',serviceWorkers:'allow',trace:'retain-on-failure',screenshot:'only-on-failure',viewport:{width:390,height:844}},
  projects:[
    {name:'chromium',use:{browserName:'chromium'}},
    {name:'webkit',use:{browserName:'webkit'}}
  ],
  reporter:[['line']]
});
