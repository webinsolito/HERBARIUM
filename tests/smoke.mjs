import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('src/index.html','utf8');
const js=fs.readFileSync('src/app.js','utf8');
assert.match(html,/accept="image\/\*"/);assert.match(html,/capture="environment"/);assert.match(html,/UNKNOWN/);
assert.match(html,/id="whole"/);assert.match(html,/id="flower"/);assert.match(html,/id="leaf"/);assert.match(html,/id="detail"/);
assert.match(html,/id="collection"/);assert.match(html,/id="collectionList"/);assert.match(html,/Solo dati locali/);assert.match(html,/Nessun dato fittizio/);
assert.match(html,/id="book"/);assert.match(html,/id="pendingList"/);assert.match(html,/Solo dati reali/);assert.match(html,/Nessuna certezza inventata/);
assert.match(html,/id="atlas"/);assert.match(html,/id="atlasRegions"/);assert.match(html,/Nessun cloud/);assert.match(html,/Privacy geografica/);
assert.match(html,/id="academy"/);assert.match(html,/id="home" class="screen active"/);assert.match(html,/class="feature-grid"/);assert.match(html,/class="feature-card"/);assert.match(html,/id="academyList"/);assert.match(html,/id="academyObservationCount"/);assert.match(html,/id="academyMultiViewCount"/);assert.match(html,/Nessun corso fittizio/);
assert.match(js,/Motore botanico validato non installato/);assert.match(js,/indexedDB\.open\(DB_NAME,1\)/);assert.match(js,/objectStore\(STORE_NAME\)\.add\(observation\)/);assert.match(js,/objectStore\(STORE_NAME\)\.getAll\(\)/);
assert.match(js,/status:'UNKNOWN'/);assert.match(js,/speciesCount\.textContent='0'/);assert.match(js,/item=>item&&item\.status==='UNKNOWN'/);assert.match(js,/renderCollection/);assert.match(js,/collectionCount/);assert.match(js,/collectionVerifiedCount/);assert.match(js,/Nessuna osservazione reale salvata/);assert.match(js,/Impossibile leggere la raccolta locale/);assert.match(js,/renderBook/);assert.match(js,/renderAtlas/);
assert.match(js,/renderAcademy/);assert.match(js,/roles\.length>=2/);assert.match(js,/Nessuna osservazione reale disponibile/);assert.match(js,/Impossibile leggere i dati locali dell’Academy/);assert.match(js,/button\.dataset\.view==='academy'/);assert.match(js,/await renderAcademy\(\)/);
assert.match(js,/await renderCollection\(\)/);assert.match(js,/SCREEN_IDS/);assert.match(js,/querySelectorAll\('\.screen'\)/);assert.match(js,/history\.pushState/);assert.match(js,/window\.scrollTo\(0,0\)/);assert.match(js,/showScreen\(location\.hash\.slice\(1\)\|\|'home'/);assert.match(js,/button\.dataset\.view==='collection'/);assert.match(js,/renderStats\(\);renderCollection\(\);renderBook\(\);renderAtlas\(\);renderAcademy\(\)/);
assert.match(js,/readAsDataURL\(file\)/);assert.match(js,/file\.type&&!file\.type\.startsWith\('image\/'\)/);assert.match(js,/MAX_INPUT_BYTES=12\*1024\*1024/);assert.match(js,/MAX_IMAGE_EDGE=1600/);assert.match(js,/JPEG_QUALITY=0\.78/);assert.match(js,/canvas\.toBlob/);
assert.match(js,/database locale del dispositivo/);assert.match(js,/offline · dati locali/);assert.match(js,/online · dati locali/);assert.match(js,/Nessun dato è stato salvato/);assert.match(js,/Nessuna osservazione incompleta è stata registrata/);
assert.doesNotMatch(js,/localStorage\.setItem/);assert.doesNotMatch(html,/\b\d{1,3}%\b/);assert.doesNotMatch(js,/status:\s*['"]VERIFIED['"]/);assert.doesNotMatch(js,/fake|mockSpecies|starterPlants/i);assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|navigator\.geolocation/);

// P1 negative/non-plant contract: before any identification engine exists, known negative
// categories must have explicit regression fixtures and may never map to a plant verdict.
const negativeFixtures=JSON.parse(fs.readFileSync('tests/fixtures/non-plant.json','utf8'));
assert.deepEqual(negativeFixtures.map(item=>item.category).sort(),['animal','object','print','tablecloth']);
for(const fixture of negativeFixtures){
  assert.equal(fixture.expected,'REJECT');
  assert.equal(fixture.plant,false);
  assert.ok(fixture.id&&fixture.description);
}
assert.match(js,/NEGATIVE_CATEGORIES/);
assert.match(js,/REJECT/);
assert.match(js,/negativeCategory/);
assert.doesNotMatch(js,/negativeCategory[^\n]{0,160}status:\s*['"]VERIFIED['"]/);
console.log('HERBARIUM smoke PASS');

assert.doesNotMatch(html,/class="hero"[^>]*>.*data-view="collection"/s);
assert.doesNotMatch(js,/querySelectorAll\('\.view'\)/);
