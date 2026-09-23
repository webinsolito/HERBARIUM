import fs from 'node:fs';
import assert from 'node:assert/strict';
import { classifyNegativeEvidence, NEGATIVE_CATEGORIES } from '../src/negative-gate.mjs';
import { classifyPixelsLocally, aggregateLabelEvidence, DEFAULT_NON_PLANT_THRESHOLD, DEFAULT_MIN_MARGIN } from '../src/local-detector.mjs';
import { sniffImageBytes, declaredMimeCompatible, MAX_INPUT_BYTES, MAX_IMAGE_EDGE } from '../src/image-security.mjs';
import { decideQualityFromStats, QUALITY_LIMITS } from '../src/image-quality.mjs';
import { decideSpeciesProposal, decideModelConsensus, SPECIES_ENGINE_VERSION, SPECIES_MODEL_LICENSE } from '../src/species-onnx.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const pages=['index','observe','result','collection','book','atlas','academy'].map(n=>read(`src/${n}.html`));
const [home,observe,resultPage,collection,book,atlas,academy]=pages;
const app=read('src/app.js');
const sw=read('src/sw.js');
const css=read('src/styles.css');
const bookPlates=read('src/book-plates.js');
const demo=read('src/species-bellis-demo.html');
const demoJs=read('src/plant3d-demo.js');
const lab=read('src/species-bellis-lab.html');
const labJs=read('src/bellis-lab.js');
const nonPlantOnnx=read('src/nonplant-onnx.mjs');
const speciesOnnx=read('src/species-onnx.mjs');
const qualityGate=read('src/image-quality.mjs');
const p0aAudit=read('P0A_AUTOMATIC_GATE.md');
const guard=read('.github/workflows/herbarium-guard.yml');

for(const html of pages){
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/<script type="module" src="\.\/app\.js"><\/script>/);
  assert.doesNotMatch(html,/data-view=/);
}
assert.match(home,/href="\.\/observe\.html"/);assert.match(home,/href="\.\/collection\.html"/);assert.match(home,/href="\.\/book\.html"/);assert.match(home,/href="\.\/atlas\.html"/);assert.match(home,/href="\.\/academy\.html"/);
assert.match(observe,/accept="image\/\*"/);assert.match(observe,/capture="environment"/);assert.match(observe,/id="whole"/);assert.match(observe,/id="detail"/);assert.match(observe,/id="negativeSignal"/);
for(const category of ['object','animal','print','tablecloth'])assert.match(observe,new RegExp(`value="${category}"`));
assert.match(resultPage,/id="resultPage"/);assert.match(resultPage,/id="resultMainTitle"/);assert.match(resultPage,/id="resultDelete"/);assert.match(resultPage,/Nessuna specie viene inventata/);assert.match(resultPage,/species-bellis-demo\.html/);
assert.match(app,/indexedDB\.open\(DB_NAME,1\)/);assert.match(app,/objectStore\(STORE_NAME\)\.add\(observation\)/);assert.match(app,/objectStore\(STORE_NAME\)\.delete\(id\)/);assert.match(app,/Verifica del salvataggio locale fallita/);assert.match(app,/Verifica eliminazione fallita/);assert.match(app,/storage\.estimate/);assert.match(app,/storage\?\.persist/);assert.match(app,/MAX_PIXELS=40_000_000/);assert.match(app,/inspectImageFile/);assert.match(app,/exifStripped:true/);assert.match(app,/const data=await blob\.arrayBuffer\(\)/);assert.match(app,/new Blob\(\[payload\]/);assert.match(app,/status:status==='PROPOSED'\?'PROPOSED':'UNAVAILABLE'/);assert.match(app,/confidence:null/);assert.match(app,/calibrated:false/);assert.match(app,/assessEvidenceQuality/);assert.match(app,/createSpeciesRecognitionAdapter/);assert.match(app,/speciesEngine:\{/);assert.match(app,/createAutomaticNonPlantAdapter/);assert.match(app,/classifyPixelsLocally\(\{evidence\},automaticGateAdapter\)/);assert.match(app,/location\.assign\(.*result\.html/);assert.match(app,/item\.status==='REJECT'/);assert.match(app,/item\.status==='VERIFIED'/);assert.doesNotMatch(app,/status\s*:\s*['"]VERIFIED['"]/);assert.doesNotMatch(app,/innerHTML\s*=/);assert.doesNotMatch(app,/https?:\/\//);

assert.equal(MAX_INPUT_BYTES,12*1024*1024);assert.equal(MAX_IMAGE_EDGE,1600);assert.equal(sniffImageBytes(new Uint8Array([0xff,0xd8,0xff,0x00])),'image/jpeg');assert.equal(sniffImageBytes(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),'image/png');assert.equal(sniffImageBytes(new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])),'image/webp');assert.equal(sniffImageBytes(new Uint8Array([1,2,3,4,5,6,7,8])),null);assert.equal(declaredMimeCompatible('image/jpeg','image/jpeg'),true);assert.equal(declaredMimeCompatible('image/jpeg','image/png'),false);assert.equal(declaredMimeCompatible('text/plain','image/jpeg'),false);

const negativeFixtures=JSON.parse(read('tests/fixtures/non-plant.json'));
assert.deepEqual(negativeFixtures.map(x=>x.category).sort(),['animal','object','print','tablecloth']);assert.deepEqual([...NEGATIVE_CATEGORIES].sort(),['animal','object','print','tablecloth']);
for(const fixture of negativeFixtures){const outcome=classifyNegativeEvidence(fixture.category);assert.equal(outcome.status,'REJECT');assert.notEqual(outcome.status,'VERIFIED');}
for(const signal of [null,undefined,'','plant','unknown','OBJECT'])assert.deepEqual(classifyNegativeEvidence(signal),{status:'UNKNOWN',negativeCategory:null});
assert.equal(DEFAULT_NON_PLANT_THRESHOLD,0.985);assert.equal(DEFAULT_MIN_MARGIN,0.20);
assert.equal((await classifyPixelsLocally(null,null)).status,'UNKNOWN');assert.equal((await classifyPixelsLocally({pixels:true},null)).reason,'runtime-unavailable');
assert.equal((await classifyPixelsLocally({pixels:true},{infer:async()=>({executed:true,nonPlantScore:.984,category:'object'})})).status,'UNKNOWN');
assert.equal((await classifyPixelsLocally({pixels:true},{infer:async()=>({executed:true,nonPlantScore:.999,plantScore:.90,topMargin:.099,category:'object'})})).reason,'plant-disagreement');
assert.equal((await classifyPixelsLocally({pixels:true},{infer:async()=>({executed:true,nonPlantScore:.999,plantScore:.01,topMargin:.10,category:'object'})})).reason,'weak-margin');
assert.deepEqual(await classifyPixelsLocally({pixels:true},{infer:async()=>({executed:true,nonPlantScore:.999,plantScore:.01,topMargin:.989,category:'object'})}),{status:'REJECT',negativeCategory:'object',reason:'local-pixel-inference'});
const agg=aggregateLabelEvidence([{label:'leaf',score:.91},{label:'dog',score:.99}],{plantLabels:['leaf'],nonPlantLabels:['dog']});
assert.deepEqual(agg,{nonPlantScore:.99,plantScore:.91,topMargin:.07999999999999996,category:'dog'});
assert.equal((await classifyPixelsLocally({pixels:true},{infer:async()=>({executed:true,...agg})})).status,'UNKNOWN');

assert.match(collection,/id="collectionList"/);assert.match(book,/id="pendingList"/);assert.match(bookPlates,/item\.status==='VERIFIED'/);assert.match(bookPlates,/scientificName/);assert.doesNotMatch(bookPlates,/Bellis perennis|Rosa canina|Lavandula/);assert.match(atlas,/Mostra soltanto dati geografici realmente presenti/);assert.match(app,/Number\.isFinite\(x\.location\.latitude\)/);assert.match(academy,/Nessun corso fittizio/);
assert.match(sw,/herbarium-v1-shell-3/);assert.match(sw,/caches\.open/);assert.match(sw,/request\.mode==='navigate'/);assert.match(sw,/url\.origin!==self\.location\.origin/);assert.match(sw,/cdn\.jsdelivr\.net/);assert.match(sw,/huggingface\.co/);assert.match(sw,/trustedMlUrl/);
assert.match(demo,/DEMO 3D/);assert.match(demo,/MODELLO PROCEDURALE V2/);assert.match(demoJs,/getContext\('webgl'/);assert.match(demoJs,/toggleExplode/);assert.match(demoJs,/pointerdown/);assert.match(demoJs,/wheel/);assert.match(demoJs,/stripGeometry\('petal'/);assert.match(demoJs,/stripGeometry\('leaf'/);assert.match(demoJs,/for\(let ring=0;ring<2;ring\+\+\)/);assert.match(demoJs,/for\(let k=0;k<78;k\+\+\)/);assert.match(lab,/ASSET NOT APPROVED/);assert.match(labJs,/GLTFLoader/);assert.match(labJs,/Raycaster/);assert.match(labJs,/intersectObject\(model,true\)/);
assert.match(css,/\.result-detail-card/);assert.match(css,/\.observation-delete/);assert.match(guard,/'candidate\/\*\*'/);assert.doesNotMatch(guard,/pull_request:/);
assert.match(nonPlantOnnx,/onnxruntime-web@1\.30\.0/);
assert.match(nonPlantOnnx,/ssd_mobilenet_v1_12-int8/);
assert.match(nonPlantOnnx,/executionProviders:\['wasm'\]/);
assert.match(nonPlantOnnx,/potted plant/);
assert.match(nonPlantOnnx,/multi-evidence-disagreement/);
assert.match(nonPlantOnnx,/MIN_SIDE=96/);
assert.doesNotMatch(nonPlantOnnx,/status:\s*['"]VERIFIED['"]/);
assert.match(p0aAudit,/Apache-2\.0/);
assert.match(p0aAudit,/ONNX Runtime Web 1\.30\.0/);
assert.match(observe,/cdn\.jsdelivr\.net/);
assert.match(sw,/herbarium-ml-v1/);
assert.match(sw,/nonplant-onnx\.mjs/);


assert.equal(QUALITY_LIMITS.minSide,128);
assert.equal(decideQualityFromStats({width:800,height:600,meanLuma:120,contrastStd:28,edgeEnergy:16}).status,'PASS');
assert.equal(decideQualityFromStats({width:800,height:600,meanLuma:120,contrastStd:28,edgeEnergy:1}).status,'UNUSABLE');
assert.equal(SPECIES_ENGINE_VERSION,'plantnet-bioclip-consensus-v3');
assert.equal(SPECIES_MODEL_LICENSE,'OpenRAIL + MIT');
const strongProposal=decideSpeciesProposal([{executed:true,top:[{index:10,label:'Species test A',score:.97},{index:11,label:'Species test B',score:.01}]}]);
assert.equal(strongProposal.status,'PROPOSED');assert.equal(strongProposal.calibrated,false);
const weakProposal=decideSpeciesProposal([{executed:true,top:[{index:10,label:'Species test A',score:.60},{index:11,label:'Species test B',score:.30}]}]);
assert.equal(weakProposal.status,'UNKNOWN');
const consensusOk=decideModelConsensus(
  {status:'PROPOSED',scientificName:'Species test A',rawScore:.97,margin:.80,calibrated:false},
  {status:'PROPOSED',scientificName:'Species test A',rawScore:.90,margin:.60,calibrated:false}
);
assert.equal(consensusOk.status,'PROPOSED');assert.equal(consensusOk.consensus,true);
const consensusFail=decideModelConsensus(
  {status:'PROPOSED',scientificName:'Species test A',rawScore:.97,margin:.80,calibrated:false},
  {status:'PROPOSED',scientificName:'Species test B',rawScore:.95,margin:.70,calibrated:false}
);
assert.equal(consensusFail.status,'UNKNOWN');assert.equal(consensusFail.reason,'model-disagreement');
assert.match(speciesOnnx,/plantnet300k-mobilenetv3-small/);assert.match(speciesOnnx,/bioclip-2\.5-mobile-fastvit/);assert.match(speciesOnnx,/cross-dataset-dual-model-consensus/);assert.match(speciesOnnx,/calibrated:false/);assert.doesNotMatch(speciesOnnx,/status:\s*['"]VERIFIED['"]/);
assert.match(qualityGate,/blur-or-flat/);
assert.match(sw,/species-onnx\.mjs/);assert.match(sw,/image-quality\.mjs/);

console.log('HERBARIUM V1 smoke PASS');
