const CACHE="jerem-custom-github-pages-v1";
const ASSETS=["./","./index.html","./style.css","./app.js","./initial-data.js","./manifest.json"];
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(cached=>{
    return cached || fetch(e.request).then(resp=>{
      if(e.request.method==="GET" && resp && resp.status===200){
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      }
      return resp;
    }).catch(()=>caches.match("./index.html"));
  }));
});
caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{});
