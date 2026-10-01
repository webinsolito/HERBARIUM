const VERSION='herbarium-v1-20261001-scientific-v4';
const CACHE=VERSION+'-app';
const PRECACHE=['./','./index.html','./runtime.html','./premium.css','./manifest.webmanifest','./icon.svg','./offline.html','./acquisition-guard.js','./field-runtime-guard.js','./subject-gate-ui.js','./plant-subject-gate.js','./local-subject-evidence.js'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('herbarium-v1-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  const path=url.pathname;
  const networkFirst =
    req.mode==='navigate' ||
    path.endsWith('/runtime.html') ||
    path.endsWith('/premium.css') ||
    path.endsWith('.js') ||
    path.endsWith('/manifest.webmanifest');

  if(networkFirst){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(c=>c.put(req,copy));
          }
          return res;
        })
        .catch(async()=>{
          const exact=await caches.match(req,{ignoreSearch:false});
          const fallback=exact||await caches.match(url.pathname.split('/').pop() ? './'+url.pathname.split('/').pop() : './',{ignoreSearch:true});
          return fallback||caches.match('./offline.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req,{ignoreSearch:false}).then(cached=>{
      if(cached)return cached;
      return fetch(req).then(res=>{
        if(res&&res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone()));
        return res;
      }).catch(()=>caches.match('./offline.html'));
    })
  );
});
