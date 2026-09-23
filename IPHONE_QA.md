# HERBARIUM V1 — Real iPhone acceptance gate

This checklist is intentionally **MANUAL / PHYSICAL DEVICE ONLY**. WebKit emulation is not accepted as evidence for this gate.

## Required device run
Record iPhone model, iOS version, Safari version, candidate commit and date.

### Acquisition
- [ ] Camera permission prompt is understandable.
- [ ] Rear camera capture opens from “Scatta una foto”.
- [ ] Photo Library selection opens from “Scegli dalla libreria”.
- [ ] HEIC/JPEG photos are accepted or fail with a clear safe error.
- [ ] 12 MB / oversized inputs fail safely without partial records.
- [ ] Multiple evidence photos can be selected without freezing.

### Recognition safety
- [ ] Real obvious non-plant photo produces REJECT or conservative UNKNOWN according to policy.
- [ ] Real plant photo never becomes VERIFIED automatically.
- [ ] Ambiguous/blurred/dark photo remains UNKNOWN when quality is insufficient.
- [ ] Species proposal, when present, is visibly a proposal and not a scientific verification.

### Persistence
- [ ] Observation survives Safari reload.
- [ ] Observation survives closing/reopening the PWA/Safari tab.
- [ ] Delete removes the observation after reload.
- [ ] Collection and Book remain coherent after repeated sessions.

### Offline-first
- [ ] Bootstrap once online so runtime/models are cached.
- [ ] Enable Airplane Mode.
- [ ] Reopen Home, Observe, Collection, Book and Atlas.
- [ ] Re-run a previously bootstrapped model flow offline.
- [ ] No image is uploaded or lost when network changes mid-flow.

### Storage / memory / performance
- [ ] Run at least 10 observations consecutively.
- [ ] No Safari tab crash or forced reload.
- [ ] No uncontrolled growth of blob URLs after navigation.
- [ ] Record first-model-load time and warm inference time; do not publish an accuracy or speed claim from one device.
- [ ] Low-storage behavior fails safely if reproducible.

### 3D
- [ ] Bellis demo opens.
- [ ] Drag / zoom / explode controls remain responsive.
- [ ] Demo is still labelled as technical/non-scientific.

## Evidence required for GREEN
Physical test notes (or video/screenshots), device/iOS version, candidate SHA, failures found and rerun after fixes.

Until this checklist is executed on hardware, P1 stays **YELLOW/OPEN** and App Store/Core ML readiness must not be claimed.
