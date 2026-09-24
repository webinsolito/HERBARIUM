import { test, expect } from '@playwright/test';
import { decideSpeciesConsensusV5 } from '../src/species-consensus-v5.mjs';

const proposed=(scientificName,rawScore,margin)=>({status:'PROPOSED',scientificName,rawScore,margin,calibrated:false});

test('V5 arbitration recovers only exceptionally strong primary disagreement',()=>{
  const decision=decideSpeciesConsensusV5(
    proposed('Bellis perennis',0.996,0.994),
    proposed('Taraxacum officinale',0.51,0.03)
  );
  expect(decision.status).toBe('PROPOSED');
  expect(decision.scientificName).toBe('Bellis perennis');
  expect(decision.consensus).toBe(false);
  expect(decision.arbitrated).toBe(true);
  expect(decision.reason).toBe('strong-primary-arbitration');
});

test('V5 arbitration keeps known hot-dog-like primary signal UNKNOWN',()=>{
  const decision=decideSpeciesConsensusV5(
    proposed('Example plant',0.881,0.852),
    proposed('Other taxon',0.55,0.04)
  );
  expect(decision.status).toBe('UNKNOWN');
  expect(decision.scientificName).toBeNull();
  expect(decision.arbitrated).toBe(false);
});

test('V5 exact agreement remains true consensus, not arbitration',()=>{
  const decision=decideSpeciesConsensusV5(
    proposed('Bellis perennis',0.80,0.30),
    proposed('Bellis perennis',0.42,0.02)
  );
  expect(decision.status).toBe('PROPOSED');
  expect(decision.consensus).toBe(true);
  expect(decision.arbitrated).toBe(false);
});
