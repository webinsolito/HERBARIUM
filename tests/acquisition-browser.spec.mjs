import { test, expect } from '@playwright/test';

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3QUAAAAASUVORK5CYII=','base64');

test('prepared handoff survives WebKit without rewriting input.files', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await expect.poll(()=>page.evaluate(()=>window.__guardResult?.transport)).toBe('memory-handoff');
  await input.setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:PNG});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(1);
  const state=await page.evaluate(()=>window.__acqTest);
  expect(state.ready).toBe(1);
  expect(state.error).toBe(0);
  expect(state.handoffs[0]).not.toBeNull();
  expect(state.handoffs[0].size).toBeGreaterThan(0);
});

test('duplicate native change burst produces one prepared downstream event', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await input.setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:PNG});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(1);
  await page.evaluate(()=>{
    const input=document.querySelector('#photo');
    input.dispatchEvent(new Event('change',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.downstream)).toBe(2);
  const state=await page.evaluate(()=>window.__acqTest);
  expect(state.ready).toBe(2);
  expect(state.downstream).toBe(2);
});

test('invalid acquisition resets input and never reaches runtime', async ({ page }) => {
  await page.goto('/tests/acquisition-browser-harness.html');
  const input=page.locator('#photo');
  await input.setInputFiles({name:'not-image.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
  await expect.poll(()=>page.evaluate(()=>window.__acqTest.error)).toBe(1);
  expect(await page.evaluate(()=>document.querySelector('#photo').files.length)).toBe(0);
  expect(await page.evaluate(()=>window.__acqTest.downstream)).toBe(0);
});

test('canonical mobile flow accepts library input and preserves UNKNOWN-safe save', async ({ page }) => {
  const pageErrors=[];
  page.on('pageerror',err=>{pageErrors.push(err.message);console.log('PAGEERROR',err.message)});
  page.on('console',msg=>{if(msg.type()==='error')console.log('CONSOLE_ERROR',msg.text())});
  await page.goto('/app/index.html');
  const frame=page.frameLocator('#runtimeFrame');
  const input=frame.locator('#captureGrid input[data-role="whole"]');
  await expect(input).toHaveAttribute('accept','image/*');
  await expect(input).not.toHaveAttribute('capture',/.+/);
  await input.setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:PNG});
  await page.waitForTimeout(700);
  const debug=await frame.locator('body').evaluate(()=>({
    acquisition:document.querySelector('#acquisitionStatus')?.textContent||'',
    toast:document.querySelector('#toast')?.textContent||'',
    hasApi:!!window.HerbariumAcquisition,
    thumbs:document.querySelectorAll('#captureGrid img.thumb').length
  }));
  console.log('CANONICAL_DEBUG',JSON.stringify({...debug,pageErrors}));
  expect(debug.hasApi).toBe(true);
  expect(debug.acquisition).toMatch(/verificata|ottimizzata/i);
  await expect(frame.locator('#captureGrid img.thumb')).toHaveCount(1);
  const save=frame.locator('#saveObsBtn');
  await expect(save).toContainText(/Salva osservazione/);
  await expect(save).not.toContainText(/specie verificata/i);
  await expect(frame.locator('#subjectGateCard')).toBeVisible();
});
