# HERBARIUM — Operational Roadmap

## P0 — Source of truth
- Recover the best real baseline into this repository.
- Keep historical recovery files separate from stable.
- Establish repeatable build/test commands.
- Add a clear version manifest.

## P1 — Reliability before features
- Negative/non-plant dataset.
- UNKNOWN/REJECT gate.
- Multi-view evidence.
- Photo quality gate.
- Look-alike discrimination.
- Confidence calibration only on a separated benchmark.
- No user-facing reliability percentage until calibrated.

## P2 — iPhone experience
- Camera + photo library.
- Mobile-first navigation.
- Offline reopen.
- Local persistence and backup.
- Privacy-safe GPS/altitude.
- Accessibility.

## P3 — Living Atlas product
- Real collection only; no fake starter plants.
- Book renderer.
- Atlas/maps.
- Academy tied to observed plants.
- Expeditions/achievements only if they do not weaken scientific caution.

## P4 — Native evolution
- Evaluate SwiftUI/Core ML migration after the PWA baseline is reproducible and regression-tested.
- Preserve data migration and offline behavior.
- Test on real iPhone before App Store readiness claims.

## Permanent gate
A new feature is lower priority than a broken test, a false positive, data loss, privacy regression or offline regression.
