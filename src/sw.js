const CACHE='herbarium-v1-shell-3';
const ML_CACHE='herbarium-ml-v1';
const CORE=[
  './','./index.html','./observe.html','./result.html','./collection.html','./book.html','./atlas.html','./academy.html',
  './styles.css','./app.js','./negative-gate.mjs','./local-detector.mjs','./nonplant-onnx.mjs','./species-onnx.mjs','./image-quality.mjs','./image-security.mjs','./book-plates.js',
  './assets/botanical-sprig.svg',
  './species-bellis-demo.html','./immersive-demo.css','./plant3d-demo.js'
];
const ML_ORIGINS=new Set(['https://cdn.jsdelivr.net','https://huggingface.co']);
const trustedMlUrl=url=>ML_ORIGINS.has(url.origin)||url.hostname.endsWith('.hf.co')||url.hostname.endsWith('.xethub.hf.co');
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==ML_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin){
    if(!trustedMlUrl(url))return;
    event.respondWith(caches.open(ML_CACHE).then(async cache=>{
      const cached=await cache.match(request);if(cached)return cached;
      const response=await fetch(request);
      if(response.ok||response.type==='opaque')cache.put(request,response.clone()).catch(()=>{});
      return response;
    }));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }).catch(()=>caches.match(request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>caches.match(request)));
});
