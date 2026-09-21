import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

const MAX_BYTES=25*1024*1024;
const REQUIRED=['FLOWER_HEAD','PETALS','DISC','INVOLUCRE','STEM','LEAVES','ROOT_SYSTEM'];
const PATTERNS={
  FLOWER_HEAD:/flower[_ .-]?head|capolino|flowerhead/i,
  PETALS:/petal|ray[_ .-]?floret|rayfloret/i,
  DISC:/central[_ .-]?head|disc|disk/i,
  INVOLUCRE:/involucre|bract/i,
  STEM:/stem|stalk|peduncle/i,
  LEAVES:/leaf|leaves|foliage/i,
  ROOT_SYSTEM:/root|radic/i,
  SEEDS:/seed|achene/i
};
const ui={
  canvas:document.getElementById('bellisCanvas'),
  empty:document.getElementById('viewerEmpty'),
  input:document.getElementById('assetInput'),
  status:document.getElementById('assetStatus'),
  auditTitle:document.getElementById('auditTitle'),
  meshCount:document.getElementById('meshCount'),
  triangleCount:document.getElementById('triangleCount'),
  assetSize:document.getElementById('assetSize'),
  gate:document.getElementById('nodeGate'),
  selected:document.getElementById('selectedPart'),
  note:document.getElementById('selectionNote'),
  runtime:document.getElementById('runtimeStatus'),
  explode:document.getElementById('explode'),
  reset:document.getElementById('reset'),
  auto:document.getElementById('autoRotate'),
  collapse:document.getElementById('collapseAudit'),
  panel:document.querySelector('.audit-panel')
};

let renderer,scene,camera,controls,loader,model=null,semantic=new Map(),baseTransforms=new Map(),exploded=false;
let raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),selectedMesh=null,selectedOriginal=null,objectUrl=null,rendering=true;

function setStatus(state,text){ui.status.dataset.state=state;ui.status.querySelector('span:last-child').textContent=text;}
function humanBytes(bytes){if(!Number.isFinite(bytes))return '—';if(bytes<1024*1024)return (bytes/1024).toFixed(0)+' KB';return (bytes/1024/1024).toFixed(1)+' MB';}
function clearSelection(){
  if(selectedMesh&&selectedOriginal){selectedMesh.material=selectedOriginal;selectedMesh=null;selectedOriginal=null;}
  ui.selected.textContent='Nessuna';
}
function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true,powerPreference:'high-performance'});
  }catch(error){
    setStatus('blocked','WEBGL NOT AVAILABLE');
    ui.runtime.textContent='WebGL non disponibile in questo browser/dispositivo.';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x111611);
  scene.fog=new THREE.FogExp2(0x111611,0.055);

  camera=new THREE.PerspectiveCamera(36,1,0.01,100);
  camera.position.set(2.6,1.7,3.7);

  controls=new OrbitControls(camera,ui.canvas);
  controls.enableDamping=true;
  controls.dampingFactor=.065;
  controls.minDistance=.35;
  controls.maxDistance=12;
  controls.target.set(0,.65,0);
  controls.autoRotate=false;
  controls.autoRotateSpeed=.7;

  scene.add(new THREE.HemisphereLight(0xe7efe4,0x252117,1.55));
  const key=new THREE.DirectionalLight(0xfff4df,3.0);key.position.set(3.2,4.5,3.5);key.castShadow=true;scene.add(key);
  const rim=new THREE.DirectionalLight(0xbfd9c2,1.25);rim.position.set(-3.5,2.4,-2.5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xc7b99c,.55);fill.position.set(0,-1.5,2);scene.add(fill);

  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.2,64),new THREE.MeshStandardMaterial({color:0x171b14,roughness:1,metalness:0}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.35;floor.receiveShadow=true;scene.add(floor);

  loader=new GLTFLoader();
  const ro=new ResizeObserver(resize);ro.observe(ui.canvas.parentElement);
  document.addEventListener('visibilitychange',()=>{rendering=!document.hidden;});
  ui.canvas.addEventListener('pointerup',pick);
  ui.input.addEventListener('change',onLocalFile);
  ui.explode.addEventListener('click',toggleExplode);
  ui.reset.addEventListener('click',resetView);
  ui.auto.addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;ui.auto.classList.toggle('active',controls.autoRotate);});
  ui.collapse.addEventListener('click',()=>{ui.panel.classList.toggle('collapsed');ui.collapse.textContent=ui.panel.classList.contains('collapsed')?'+':'−';});
  resize();animate();
  tryDefaultAsset();
}
function resize(){
  if(!renderer)return;
  const rect=ui.canvas.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
}
async function tryDefaultAsset(){
  try{
    const response=await fetch('./assets/bellis-perennis.glb',{method:'HEAD',cache:'no-store'});
    if(response.ok)await loadGlb('./assets/bellis-perennis.glb',Number(response.headers.get('content-length'))||null,'Repository asset');
  }catch{}
}
async function onLocalFile(event){
  const file=event.target.files?.[0];if(!file)return;
  if(file.size>MAX_BYTES){setStatus('blocked','ASSET TOO LARGE');ui.auditTitle.textContent='Rifiutato: oltre 25 MB';return;}
  if(!/\.glb$/i.test(file.name)){setStatus('blocked','GLB REQUIRED');ui.auditTitle.textContent='Solo file .glb';return;}
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(file);
  await loadGlb(objectUrl,file.size,file.name);
}
function disposeObject(root){
  root?.traverse(o=>{if(o.isMesh){o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.filter(Boolean).forEach(m=>{for(const key of Object.keys(m)){const value=m[key];if(value?.isTexture)value.dispose();}m.dispose?.();});}});
}
async function loadGlb(url,size,label){
  setStatus('audit','AUDITING ASSET');ui.auditTitle.textContent='Caricamento…';
  clearSelection();
  if(model){scene.remove(model);disposeObject(model);model=null;}
  try{
    const gltf=await loader.loadAsync(url);
    model=gltf.scene;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    normalizeModel(model);
    scene.add(model);
    auditModel(model,size,label);
    ui.empty.hidden=true;
    fitWhole();
    ui.reset.disabled=false;
  }catch(error){
    setStatus('blocked','LOAD FAILED');
    ui.auditTitle.textContent='GLB non caricabile';
    ui.note.textContent='Il file non è stato accettato dal GLTFLoader.';
    console.error(error);
  }
}
function normalizeModel(root){
  const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();
  box.getSize(size);box.getCenter(center);
  const longest=Math.max(size.x,size.y,size.z)||1;
  const scale=2.6/longest;
  root.scale.setScalar(scale);
  root.position.sub(center.multiplyScalar(scale));
  const box2=new THREE.Box3().setFromObject(root);
  root.position.y+=-1.15-box2.min.y;
  root.updateMatrixWorld(true);
}
function auditModel(root,size,label){
  semantic=new Map();baseTransforms=new Map();
  let meshes=0,triangles=0;
  root.traverse(o=>{
    if(!o.isMesh)return;
    meshes++;
    const geom=o.geometry;
    triangles+=geom?.index?geom.index.count/3:(geom?.attributes?.position?.count||0)/3;
    const name=(o.name||o.parent?.name||'').trim();
    for(const [key,rx] of Object.entries(PATTERNS)){
      if(rx.test(name)){if(!semantic.has(key))semantic.set(key,[]);semantic.get(key).push(o);}
    }
  });
  for(const [key,items] of semantic)for(const o of items)baseTransforms.set(o,o.position.clone());
  ui.meshCount.textContent=String(meshes);
  ui.triangleCount.textContent=Math.round(triangles).toLocaleString('it-IT');
  ui.assetSize.textContent=humanBytes(size);
  ui.auditTitle.textContent=label;
  let pass=true;
  ui.gate.querySelectorAll('li').forEach(li=>{
    const key=li.dataset.key,count=semantic.get(key)?.length||0,optional=key==='SEEDS';
    li.classList.toggle('ok',count>0);li.classList.toggle('fail',!count&&!optional);
    li.querySelector('span').textContent=count?count+' node'+(count===1?'':'s'):(optional?'opzionale':'MANCANTE');
    if(!optional&&!count)pass=false;
  });
  if(pass){
    setStatus('ready','SCENE GRAPH PASS');
    ui.explode.disabled=false;
    ui.note.textContent='Scene graph completo. Raycasting e exploded view abilitati per audit.';
  }else{
    setStatus('blocked','SCENE GRAPH FAIL');
    ui.explode.disabled=true;
    ui.note.textContent='Mancano nodi obbligatori: il modello non può essere approvato per HERBARIUM.';
  }
}
function semanticKeyFor(mesh){
  for(const [key,items] of semantic)if(items.includes(mesh))return key;
  let p=mesh.parent;while(p&&p!==model){for(const [key,items] of semantic)if(items.includes(p))return key;p=p.parent;}
  return null;
}
function pick(event){
  if(!model||!camera)return;
  const r=ui.canvas.getBoundingClientRect();
  pointer.x=((event.clientX-r.left)/r.width)*2-1;
  pointer.y=-((event.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObject(model,true).filter(h=>h.object?.isMesh);
  if(!hits.length)return;
  selectMesh(hits[0].object);
}
function selectMesh(mesh){
  clearSelection();
  selectedMesh=mesh;selectedOriginal=mesh.material;
  if(!Array.isArray(mesh.material)&&mesh.material){
    const m=mesh.material.clone();
    if('emissive' in m){m.emissive=new THREE.Color(0x314b35);m.emissiveIntensity=.45;}
    mesh.material=m;
  }
  const key=semanticKeyFor(mesh),label=key||mesh.name||'Mesh senza nome';
  ui.selected.textContent=label;
  ui.note.textContent=key?'Selezione reale via raycasting sulla mesh.':'Mesh selezionata, ma non mappata a una parte botanica richiesta.';
  focusObject(mesh);
}
function fitWhole(){
  if(!model)return;
  const box=new THREE.Box3().setFromObject(model),sphere=new THREE.Sphere();box.getBoundingSphere(sphere);
  const d=Math.max(sphere.radius*2.5,2.4);
  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).add(new THREE.Vector3(d*.72,d*.38,d));
  controls.update();
}
function focusObject(obj){
  const box=new THREE.Box3().setFromObject(obj),sphere=new THREE.Sphere();box.getBoundingSphere(sphere);
  const startPos=camera.position.clone(),startTarget=controls.target.clone();
  const dir=camera.position.clone().sub(controls.target).normalize();
  const targetPos=sphere.center.clone().add(dir.multiplyScalar(Math.max(sphere.radius*3.1,.55)));
  tween(520,t=>{
    camera.position.lerpVectors(startPos,targetPos,t);
    controls.target.lerpVectors(startTarget,sphere.center,t);
  });
}
function tween(duration,step){
  const start=performance.now();
  function frame(now){const p=Math.min(1,(now-start)/duration),e=1-Math.pow(1-p,3);step(e);if(p<1)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}
function explodeVector(key,obj){
  const center=new THREE.Vector3();obj.getWorldPosition(center);
  const radial=new THREE.Vector3(center.x,0,center.z);if(radial.lengthSq()<.001)radial.set(1,0,0);radial.normalize();
  switch(key){
    case'FLOWER_HEAD':return new THREE.Vector3(0,.38,0);
    case'PETALS':return radial.multiplyScalar(.42).add(new THREE.Vector3(0,.18,0));
    case'DISC':return new THREE.Vector3(0,.58,0);
    case'INVOLUCRE':return new THREE.Vector3(0,-.20,0);
    case'STEM':return new THREE.Vector3(0,0,0);
    case'LEAVES':return radial.multiplyScalar(.34);
    case'ROOT_SYSTEM':return radial.multiplyScalar(.18).add(new THREE.Vector3(0,-.42,0));
    case'SEEDS':return radial.multiplyScalar(.30).add(new THREE.Vector3(0,.72,0));
    default:return new THREE.Vector3();
  }
}
function toggleExplode(){
  if(ui.explode.disabled)return;
  exploded=!exploded;ui.explode.classList.toggle('active',exploded);ui.explode.textContent=exploded?'Ricomponi':'Esplodi';
  for(const [key,items] of semantic)for(const o of items){
    const base=baseTransforms.get(o);if(!base)continue;
    const target=base.clone().add(exploded?explodeVector(key,o):new THREE.Vector3());
    const start=o.position.clone();tween(700,t=>o.position.lerpVectors(start,target,t));
  }
}
function resetView(){
  if(!model)return;
  if(exploded){exploded=false;ui.explode.classList.remove('active');ui.explode.textContent='Esplodi';for(const [o,base] of baseTransforms){o.position.copy(base);}}
  clearSelection();fitWhole();
}
function animate(){
  requestAnimationFrame(animate);
  if(!renderer||!rendering)return;
  controls?.update();renderer.render(scene,camera);
}
window.addEventListener('beforeunload',()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);});
init();
