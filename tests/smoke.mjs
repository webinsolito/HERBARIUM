import fs from 'node:fs';
import assert from 'node:assert/strict';
import { classifyNegativeEvidence, NEGATIVE_CATEGORIES } from '../src/negative-gate.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const home=read('src/index.html');
const observe=read('src/observe.html');
const collection=read('src/collection.html');
const book=read('src/book.html');
const atlas=read('src/atlas.html');
const academy=read('src/academy.html');
const css=read('src/styles.css');
const js=read('src/app.js');
const guard=read('.github/workflows/herbarium-guard.yml');

for(const html of [home,observe,collection,book,atlas,academy]){
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<script src="\.\/app\.js"><\/script>/);
  assert.match(html,/href="\.\/index\.html"/);
  assert.doesNotMatch(html,/data-view=/);
}
assert.match(home,/href="\.\/observe\.html"/);
assert.match(home,/href="\.\/collection\.html"/);
assert.match(home,/href="\.\/book\.html"/);
assert.match(home,/href="\.\/atlas\.html"/);
assert.match(home,/href="\.\/academy\.html"/);
assert.doesNotMatch(home,/id="whole"/);
assert.doesNotMatch(home,/id="collectionList"/);
assert.doesNotMatch(home,/id="pendingList"/);
assert.doesNotMatch(home,/id="atlasRegions"/);
assert.doesNotMatch(home,/id="academyList"/);

assert.match(observe,/accept="image\/\*"/);
assert.match(observe,/capture="environment"/);
assert.match(observe,/id="whole"/);assert.match(observe,/id="flower"/);assert.match(observe,/id="leaf"/);assert.match(observe,/id="detail"/);
assert.match(observe,/UNKNOWN/);
assert.match(collection,/id="collectionList"/);assert.match(collection,/Solo dati locali/);assert.match(collection,/Nessun dato fittizio/);
assert.match(book,/id="pendingList"/);assert.match(book,/Solo dati reali/);assert.match(book,/Nessuna certezza inventata/);
assert.match(atlas,/id="atlasRegions"/);assert.match(atlas,/Nessun cloud/);assert.match(atlas,/Privacy geografica/);
assert.match(academy,/id="academyList"/);assert.match(academy,/id="academyObservationCount"/);assert.match(academy,/id="academyMultiViewCount"/);assert.match(academy,/Nessun corso fittizio/);

assert.match(css,/@media\(max-width:520px\)[\s\S]*\.capture\{grid-template-columns:1fr\}/);
assert.match(css,/\.capture input\{[^}]*width:100%/);

assert.match(js,/indexedDB\.open\(DB_NAME,1\)/);
assert.match(js,/objectStore\(STORE_NAME\)\.add\(observation\)/);
assert.match(js,/objectStore\(STORE_NAME\)\.getAll\(\)/);
assert.match(js,/item=>item&&item\.status==='UNKNOWN'/);
assert.match(js,/Motore botanico validato non installato/);
assert.match(js,/status:negativeGate\.status/);
assert.match(js,/readAsDataURL\(file\)/);
assert.match(js,/MAX_INPUT_BYTES=12\*1024\*1024/);
assert.match(js,/MAX_IMAGE_EDGE=1600/);
assert.match(js,/JPEG_QUALITY=0\.78/);
assert.match(js,/offline · dati locali/);
assert.match(js,/online · dati locali/);
assert.match(js,/Nessun dato è stato salvato/);
assert.match(js,/Nessuna osservazione incompleta è stata registrata/);
assert.doesNotMatch(js,/SCREEN_IDS|history\.pushState|location\.hash|data-view/);
assert.doesNotMatch(js,/localStorage\.setItem/);
assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|navigator\.geolocation/);
assert.doesNotMatch(js,/status:\s*['"]VERIFIED['"]/);
for(const html of [home,observe,collection,book,atlas,academy])assert.doesNotMatch(html,/\b\d{1,3}%\b/);

const negativeFixtures=JSON.parse(read('tests/fixtures/non-plant.json'));
assert.deepEqual(negativeFixtures.map(item=>item.category).sort(),['animal','object','print','tablecloth']);
assert.deepEqual([...NEGATIVE_CATEGORIES].sort(),['animal','object','print','tablecloth']);
for(const fixture of negativeFixtures){
  assert.equal(fixture.expected,'REJECT');assert.equal(fixture.plant,false);assert.ok(fixture.id&&fixture.description);
  const outcome=classifyNegativeEvidence(fixture.category);
  assert.equal(outcome.status,'REJECT');
  assert.equal(outcome.negativeCategory,fixture.category);
  assert.notEqual(outcome.status,'VERIFIED');
}
for(const signal of [null,undefined,'','plant','unknown','OBJECT']){
  const outcome=classifyNegativeEvidence(signal);
  assert.deepEqual(outcome,{status:'UNKNOWN',negativeCategory:null});
  assert.notEqual(outcome.status,'VERIFIED');
}
assert.match(js,/NEGATIVE_CATEGORIES/);assert.match(js,/REJECT/);assert.match(js,/negativeCategory/);
assert.doesNotMatch(js,/negativeCategory[^\n]{0,160}status:\s*['"]VERIFIED['"]/);

assert.match(guard,/'candidate\/\*\*'/);
assert.doesNotMatch(guard,/pull_request:/);
console.log('HERBARIUM smoke PASS');
