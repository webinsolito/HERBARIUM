import {test,expect} from '@playwright/test';
import path from 'node:path';

const assets=id=>path.resolve('tests/p0a-assets',id);

async function clearDb(page){
  await page.goto('/observe.html');
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
  await page.waitForURL(/result\.html\?id=/,{timeout:120000});
  return (await page.locator('#resultBadge').textContent())?.trim();
}

test.describe('P0-A real model gate',()=>{
  test.setTimeout(240000);

  test('cat and person are conservatively rejected; sunflower is not',async({page})=>{
    await clearDb(page);
    const cat=await analyse(page,assets('cat.png'));
    expect(cat).toBe('REJECT');

    await clearDb(page);
    const person=await analyse(page,assets('grace_hopper.png'));
    expect(person).toBe('REJECT');

    await clearDb(page);
    const sunflower=await analyse(page,assets('sunflower.png'));
    expect(sunflower).toBe('UNKNOWN');
  });

  test('additional real negatives never become a species',async({page})=>{
    for(const file of ['bird.png','hot_dog.jpg']){
      await clearDb(page);
      const result=await analyse(page,assets(file));
      expect(['REJECT','UNKNOWN']).toContain(result);
      await expect(page.locator('#resultMainTitle')).not.toContainText(/Bellis|Rosa|Lavandula/i);
    }
  });
});
