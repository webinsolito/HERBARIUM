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
  const badge=(await page.locator('#resultBadge').textContent())?.trim();
  const gate=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('herbarium.local.v1');
    request.onsuccess=()=>{
      const db=request.result;
      const tx=db.transaction('observations','readonly');
      const q=tx.objectStore('observations').getAll();
      q.onsuccess=()=>{const items=q.result||[];resolve(items.at(-1)?.analysis?.automaticGate||null);db.close();};
      q.onerror=()=>reject(q.error);
    };
    request.onerror=()=>reject(request.error);
  }));
  console.log('P0A_DIAG',file,badge,JSON.stringify(gate));
  return {badge,gate};
}

test.describe('P0-A real model gate',()=>{
  test.setTimeout(240000);

  test('cat and person are conservatively rejected; sunflower is not',async({page})=>{
    await clearDb(page);
    const cat=await analyse(page,assets('cat.png'));
    expect(cat.badge,JSON.stringify(cat.gate)).toBe('REJECT');

    await clearDb(page);
    const person=await analyse(page,assets('grace_hopper.png'));
    expect(person.badge,JSON.stringify(person.gate)).toBe('REJECT');

    await clearDb(page);
    const sunflower=await analyse(page,assets('sunflower.png'));
    expect(sunflower.gate?.status,JSON.stringify(sunflower.gate)).not.toBe('REJECT');
    expect(['UNKNOWN','PROPOSTA']).toContain(sunflower.badge);
  });

  test('additional real negatives never become a species',async({page})=>{
    for(const file of ['bird.png','hot_dog.jpg']){
      await clearDb(page);
      const result=await analyse(page,assets(file));
      expect(['REJECT','UNKNOWN']).toContain(result.badge);
      await expect(page.locator('#resultMainTitle')).not.toContainText(/Bellis|Rosa|Lavandula/i);
    }
  });
});
