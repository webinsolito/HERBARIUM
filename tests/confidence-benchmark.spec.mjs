import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const plantDir=path.resolve('tests/benchmark-assets/plants');
const negDir=path.resolve('tests/benchmark-assets/negatives');
const plantClasses=['daisy','dandelion','roses','sunflowers','tulips'];
const negativeFiles=['cat.png','bird.png','grace_hopper.png','hot_dog.jpg','tablecloth.jpg','floral_print.jpg','laptop_screen.png'];
const PLANTS_PER_CLASS=4;

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
  const started=Date.now();
  await page.locator('#analyse').click();
  await page.waitForURL(/result\.html\?id=/,{timeout:180000});
  const elapsedMs=Date.now()-started;
  const id=new URL(page.url()).searchParams.get('id');
  const stored=await page.evaluate(id=>new Promise((resolve,reject)=>{
    const r=indexedDB.open('herbarium.local.v1');
    r.onsuccess=()=>{
      const db=r.result,q=db.transaction('observations','readonly').objectStore('observations').get(id);
      q.onsuccess=()=>{resolve(q.result||null);db.close();};
      q.onerror=()=>reject(q.error);
    };
    r.onerror=()=>reject(r.error);
  }),id);
  return {elapsedMs,item:stored};
}

function pickPlants(){
  const out=[];
  for(const cls of plantClasses){
    const files=fs.readdirSync(path.join(plantDir,cls)).filter(x=>/\.jpe?g$/i.test(x)).sort().slice(0,PLANTS_PER_CLASS);
    for(const file of files)out.push({kind:'plant',className:cls,file:path.join(plantDir,cls,file)});
  }
  return out;
}

function rate(n,d){return d?Number((n/d).toFixed(4)):null;}

test.describe('HERBARIUM confidence/reject benchmark',()=>{
  test.setTimeout(1200000);

  test('separated benchmark reports false-species, reject and recognition yield',async({page})=>{
    const samples=[
      ...pickPlants(),
      ...negativeFiles.map(file=>({kind:'negative',className:'negative',file:path.join(negDir,file)}))
    ];
    expect(samples.filter(x=>x.kind==='plant')).toHaveLength(plantClasses.length*PLANTS_PER_CLASS);
    expect(samples.filter(x=>x.kind==='negative')).toHaveLength(negativeFiles.length);

    const rows=[];
    for(const sample of samples){
      await clearDb(page);
      const result=await analyse(page,sample.file);
      const item=result.item;
      rows.push({kind:sample.kind,sourceClass:sample.className,file:path.basename(sample.file),status:item?.status||null,scientificName:item?.scientificName||null,quality:item?.analysis?.quality?.status||null,nonPlant:item?.analysis?.automaticGate?.status||null,speciesEngine:item?.analysis?.speciesEngine?.status||null,speciesReason:item?.analysis?.speciesEngine?.reason||null,consensus:item?.analysis?.speciesEngine?.consensus??null,rawScore:item?.analysis?.speciesEngine?.rawScore??null,margin:item?.analysis?.speciesEngine?.margin??null,elapsedMs:result.elapsedMs});
    }

    const plants=rows.filter(x=>x.kind==='plant');
    const negatives=rows.filter(x=>x.kind==='negative');
    const plantRejectCount=plants.filter(x=>x.status==='REJECT').length;
    const plantProposalCount=plants.filter(x=>x.status==='PROPOSED').length;
    const plantUnknownCount=plants.filter(x=>x.status==='UNKNOWN').length;
    const negativeRejectCount=negatives.filter(x=>x.status==='REJECT').length;
    const negativeUnknownCount=negatives.filter(x=>x.status==='UNKNOWN').length;
    const negativeFalseSpeciesCount=negatives.filter(x=>x.status==='PROPOSED'||x.status==='VERIFIED'||x.scientificName).length;
    const disagreementCount=plants.filter(x=>x.speciesReason==='cross-dataset-model-disagreement').length;
    const weakTop1Count=plants.filter(x=>x.speciesReason==='weak-top1').length;
    const report={generatedAt:new Date().toISOString(),sampleCount:rows.length,plantCount:plants.length,negativeCount:negatives.length,plantRejectCount,plantRejectRate:rate(plantRejectCount,plants.length),plantProposalCount,plantProposalRate:rate(plantProposalCount,plants.length),plantUnknownCount,plantUnknownRate:rate(plantUnknownCount,plants.length),disagreementCount,disagreementRate:rate(disagreementCount,plants.length),weakTop1Count,weakTop1Rate:rate(weakTop1Count,plants.length),negativeRejectCount,negativeRejectRate:rate(negativeRejectCount,negatives.length),negativeUnknownCount,negativeUnknownRate:rate(negativeUnknownCount,negatives.length),negativeFalseSpeciesCount,negativeFalseSpeciesRate:rate(negativeFalseSpeciesCount,negatives.length),automaticVerifiedCount:rows.filter(x=>x.status==='VERIFIED').length,consensusProposalCount:rows.filter(x=>x.status==='PROPOSED'&&x.consensus===true).length,medianElapsedMs:[...rows].sort((a,b)=>a.elapsedMs-b.elapsedMs)[Math.floor(rows.length/2)]?.elapsedMs??null,rows};
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync('test-results/confidence-benchmark.json',JSON.stringify(report,null,2));
    console.log('HERBARIUM_BENCHMARK',JSON.stringify(report));

    expect(report.automaticVerifiedCount).toBe(0);
    expect(report.plantRejectCount).toBe(0);
    expect(report.negativeFalseSpeciesCount).toBe(0);
    expect(report.negativeRejectCount+report.negativeUnknownCount).toBe(report.negativeCount);
    for(const row of rows.filter(x=>x.status==='PROPOSED')){
      expect(row.scientificName).toBeTruthy();
      expect(row.consensus).toBe(true);
    }

    // A benchmark that safely returns UNKNOWN for every real plant is not a
    // successful recognition benchmark. Keep false-positive safety above,
    // but fail loudly when useful recognition yield collapses to zero.
    expect(report.plantProposalCount,'recognition yield collapsed to zero: all real plants were UNKNOWN').toBeGreaterThan(0);
  });
});
