/* Herbarium conservative plant-subject gate.
 * This module NEVER identifies a species. It only converts evidence from a
 * subject detector/classifier into a safe admission decision.
 */
export const SUBJECT = Object.freeze({
  PLANT: 'plant',
  UNCERTAIN: 'uncertain',
  NON_PLANT: 'non-plant'
});

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function classifyPlantSubject(evidence = {}) {
  const safeEvidence = evidence && typeof evidence === 'object' ? evidence : {};
  const plant = clamp(safeEvidence.plant);
  const nonPlant = clamp(safeEvidence.nonPlant);
  const quality = clamp(safeEvidence.quality ?? (evidence == null ? 0 : 1));
  const margin = plant - nonPlant;

  // Fail closed: poor/absent evidence must never become a plant observation.
  if (quality < 0.45) {
    return { status: SUBJECT.UNCERTAIN, reason: 'image-quality', plant, nonPlant, quality };
  }
  if (nonPlant >= 0.72 && nonPlant - plant >= 0.18) {
    return { status: SUBJECT.NON_PLANT, reason: 'non-plant-evidence', plant, nonPlant, quality };
  }
  if (plant >= 0.82 && margin >= 0.28) {
    return { status: SUBJECT.PLANT, reason: 'plant-evidence', plant, nonPlant, quality };
  }
  return { status: SUBJECT.UNCERTAIN, reason: 'insufficient-evidence', plant, nonPlant, quality };
}

export function subjectGateCopy(result) {
  if (!result || result.status === SUBJECT.UNCERTAIN) {
    return { title: 'Non sono abbastanza sicuro', detail: 'Prova una foto più vicina e nitida della pianta. Nessuna specie verrà inventata.', tone: 'warn' };
  }
  if (result.status === SUBJECT.NON_PLANT) {
    return { title: 'Non sembra una pianta', detail: 'Questa immagine non entra nel riconoscimento botanico. Prova a inquadrare foglie, fiore o pianta intera.', tone: 'bad' };
  }
  return { title: 'Soggetto botanico rilevato', detail: 'La foto può passare al riconoscimento. Questo controllo non assegna ancora una specie.', tone: 'ok' };
}
