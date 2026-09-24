import {test,expect} from '@playwright/test';
import {decideSpeciesConsensusV5,ARBITRATION_POLICY} from '../src/species-consensus-v5.mjs';
const p=(name,score,margin)=>({status:'PROPOSED',scientificName:name,rawScore:score,margin,calibrated:false});
test.describe('species consensus v5 arbitration',()=>{
 test('keeps exact dual-model agreement as consensus',()=>{const x=decideSpeciesConsensusV5(p('Bellis perennis',.82,.30),p('Bellis perennis',.7,.2));expect(x.status).toBe('PROPOSED');expect(x.consensus).toBe(true);expect(x.arbitrated).toBe(false);});
 test('recovers only exceptionally strong primary disagreement',()=>{const x=decideSpeciesConsensusV5(p('Helianthus annuus',.99,.98),p('Calendula officinalis',.8,.2));expect(x.status).toBe('PROPOSED');expect(x.consensus).toBe(false);expect(x.arbitrated).toBe(true);expect(x.reason).toBe('strong-primary-arbitration');});
 test('blocks hot-dog-like 0.881 disagreement observed by benchmark',()=>{const x=decideSpeciesConsensusV5(p('Example plant',.881,.852),p('Other taxon',.8,.2));expect(x.status).toBe('UNKNOWN');expect(x.arbitrated).toBe(false);});
 test('requires both strong score and strong margin',()=>{expect(decideSpeciesConsensusV5(p('A a',.99,.20),p('B b',.9,.4)).status).toBe('UNKNOWN');expect(decideSpeciesConsensusV5(p('A a',.95,.90),p('B b',.9,.4)).status).toBe('UNKNOWN');});
 test('never turns unavailable verifier into a proposal',()=>{expect(decideSpeciesConsensusV5(p('A a',.999,.999),{status:'UNKNOWN'}).status).toBe('UNKNOWN');});
 test('policy remains deliberately stricter than primary candidate gate',()=>{expect(ARBITRATION_POLICY.strongPrimaryTop1).toBeGreaterThanOrEqual(.97);expect(ARBITRATION_POLICY.strongPrimaryMargin).toBeGreaterThanOrEqual(.60);});
});
