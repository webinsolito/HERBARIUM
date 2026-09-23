import { test, expect } from '@playwright/test';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9QzwAEYBxVSFUAANgABf6O40YAAAAASUVORK5CYII=','base64');
const viewports=[{width:360,height:780},{width:390,height:844},{width:430,height:932}];

for(const viewport of viewports){
  test.describe(`mobile ${viewport.width}px`,()=>{
    test.use({viewport});

    test('home and core pages do not overflow horizontally',async({page})=>{
      for(const path of ['index.html','observe.html','collection.html','book.html','atlas.html','academy.html']){
        await page.goto('/'+path);
        await expect(page.locator('body')).toBeVisible();
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
      }
    });

    test('valid image -> UNKNOWN -> result -> collection persists',async({page})=>{
      await page.goto('/observe.html');
      await page.locator('#detail').setInputFiles({name:'leaf.png',mimeType:'image/png',buffer:png});
      await expect(page.locator('#analyse')).toBeEnabled();
      await page.locator('#analyse').click();
      await page.waitForURL(/result\.html\?id=/);
      await expect(page.locator('#resultBadge')).toHaveText('UNKNOWN');
      await expect(page.locator('#resultMainTitle')).toContainText('Identificazione non disponibile');
      await page.reload();
      await expect(page.locator('#resultBadge')).toHaveText('UNKNOWN');
      await page.goto('/collection.html');
      await expect(page.locator('.observation-card')).toHaveCount(1);
      await expect(page.locator('.human-status')).toContainText('Da verificare');
      await page.goto('/book.html');
      await expect(page.locator('.book-specimen-card')).toHaveCount(1);
      await page.goto('/atlas.html');
      await expect(page.locator('#atlasLocatedCount')).toHaveText('0');
    });

    test('manual negative signal stays REJECT and never becomes species',async({page})=>{
      await page.goto('/observe.html');
      await page.locator('#detail').setInputFiles({name:'object.png',mimeType:'image/png',buffer:png});
      await page.locator('details.advanced-check summary').click();
      await expect(page.locator('#negativeSignal')).toBeVisible();
      await page.locator('#negativeSignal').selectOption('object');
      await page.locator('#analyse').click();
      await page.waitForURL(/result\.html\?id=/);
      await expect(page.locator('#resultBadge')).toHaveText('REJECT');
      await expect(page.locator('#resultMainTitle')).toContainText('Non associata');
      await expect(page.locator('#resultCopy')).not.toContainText(/Bellis|Rosa|Lavandula/i);
    });

    test('spoofed non-image is rejected before save',async({page})=>{
      await page.goto('/observe.html');
      await page.locator('#detail').setInputFiles({name:'fake.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not-an-image')});
      await expect(page.locator('#analyse')).toBeDisabled();
      await expect(page.locator('#result')).toContainText('File non valido');
    });

    test('oversized image is rejected before save',async({page})=>{
      await page.goto('/observe.html');
      const oversized=Buffer.alloc(12*1024*1024+1);
      oversized[0]=0xff;oversized[1]=0xd8;oversized[2]=0xff;
      await page.locator('#detail').setInputFiles({name:'huge.jpg',mimeType:'image/jpeg',buffer:oversized});
      await expect(page.locator('#analyse')).toBeDisabled();
      await expect(page.locator('#result')).toContainText('File non valido');
    });

    test('collection deletion removes observation persistently',async({page})=>{
      await page.goto('/observe.html');
      await page.locator('#detail').setInputFiles({name:'delete.png',mimeType:'image/png',buffer:png});
      await page.locator('#analyse').click();
      await page.waitForURL(/result\.html\?id=/);
      await page.goto('/collection.html');
      await expect(page.locator('.observation-card')).toHaveCount(1);
      page.once('dialog',dialog=>dialog.accept());
      await page.locator('.observation-delete').click();
      await expect(page.locator('.observation-card')).toHaveCount(0);
      await page.reload();
      await expect(page.locator('.observation-card')).toHaveCount(0);
    });

    test('service worker shell is cached; Chromium also reopens it offline',async({page,context,browserName})=>{
      await page.goto('/index.html');
      await page.evaluate(()=>navigator.serviceWorker?.ready);
      await page.goto('/collection.html');
      const cached=await page.evaluate(async()=>{
        const names=await caches.keys();
        const cache=await caches.open(names.find(n=>n.startsWith('herbarium-v1-shell-'))||'herbarium-v1-shell-1');
        return Boolean(await cache.match('./collection.html'));
      });
      expect(cached).toBe(true);
      if(browserName==='chromium'){
        await context.setOffline(true);
        await page.reload({waitUntil:'domcontentloaded'});
        await expect(page.locator('#collectionTitle')).toBeVisible();
        await context.setOffline(false);
      }
    });
  });
}

test('Bellis demo is explicitly technical, not recognition',async({page})=>{
  await page.goto('/species-bellis-demo.html');
  await expect(page.getByText(/DEMO 3D TECNICA/i).first()).toBeVisible();
  await expect(page.locator('#plantCanvas')).toBeVisible();
  await expect(page.getByText(/non.*riconoscimento/i).first()).toBeVisible();
});


test('Bellis demo exposes a visible fallback when WebGL is unavailable',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==='webgl'||type==='webgl2')return null;
      return original.call(this,type,...args);
    };
  });
  await page.goto('/species-bellis-demo.html');
  await expect(page.locator('#fallback2d')).toBeVisible();
  await context.close();
});
