import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const plantDir=path.resolve('tests/benchmark-assets/plants');
const negDir=path.resolve('tests/benchmark-assets/negatives');
const plantClasses=['daisy','dandelion','roses','sunflowers','tulips'];
const negativeFiles=['cat.png','bird.png','grace_hopper.png','hot_dog.jpg','tablecloth.jpg','floral_print.jpg','laptop_screen.png'];

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
  // Re-run only for benchmark diagnostics. This result is never persisted and never
  // changes the user-facing observation; it exposes PlantNet/BioCLIP consensus details
  // that production intentionally omits from IndexedDB.
  const liveSpecies=await page.evaluate(async evidence=>{
    try{
      const {createSpeciesRecognitionAdapter}=await import('./species-onnx.mjs');
      return await createSpeciesRecognitionAdapter().infer(evidence);
    }catch(error){
      return{status:'UNAVAILABLE',reason:`benchmark-diagnostics:${String(error?.message||error)}`};
    }
  },stored?.evidence||[]);
  return {elapsedMs,item:stored,liveSpecies};
}

function pickPlants(){
  const out=[];
  for(const cls of plantClasses){
    const files=fs.readdirSync(path.join(plantDir,cls)).filter(x=>/\.jpe?g$/i.test(x)).sort().slice(0,2);
    for(const file of files)out.push({kind:'plant',className:cls,file:path.join(plantDir,cls,file)});
  }
  return out;
}

function countBy(rows,key){
  return rows.reduce((counts,row)=>{
    const value=row[key]??'null';
    counts[value]=(counts[value]||0)+1;
    return counts;
  },{});
}

test.describe('HERBARIUM confidence/reject benchmark',()=>{
  test.setTimeout(900000);

  test('separated benchmark reports false-species, reject and UNKNOWN reasons',async({page})=>{
    const samples=[
      ...pickPlants(),
      ...negativeFiles.map(file=>({kind:'negative',className:'negative',file:path.join(negDir,file)}))
    ];
    expect(samples.filter(x=>x.kind==='plant')).toHaveLength(10);
    expect(samples.filter(x=>x.kind==='negative')).toHaveLength(7);

    const rows=[];
    for(const sample of samples){
      await clearDb(page);
      const result=await analyse(page,sample.file);
      const item=result.item;
      const species=item?.analysis?.speciesEngine||null;
      const live=result.liveSpecies||null;
      rows.push({
        kind:sample.kind,
        sourceClass:sample.className,
        file:path.basename(sample.file),
        status:item?.status||null,
        scientificName:item?.scientificName||null,
        quality:item?.analysis?.quality?.status||null,
        nonPlant:item?.analysis?.automaticGate?.status||null,
        nonPlantReason:item?.analysis?.automaticGate?.reason||null,
        speciesEngine:species?.status||null,
        speciesReason:species?.reason||null,
        rawScore:species?.rawScore??null,
        margin:species?.margin??null,
        primaryStatus:live?.primary?.status||null,
        primaryReason:live?.primary?.reason||null,
        primaryScientificName:live?.verificationPrimary?.scientificName||live?.primary?.scientificName||null,
        verifierStatus:live?.verifier?.status||null,
        verifierReason:live?.verifier?.reason||null,
        verifierScientificName:live?.verifierScientificName||live?.verifier?.scientificName||null,
        liveSpeciesStatus:live?.status||null,
        liveSpeciesReason:live?.reason||null,
        consensus:Boolean(live?.consensus),
        recoveryCandidate:Boolean(live?.verificationPrimary?.recoveryCandidate||live?.recoveryCandidate),
        elapsedMs:result.elapsedMs
      });
    }

    const plants=rows.filter(x=>x.kind==='plant');
    const negatives=rows.filter(x=>x.kind==='negative');
    const disagreements=rows.filter(x=>x.speciesReason==='cross-dataset-model-disagreement');
    const disagreementPairs=disagreements.map(x=>({kind:x.kind,file:x.file,primary:x.primaryScientificName,verifier:x.verifierScientificName,recoveryCandidate:x.recoveryCandidate}));
    const report={
      generatedAt:new Date().toISOString(),
      sampleCount:rows.length,
      plantCount:plants.length,
      negativeCount:negatives.length,
      plantRejectCount:plants.filter(x=>x.status==='REJECT').length,
      plantProposalCount:plants.filter(x=>x.status==='PROPOSED').length,
      negativeRejectCount:negatives.filter(x=>x.status==='REJECT').length,
      negativeFalseSpeciesCount:negatives.filter(x=>x.status==='PROPOSED').length,
      automaticVerifiedCount:rows.filter(x=>x.status==='VERIFIED').length,
      plantSpeciesReasonCounts:countBy(plants,'speciesReason'),
      negativeSpeciesReasonCounts:countBy(negatives,'speciesReason'),
      negativeGateReasonCounts:countBy(negatives,'nonPlantReason'),
      disagreementPairs,
      disagreementDiagnosticsMissing:disagreementPairs.filter(x=>!x.primary||!x.verifier).length,
      liveDiagnosticMismatchCount:rows.filter(x=>x.liveSpeciesReason&&x.speciesReason&&x.liveSpeciesReason!==x.speciesReason).length,
      medianElapsedMs:[...rows].sort((a,b)=>a.elapsedMs-b.elapsedMs)[Math.floor(rows.length/2)]?.elapsedMs??null,
      rows
    };
    fs.mkdirSync('test-results',{recursive:true});
    fs.writeFileSync('test-results/confidence-benchmark.json',JSON.stringify(report,null,2));
    console.log('HERBARIUM_BENCHMARK',JSON.stringify(report));

    expect(report.automaticVerifiedCount).toBe(0);
    expect(report.plantRejectCount).toBe(0);
    expect(report.negativeFalseSpeciesCount).toBe(0);
    expect(Object.values(report.plantSpeciesReasonCounts).reduce((a,b)=>a+b,0)).toBe(report.plantCount);
    expect(report.liveDiagnosticMismatchCount).toBe(0);
    expect(report.disagreementDiagnosticsMissing).toBe(0);
  });
});
