import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  testMatch:'browser-v1.spec.mjs',
  timeout:45000,
  expect:{timeout:8000},
  fullyParallel:false,
  workers:1,
  retries:0,
  use:{baseURL:'http://127.0.0.1:8080',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'chromium',use:{browserName:'chromium',viewport:{width:390,height:844},hasTouch:true,isMobile:true}},
    {name:'webkit',use:{browserName:'webkit',viewport:{width:390,height:844},hasTouch:true,isMobile:true}}
  ],
  reporter:[['line']]
});
