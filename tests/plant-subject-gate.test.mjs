import assert from 'node:assert/strict';
import { classifyPlantSubject, SUBJECT, subjectGateCopy } from '../app/plant-subject-gate.js';

const cases = [
  ['clear plant evidence', { plant: .94, nonPlant: .03, quality: .91 }, SUBJECT.PLANT],
  ['clear non-plant evidence', { plant: .08, nonPlant: .91, quality: .88 }, SUBJECT.NON_PLANT],
  ['ambiguous subject', { plant: .61, nonPlant: .35, quality: .9 }, SUBJECT.UNCERTAIN],
  ['low quality apparent plant', { plant: .96, nonPlant: .01, quality: .31 }, SUBJECT.UNCERTAIN],
  ['missing detector evidence', {}, SUBJECT.UNCERTAIN],
  ['null detector evidence', null, SUBJECT.UNCERTAIN],
  ['primitive detector evidence', 'invalid', SUBJECT.UNCERTAIN],
  ['close scores fail closed', { plant: .84, nonPlant: .63, quality: .92 }, SUBJECT.UNCERTAIN],
  ['strong non-plant but small margin', { plant: .62, nonPlant: .75, quality: .9 }, SUBJECT.UNCERTAIN],
  ['invalid values fail closed', { plant: NaN, nonPlant: Infinity, quality: NaN }, SUBJECT.UNCERTAIN]
];

let passed = 0;
for (const [name, evidence, expected] of cases) {
  const result = classifyPlantSubject(evidence);
  assert.equal(result.status, expected, name);
  assert.ok(subjectGateCopy(result).title.length > 0, `${name}: UI copy missing`);
  passed++;
}
console.log(`plant-subject-gate: ${passed}/${cases.length} contract cases passed`);
