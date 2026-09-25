import assert from 'node:assert/strict';
import fs from 'node:fs';

const acquisition=fs.readFileSync(new URL('../app/acquisition-guard.js',import.meta.url),'utf8');
const evidence=fs.readFileSync(new URL('../app/local-subject-evidence.js',import.meta.url),'utf8');
const guard=fs.readFileSync(new URL('../app/field-runtime-guard.js',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../app/runtime.html',import.meta.url),'utf8');

assert.match(acquisition,/outputEdge:1600/,'retained acquisition edge must be capped');
assert.match(acquisition,/prepareMs/,'acquisition timing must be measured locally');
assert.match(acquisition,/canvas\.width=1;canvas\.height=1/,'large acquisition canvas must be released');
assert.match(acquisition,/event\.stopImmediatePropagation\(\)/,'raw native input must be stopped before runtime');
assert.match(acquisition,/preparedByInput=new WeakMap/,'prepared payload must use in-memory authoritative handoff');
assert.match(acquisition,/passthroughEvents=new WeakSet/,'only explicit resumed change events may pass downstream');
assert.match(acquisition,/inFlight=new WeakSet/,'duplicate native change bursts must be suppressed while preparing');
assert.match(acquisition,/grid\.addEventListener\('change'/,'guard must use delegated capture-grid interception across rerenders');
assert.match(acquisition,/transport:'memory-handoff'/,'runtime transport must not depend on input.files rewriting');
assert.match(acquisition,/EventCtor=doc\.defaultView\?\.Event/,'resume events must be created in the runtime iframe realm for WebKit');
assert.match(acquisition,/CustomEventCtor=doc\.defaultView\?\.CustomEvent/,'telemetry events must be created in the runtime iframe realm for WebKit');
assert.doesNotMatch(acquisition,/new DataTransfer\(/,'Safari path must not depend on DataTransfer');
assert.match(acquisition,/herbarium:acquisition-ready/,'prepared acquisition must expose readiness telemetry');
assert.match(acquisition,/input\.value=''/,'failed preparation must clear unsafe input');

assert.match(runtime,/acq\?\.consume\?\.\(e\.target\)/,'runtime must consume only prepared handoff when guard is installed');
assert.doesNotMatch(runtime,/acq\.prepare\(f\)/,'runtime must not decode/prepare the same guarded photo twice');
assert.match(runtime,/async function processPhoto\(file\)/,'quality and preview work must share one decoded drawable');
assert.match(runtime,/function loadDrawable\(file\)/,'runtime must centralize image decoding');
assert.match(runtime,/typeof createImageBitmap!=='function'/,'Safari fallback must exist when createImageBitmap is unavailable');
assert.match(runtime,/\.catch\(fallback\)/,'bitmap decode failure must fall back to HTMLImageElement');
assert.match(runtime,/qualityCanvas\.width=1;qualityCanvas\.height=1;previewCanvas\.width=1;previewCanvas\.height=1/,'runtime canvases must be released');
assert.match(runtime,/Fotocamera o libreria/,'mobile UX must preserve camera/library choice');
assert.match(runtime,/\$\$\('#captureGrid input'\)\.forEach/,'all four Field inputs must receive runtime change handlers');
assert.ok(!runtime.includes("\n  $('#captureGrid input').forEach"),'single-element selector must never be used as a collection');

assert.match(evidence,/\bmax=160\b/,'subject analysis edge must stay bounded');
assert.match(evidence,/analysis:\{ms:/,'subject analysis must expose timing/dimensions');
assert.match(evidence,/canvas\.width=1;canvas\.height=1/,'subject analysis canvas must be released');
assert.match(guard,/lastSignature/,'unchanged previews must not be re-analysed');
assert.match(guard,/setTimeout\(sync,120\)/,'mutation bursts must be debounced');
assert.match(guard,/analysisPixels/,'aggregate runtime must report bounded subject work');

console.log('performance-contract: 30/30 PASS');
