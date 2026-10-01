import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3QUAAAAASUVORK5CYII=','base64');
const FIXTURES=JSON.parse(readFileSync(new URL('./fixtures/subject-fixtures.json',import.meta.url),'utf8')).fixtures;

async function fixturePng(page,id){
  const fixture=FIXTURES.find(x=>x.id===id);if(!fixture)throw new Error(`missing fixture ${id}`);
  const base64=await page.evaluate(spec=>{
    const canvas=document.createElement('canvas');canvas.width=spec.width;canvas.height=spec.height;
    const ctx=canvas.getContext('2d'),image=ctx.createImageData(spec.width,spec.height);
    const rgb=(x,y)=>{
      if(spec.pattern==='green-cloth')return (x+y)%7===0?[50,143,62]:[49,142,61];
      if(spec.pattern==='blue-screen')return (x+y)%9===0?[43,69,186]:[45,70,190];
      const nx=(x-spec.width/2)/(spec.width*.43),ny=(y-spec.height/2)/(spec.height*.18);
      const nx2=(x-spec.width*.46)/(spec.width*.18),ny2=(y-spec.height*.52)/(spec.height*.42);
      const leaf=nx*nx+ny*ny<1||nx2*nx2+ny2*ny2<1;
      if(!leaf)return (x+y)%11===0?[205,190,154]:[226,216,184];
      return (x*3+y*5)%13<6?[30,126,48]:[76,174,72];
    };
    for(let y=0;y<spec.height;y++)for(let x=0;x<spec.width;x++){const [r,g,b]=rgb(x,y),i=(y*spec.width+x)*4;image.data.set([r,g,b,255],i)}
    ctx.putImageData(image,0,0);return canvas.toDataURL('image/png').split(',')[1];
  },fixture);
  return Buffer.from(base64,'base64');
}

async function openField(page){
  await page.goto('/app/index.html');
  const frame=page.frameLocator('#runtimeFrame');
  await frame.locator('[data-go="field"]').first().click();
  await expect(frame.locator('#field')).toHaveClass(/active/);
  return frame;
}

test('prepared handoff survives WebKit without rewriting input.files', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await expect.poll(()=>page.evaluate(()=>window.__guardResult?.transport)).toBe('memory-handoff');
  await input.setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:PNG});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(1);
  const state=await page.evaluate(()=>window.__acqTest);
  expect(state.ready).toBe(1); expect(state.error).toBe(0); expect(state.handoffs[0]).not.toBeNull(); expect(state.handoffs[0].size).toBeGreaterThan(0);
});

test('duplicate native change burst produces one prepared downstream event', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await input.setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:PNG});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(1);
  await page.evaluate(()=>{const input=document.querySelector('#photo');input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(2);
  const state=await page.evaluate(()=>window.__acqTest); expect(state.ready).toBe(2); expect(state.downstream).toBe(2);
});

test('invalid acquisition resets input and never reaches runtime', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await input.setInputFiles({name:'not-image.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.error)).toBe(1);
  expect(await page.evaluate(()=>document.querySelector('#photo').files.length)).toBe(0); expect(await page.evaluate(()=>window.__acqTest.downstream)).toBe(0);
});

test('canonical mobile flow accepts library input and preserves UNKNOWN-safe save', async ({ page }) => {
  const frame=await openField(page);
  const input=frame.locator('#captureGrid input[data-role="whole"]');
  await expect(input).toHaveAttribute('accept','image/*'); await expect(input).not.toHaveAttribute('capture',/.+/);
  await input.setInputFiles({name:'plant-fixture.png',mimeType:'image/png',buffer:await fixturePng(page,'plant_leaf_cluster')});
  await expect(frame.locator('#captureGrid img.thumb')).toHaveCount(1);
  await expect.poll(()=>frame.locator('#saveObsBtn').getAttribute('data-subject-source')).not.toBe('unavailable');
  console.log('plant fixture evidence',await frame.locator('#saveObsBtn').evaluate(el=>({...el.dataset})));
  await expect(frame.locator('#subjectGateCard')).toHaveAttribute('data-subject-status','plant');
  const save=frame.locator('#saveObsBtn'); await expect(save).toContainText(/UNKNOWN/); await expect(save).toBeEnabled(); await expect(save).not.toContainText(/specie verificata/i);
});

test('green non-plant fixture is REJECTED and cannot enter the collection', async ({ page }) => {
  const frame=await openField(page),input=frame.locator('#captureGrid input[data-role="whole"]');
  await input.setInputFiles({name:'green-cloth.png',mimeType:'image/png',buffer:await fixturePng(page,'nonplant_green_cloth')});
  await expect.poll(()=>frame.locator('#saveObsBtn').getAttribute('data-subject-source')).not.toBe('unavailable');
  console.log('green cloth evidence',await frame.locator('#saveObsBtn').evaluate(el=>({...el.dataset})));
  await expect(frame.locator('#subjectGateCard')).toHaveAttribute('data-subject-status','non-plant');
  await expect(frame.locator('.subject-stamp')).toHaveText('REJECT');
  await expect(frame.locator('#saveObsBtn')).toBeDisabled();
  await expect(frame.locator('#saveObsBtn')).toContainText(/respinta/i);
  await frame.locator('.nav [data-go="book"]').click();
  await expect(frame.locator('#pendingList [data-open-obs]')).toHaveCount(0);
});

test('UNKNOWN observation persists across reload, stays pending, and can be deleted', async ({ page }) => {
  const frame=await openField(page);
  const input=frame.locator('#captureGrid input[data-role="whole"]');
  await input.setInputFiles({name:'plant-fixture.png',mimeType:'image/png',buffer:await fixturePng(page,'plant_leaf_cluster')});
  await expect(frame.locator('#captureGrid img.thumb')).toHaveCount(1);
  const save=frame.locator('#saveObsBtn');
  await expect(save).toBeEnabled(); await save.click();
  await expect(frame.locator('#book')).toHaveClass(/active/);
  await expect(frame.locator('#pendingList [data-open-obs]')).toHaveCount(1);
  await expect(frame.locator('#bookPages [data-open-obs]')).toHaveCount(0);
  await page.reload();
  const reloaded=page.frameLocator('#runtimeFrame');
  await reloaded.locator('[data-go="book"]').first().click();
  await expect(reloaded.locator('#pendingList [data-open-obs]')).toHaveCount(1);
  await expect(reloaded.locator('#bookPages [data-open-obs]')).toHaveCount(0);
  await reloaded.locator('#pendingList [data-open-obs]').first().click();
  await expect(reloaded.locator('#observationDetail')).not.toHaveClass(/hidden/);
  await expect(reloaded.locator('#obsDetailBody')).toContainText(/UNKNOWN/);
  await expect(reloaded.locator('#obsDetailBody')).toContainText(/Gate soggetto/);
  page.on('dialog',dialog=>dialog.accept());
  await reloaded.locator('#deleteObsDetail').click();
  await expect(reloaded.locator('#pendingList [data-open-obs]')).toHaveCount(0);
  await page.reload();
  const finalFrame=page.frameLocator('#runtimeFrame'); await finalFrame.locator('[data-go="book"]').first().click();
  await expect(finalFrame.locator('#pendingList [data-open-obs]')).toHaveCount(0);
  await expect(finalFrame.locator('#statSpecies')).toHaveText('0');
});

test('corrupt image is rejected before analysis and leaves no saveable state', async ({ page }) => {
  const frame=await openField(page),input=frame.locator('#captureGrid input[data-role="whole"]');
  await input.setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not-a-real-png')});
  await expect(frame.locator('#acquisitionStatus')).toContainText(/non leggibile/i);
  await expect(frame.locator('#captureGrid img.thumb')).toHaveCount(0);
  await expect(frame.locator('#saveObsBtn')).toBeDisabled();
});

test('installed shell precaches the complete runtime for offline use', async ({ page }) => {
  await page.goto('/app/index.html');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  let cached=null;
  await expect.poll(async()=>{try{cached=await page.evaluate(async()=>{const response=await caches.match('./runtime.html?offline-probe=1',{ignoreSearch:true});return response&&{ok:response.ok,status:response.status,text:(await response.text()).slice(0,80)}});return cached?.ok===true&&cached?.status===200}catch{return false}},{timeout:8000}).toBe(true);
  expect(cached.text).toContain('<!doctype html>');
});

for (const width of [390, 430]) {
  test(`premium shell is usable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/app/index.html');
    const frame=page.frameLocator('#runtimeFrame');
    await expect(frame.locator('.hero')).toBeVisible();
    await expect(page.locator('#boot')).toHaveClass(/ready/);
    await page.waitForTimeout(220);
    await expect(page.locator('#boot')).toBeHidden();
    await expect(frame.locator('.nav')).toBeVisible();
    await expect(frame.locator('.nav .ui-icon')).toHaveCount(5);
    await expect(frame.locator('#settingsBtn .ui-icon')).toHaveCount(1);
    await expect(frame.locator('html')).toHaveCSS('overflow-x', 'visible');
    const overflow=await frame.locator('body').evaluate(body=>body.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    mkdirSync('artifacts',{recursive:true});
    await page.screenshot({path:`artifacts/herbarium-${width}.png`,fullPage:true});
  });
}
