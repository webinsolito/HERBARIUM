import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evidenceFromPixels } from '../app/local-subject-evidence.js';
import { classifyPlantSubject, SUBJECT } from '../app/plant-subject-gate.js';

const manifest=JSON.parse(readFileSync(new URL('./fixtures/subject-fixtures.json',import.meta.url),'utf8'));
assert.equal(manifest.scope,'synthetic-contract-fixtures-not-real-world-accuracy');

function rgbFor(pattern,x,y,w,h){
  if(pattern==='green-cloth')return (x+y)%7===0?[50,143,62]:[49,142,61];
  if(pattern==='blue-screen')return (x+y)%9===0?[43,69,186]:[45,70,190];
  const nx=(x-w/2)/(w*.43),ny=(y-h/2)/(h*.18);
  const nx2=(x-w*.46)/(w*.18),ny2=(y-h*.52)/(h*.42);
  const leaf=nx*nx+ny*ny<1||nx2*nx2+ny2*ny2<1;
  if(!leaf)return (x+y)%11===0?[205,190,154]:[226,216,184];
  return (x*3+y*5)%13<6?[30,126,48]:[76,174,72];
}

function pixels(fixture){
  const out=new Uint8ClampedArray(fixture.width*fixture.height*4);
  for(let y=0;y<fixture.height;y++)for(let x=0;x<fixture.width;x++){
    const [r,g,b]=rgbFor(fixture.pattern,x,y,fixture.width,fixture.height),i=(y*fixture.width+x)*4;
    out.set([r,g,b,255],i);
  }
  return out;
}

let passed=0;
for(const fixture of manifest.fixtures){
  const evidence=evidenceFromPixels({data:pixels(fixture),width:fixture.width,height:fixture.height,quality:.92});
  const result=classifyPlantSubject(evidence);
  const expected=fixture.label==='PLANT'?SUBJECT.PLANT:SUBJECT.NON_PLANT;
  assert.equal(result.status,expected,`${fixture.id}: ${fixture.description}`);
  if(fixture.id==='nonplant_green_cloth')assert.equal(evidence.features.uniformGreen,true,'uniform green must not count as botanical evidence');
  passed++;
}

const missing=evidenceFromPixels();
assert.equal(classifyPlantSubject(missing).status,SUBJECT.UNCERTAIN);
assert.equal(manifest.fixtures.filter(x=>x.label==='PLANT').length,1);
assert.equal(manifest.fixtures.filter(x=>x.label==='NON_PLANT').length,2);
console.log(`local-subject-evidence fixtures: ${passed}/${manifest.fixtures.length} PASS (synthetic contract only; no accuracy claim)`);
