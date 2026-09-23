import {test,expect} from '@playwright/test';

const pages=['index','observe','collection','book','atlas','academy'];
for(const width of [360,390,430]){
  test(`mobile shell ${width}px has no horizontal overflow`,async({page})=>{
    await page.setViewportSize({width,height:844});
    for(const name of pages){
      await page.goto(`/${name}.html`);
      await expect(page.locator('html')).toBeVisible();
      const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+1);
    }
  });
}

test('offline cache baseline is readable; Chromium navigation reopens shell',async({page,context,browserName})=>{
  await page.goto('/index.html');
  await expect(page.locator('body')).toBeVisible();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;return true;});
  await page.reload();

  const cached=await page.evaluate(async()=>{
    const response=await caches.match('./collection.html');
    return Boolean(response&&response.ok);
  });
  expect(cached).toBe(true);

  await context.setOffline(true);
  if(browserName==='webkit'){
    const readable=await page.evaluate(async()=>{
      const response=await caches.match('./collection.html');
      return response?await response.text():null;
    });
    expect(readable).toContain('collectionList');
  }else{
    await page.goto('/collection.html');
    await expect(page.locator('body')).toBeVisible();
  }
  await context.setOffline(false);
});

test('observe controls are labelled and touch-sized',async({page})=>{
  await page.goto('/observe.html');
  for(const id of ['whole','detail','flower','leaf']){
    const input=page.locator('#'+id);await expect(input).toHaveAttribute('accept','image/*');
  }
  const button=page.locator('#analyse'),box=await button.boundingBox();
  expect(box?.height||0).toBeGreaterThanOrEqual(40);
  await expect(page.locator('#result')).toHaveAttribute('aria-live','polite');
});

test('CSP stays restrictive while allowing WASM only',async({page})=>{
  await page.goto('/observe.html');
  const csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("'wasm-unsafe-eval'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("object-src 'none'");
});

test('empty product surfaces remain safe and non-fictional',async({page})=>{
  for(const [path,text] of [['/collection.html','raccolta'],['/book.html','osserv'],['/atlas.html','Atlante'],['/academy.html','Nessun corso fittizio']]){
    await page.goto(path);await expect(page.locator('body')).toContainText(new RegExp(text,'i'));
  }
});
