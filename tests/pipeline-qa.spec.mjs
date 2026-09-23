import {test,expect} from '@playwright/test';
import path from 'node:path';

const fixture=name=>path.resolve('tests/release-assets',name);

async function resetDb(page){
  await page.goto('/index.html');
  await page.evaluate(()=>new Promise(resolve=>{
    const r=indexedDB.deleteDatabase('herbarium.local.v1');
    r.onsuccess=r.onerror=r.onblocked=()=>resolve();
  }));
}

async function analyse(page,file){
  await page.goto('/observe.html');
  await page.locator('#detail').setInputFiles(file);
  await expect(page.locator('#analyse')).toBeEnabled();
  await page.locator('#analyse').click();
  await page.waitForURL(/result\.html\?id=/,{timeout:180000});
  const id=new URL(page.url()).searchParams.get('id');
  const badge=(await page.locator('#resultBadge').textContent())?.trim();
  const stored=await page.evaluate(async id=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('herbarium.local.v1');
    request.onsuccess=()=>{
      const db=request.result,q=db.transaction('observations','readonly').objectStore('observations').get(id);
      q.onsuccess=()=>{resolve(q.result||null);db.close();};
      q.onerror=()=>reject(q.error);
    };
    request.onerror=()=>reject(request.error);
  }),id);
  return{id,badge,stored};
}

test.describe('P0-C complete pipeline regression',()=>{
  test.setTimeout(300000);

  test('real cat is rejected, persists, and stays out of botanical book',async({page})=>{
    await resetDb(page);
    const result=await analyse(page,fixture('cat.png'));
    expect(result.badge).toBe('REJECT');
    expect(result.stored?.status).toBe('REJECT');
    expect(result.stored?.identification?.species).toBeNull();

    await page.reload();
    await expect(page.locator('#resultBadge')).toHaveText('REJECT');

    await page.goto('/collection.html');
    await expect(page.locator('#collectionList')).toContainText(/esclusa|REJECT|Non vegetale/i);

    await page.goto('/book.html');
    await expect(page.locator('#pendingCount')).toHaveText('0');

    await page.goto('/atlas.html');
    await expect(page.locator('#atlasLocatedCount')).toHaveText('0');
  });

  test('blurred real sunflower never becomes REJECT or VERIFIED and persists safely',async({page})=>{
    await resetDb(page);
    const result=await analyse(page,fixture('sunflower-blurred.png'));
    expect(result.badge).toBe('UNKNOWN');
    expect(result.stored?.status).toBe('UNKNOWN');
    expect(result.stored?.analysis?.quality?.usable).toBe(false);
    expect(result.stored?.scientificName??null).toBeNull();

    await page.reload();
    await expect(page.locator('#resultBadge')).toHaveText('UNKNOWN');

    await page.goto('/collection.html');
    await expect(page.locator('#collectionCount')).toHaveText('1');

    await page.goto('/book.html');
    await expect(page.locator('#pendingCount')).toHaveText('1');

    await page.goto('/atlas.html');
    await expect(page.locator('#atlasLocatedCount')).toHaveText('0');
  });
});
