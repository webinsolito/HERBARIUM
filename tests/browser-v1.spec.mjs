import { test, expect } from '@playwright/test';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl9sAAAAASUVORK5CYII=','base64');

async function addPhoto(page,{reject=false}={}){
  await page.goto('/observe.html');
  await page.locator('#detail').setInputFiles({name:'plant.png',mimeType:'image/png',buffer:png});
  if(reject)await page.locator('#negativeSignal').selectOption('object');
  await expect(page.locator('#analyse')).toBeEnabled();
  await Promise.all([
    page.waitForURL(/result\.html\?id=/),
    page.locator('#analyse').click()
  ]);
}

test('V1 complete local flow: UNKNOWN, persist, collection, book, atlas and offline shell',async({page,context,browserName},testInfo)=>{
  await addPhoto(page);
  await expect(page.locator('#resultMainTitle')).toHaveText('Identificazione non disponibile');
  await expect(page.locator('#resultBadge')).toHaveText('UNKNOWN');
  const savedUrl=page.url();

  await page.reload();
  await expect(page.locator('#resultMainTitle')).toHaveText('Identificazione non disponibile');

  await page.goto('/collection.html');
  await expect(page.locator('.observation-card')).toHaveCount(1);
  await expect(page.getByText('Da verificare').first()).toBeVisible();

  await page.goto('/book.html');
  await expect(page.locator('.book-specimen-card')).toHaveCount(1);
  await expect(page.getByText('Determinazione in attesa')).toBeVisible();

  await page.goto('/atlas.html');
  await expect(page.getByText('Atlante vuoto.')).toBeVisible();

  await page.goto('/index.html');
  await page.evaluate(()=>navigator.serviceWorker?.ready);
  await context.setOffline(true);
  await page.goto('/collection.html');
  await expect(page.locator('#collectionList')).toBeVisible();
  await context.setOffline(false);

  await page.goto(savedUrl);
  await expect(page.locator('#resultMainTitle')).toHaveText('Identificazione non disponibile');

  for(const width of [360,390,430]){
    await page.setViewportSize({width,height:844});
    await page.goto('/index.html');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path:testInfo.outputPath(`home-${browserName}-${width}.png`),fullPage:true});
  }
});

test('REJECT never becomes a species',async({page})=>{
  await addPhoto(page,{reject:true});
  await expect(page.locator('#resultMainTitle')).toHaveText('Non associata a una pianta');
  await expect(page.locator('#resultBadge')).toHaveText('REJECT');
  await expect(page.locator('body')).not.toContainText('VERIFIED');
});

test('spoofed and oversized files are blocked before save',async({page})=>{
  await page.goto('/observe.html');
  await page.locator('#detail').setInputFiles({name:'fake.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')});
  await expect(page.locator('#analyse')).toBeDisabled();
  await expect(page.locator('#result')).toContainText('File non valido');

  const huge=Buffer.alloc(12*1024*1024+1);huge[0]=0xff;huge[1]=0xd8;huge[2]=0xff;
  await page.locator('#detail').setInputFiles({name:'huge.jpg',mimeType:'image/jpeg',buffer:huge});
  await expect(page.locator('#analyse')).toBeDisabled();
  await expect(page.locator('#result')).toContainText('File non valido');
});

test('Bellis 3D is explicitly a demo and has WebGL or fallback',async({page})=>{
  await page.goto('/species-bellis-demo.html');
  await expect(page.getByText(/DEMO 3D TECNICA/).first()).toBeVisible();
  const state=await page.locator('#plantCanvas').evaluate(canvas=>({
    gl:!!canvas.getContext('webgl'),
    fallback:getComputedStyle(document.querySelector('#fallback2d')).display
  }));
  expect(state.gl||state.fallback!=='none').toBeTruthy();
});
