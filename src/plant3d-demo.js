(function(){'use strict';
const TAU=Math.PI*2;
const VSH=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uMVP*vec4(aPosition,1.0);}`;
const FSH=`precision mediump float;uniform vec3 uColor;uniform vec3 uLight;uniform float uGlow;uniform float uSoftness;varying vec3 vNormal;varying vec3 vWorld;void main(){vec3 n=normalize(vNormal);vec3 l=normalize(uLight-vWorld);float d=max(dot(n,l),0.0);float hemi=.34+.34*(n.y*.5+.5);vec3 viewDir=normalize(vec3(0.0,.25,1.0));float rim=pow(1.0-max(dot(n,viewDir),0.0),2.5)*(.12+uSoftness*.10);float spec=pow(max(dot(reflect(-l,n),viewDir),0.0),18.0)*(.08+uSoftness*.06);vec3 c=uColor*(hemi+d*.74)+vec3(uGlow+rim+spec);gl_FragColor=vec4(c,1.0);}`;
function mat4(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
function mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function tr(x,y,z){let m=mat4();m[12]=x;m[13]=y;m[14]=z;return m}
function sc(x,y,z){let m=mat4();m[0]=x;m[5]=y;m[10]=z;return m}
function rx(a){let m=mat4(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function ry(a){let m=mat4(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function rz(a){let m=mat4(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function persp(fov,asp,n,f){let t=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m}
function look(eye,target,up){let z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x),m=mat4();m[0]=x[0];m[1]=y[0];m[2]=z[0];m[4]=x[1];m[5]=y[1];m[6]=z[1];m[8]=x[2];m[9]=y[2];m[10]=z[2];m[12]=-dot(x,eye);m[13]=-dot(y,eye);m[14]=-dot(z,eye);return m}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){let l=Math.hypot(...a)||1;return a.map(v=>v/l)}
function sphere(lat=18,lon=24){let p=[],n=[],idx=[];for(let y=0;y<=lat;y++){let v=y/lat,th=v*Math.PI;for(let x=0;x<=lon;x++){let u=x/lon,ph=u*TAU,s=Math.sin(th),px=Math.cos(ph)*s,py=Math.cos(th),pz=Math.sin(ph)*s;p.push(px,py,pz);n.push(px,py,pz)}}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){let a=y*(lon+1)+x,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1)}return{p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)}}
function cylinder(seg=18){let p=[],n=[],idx=[];for(let y=0;y<=1;y++)for(let s=0;s<=seg;s++){let a=s/seg*TAU,x=Math.cos(a),z=Math.sin(a);p.push(x,y*2-1,z);n.push(x,0,z)}for(let y=0;y<1;y++)for(let s=0;s<seg;s++){let a=y*(seg+1)+s,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1)}return{p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)}}
function stripGeometry(kind='petal',segments=14){
  const p=[],n=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments;
    let width,arch,tipLift;
    if(kind==='leaf'){
      width=Math.sin(Math.PI*t)*(0.58+0.10*Math.sin(t*7*Math.PI));
      arch=.10*Math.sin(Math.PI*t);
      tipLift=.08*t*t;
    }else if(kind==='bract'){
      width=Math.sin(Math.PI*t)*.42;
      arch=.05*Math.sin(Math.PI*t);
      tipLift=.11*t;
    }else{
      width=Math.pow(Math.sin(Math.PI*t),.72)*.44*(1-.18*t);
      arch=.16*Math.sin(Math.PI*t);
      tipLift=.14*t*t;
    }
    const z=t, y=arch+tipLift;
    p.push(-width,y,z,width,y,z);
    const dz=1/segments;
    const tangent=norm([0,(kind==='petal'?(.16*Math.PI*Math.cos(Math.PI*t)+.28*t):(kind==='leaf'?(.10*Math.PI*Math.cos(Math.PI*t)+.16*t):(.05*Math.PI*Math.cos(Math.PI*t)+.11))),1]);
    const normal=norm(cross([1,0,0],tangent));
    n.push(...normal,...normal);
  }
  for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,b,c,d)}
  return{p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)};
}
function shader(gl,type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function program(gl){let p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VSH));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FSH));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function mesh(gl,g){let m={count:g.i.length};m.pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.bufferData(gl.ARRAY_BUFFER,g.p,gl.STATIC_DRAW);m.nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.nb);gl.bufferData(gl.ARRAY_BUFFER,g.n,gl.STATIC_DRAW);m.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.i,gl.STATIC_DRAW);return m}
const PARTS={
 flower:{label:'Fiore completo',description:'Esplora il capolino della margherita e separa le sue parti con la vista esplosa.',focus:[0,1.52,0],dist:3.0},
 petal:{label:'Fiori ligulati',description:'La corona bianca esterna è resa come una doppia serie di elementi sottili e leggermente curvi.',focus:[.38,1.57,0],dist:2.45},
 head:{label:'Disco centrale',description:'Il centro giallo è costruito con molti piccoli elementi separati per dare più profondità al capolino.',focus:[0,1.56,.04],dist:2.2},
 involucre:{label:'Involucro',description:'Le brattee verdi sotto il capolino formano una corona separata e leggibile nella vista esplosa.',focus:[0,1.35,0],dist:2.35},
 stem:{label:'Gambo',description:'Il gambo resta volutamente semplice, sottile e secondario rispetto al fiore.',focus:[0,.45,0],dist:3.0},
 leaves:{label:'Foglie',description:'Le foglie sono raccolte vicino alla base e modellate come superfici allungate, non più come sfere schiacciate.',focus:[.35,-.25,0],dist:2.55},
 roots:{label:'Radici',description:'L’apparato radicale è rappresentato con più elementi sottili e separabili nella vista esplosa.',focus:[0,-1.08,0],dist:2.5}
};
function createParts(){
  let a=[];const add=(name,shape,pos,scale,rot,color,explode,soft=.25)=>a.push({name,shape,pos,scale,rot,color,explode,base:pos.slice(),soft});
  add('stem','cyl',[0,-.02,0],[.055,.83,.055],[0,0,0],[.16,.43,.22],[0,-.35,0],.1);
  for(let k=0;k<8;k++){
    const ang=k/8*TAU+(k%2*.16),rad=.22+.035*(k%3);
    add('leaves','leaf',[Math.cos(ang)*rad,-.72+(.025*(k%2)),Math.sin(ang)*rad],[.34,.18,.74],[0,ang,0],[.18+.02*(k%2),.46+.03*(k%3),.23],[Math.cos(ang)*.72,-.05,Math.sin(ang)*.72],.35);
  }
  for(let r=0;r<11;r++){
    let ang=r/11*TAU,xx=Math.cos(ang)*.11,zz=Math.sin(ang)*.11;
    add('roots','cyl',[xx,-1.10,zz],[.017,.42+(r%3)*.06,.017],[Math.cos(ang)*.62,ang*.08,-Math.sin(ang)*.62],[.25,.22,.13],[Math.cos(ang)*.55,-.42,Math.sin(ang)*.55],.08);
  }
  for(let ring=0;ring<2;ring++){
    const count=ring===0?26:22,baseRad=ring===0?.28:.22,tilt=ring===0?-.05:.08;
    for(let k=0;k<count;k++){
      let ang=k/count*TAU+(ring?TAU/(count*2):0);
      add('petal','petal',[Math.cos(ang)*baseRad,1.47+ring*.025,Math.sin(ang)*baseRad],[.24,.18,.66-(ring*.05)],[0,ang,tilt],[.97,.97,.93],[Math.cos(ang)*(.56+ring*.04),.16+ring*.05,Math.sin(ang)*(.56+ring*.04)],.75);
    }
  }
  add('head','sph',[0,1.50,0],[.29,.105,.29],[0,0,0],[.86,.58,.07],[0,.34,0],.22);
  const golden=Math.PI*(3-Math.sqrt(5));
  for(let k=0;k<78;k++){
    const rr=.25*Math.sqrt(k/78),ang=k*golden;
    add('head','sph',[Math.cos(ang)*rr,1.58+.025*Math.cos(rr*8),Math.sin(ang)*rr],[.022,.026,.022],[0,0,0],[.98-.12*(k%3===0),.69-.08*(k%4===0),.06],[Math.cos(ang)*.32,.52+rr*.25,Math.sin(ang)*.32],.15);
  }
  for(let ring=0;ring<2;ring++){
    const count=ring===0?14:12,rad=ring===0?.26:.21;
    for(let k=0;k<count;k++){
      let ang=k/count*TAU+(ring?0.18:0);
      add('involucre','bract',[Math.cos(ang)*rad,1.34-ring*.035,Math.sin(ang)*rad],[.16,.12,.36],[0,ang,ring?.1:-.05],[.15,.34+.04*ring,.18],[Math.cos(ang)*.34,-.12-ring*.05,Math.sin(ang)*.34],.3);
    }
  }
  return a;
}
function mount(canvas,opt={}){
  const gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  const fb=document.getElementById('fallback2d');
  if(!gl){canvas.style.display='none';if(fb)fb.style.display='flex';return{toggleExplode(){},reset(){},focus(){},toggleAutoRotate(){}}}
  const pr=program(gl),meshes={
    sph:mesh(gl,sphere(16,22)),cyl:mesh(gl,cylinder(16)),petal:mesh(gl,stripGeometry('petal',16)),leaf:mesh(gl,stripGeometry('leaf',16)),bract:mesh(gl,stripGeometry('bract',12))
  },parts=createParts();
  let yaw=.48,pitch=-.18,dist=4.4,target=[0,.22,0],targetGoal=target.slice(),distGoal=dist,explode=0,explodeGoal=0,auto=!!opt.autoRotate,last=performance.now(),drag=false,lastPt=null,pointers=new Map(),pinchStart=null,selected='flower';
  const loc={pos:gl.getAttribLocation(pr,'aPosition'),nor:gl.getAttribLocation(pr,'aNormal'),mvp:gl.getUniformLocation(pr,'uMVP'),model:gl.getUniformLocation(pr,'uModel'),color:gl.getUniformLocation(pr,'uColor'),light:gl.getUniformLocation(pr,'uLight'),glow:gl.getUniformLocation(pr,'uGlow'),soft:gl.getUniformLocation(pr,'uSoftness')};
  gl.useProgram(pr);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(.025,.055,.04,1);
  function resize(){let d=Math.min(devicePixelRatio||1,1.6),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);gl.viewport(0,0,canvas.width,canvas.height)}}
  function modelOf(p){let ep=p.explode.map(v=>v*explode),m=tr(p.base[0]+ep[0],p.base[1]+ep[1],p.base[2]+ep[2]);m=mul(m,rz(p.rot[2]||0));m=mul(m,ry(p.rot[1]||0));m=mul(m,rx(p.rot[0]||0));m=mul(m,sc(...p.scale));return mul(mul(ry(yaw),rx(pitch)),m)}
  function drawMesh(mm,m,color,viewProj,soft){gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.pos);gl.bindBuffer(gl.ARRAY_BUFFER,m.nb);gl.vertexAttribPointer(loc.nor,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.nor);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.uniformMatrix4fv(loc.model,false,mm);gl.uniformMatrix4fv(loc.mvp,false,mul(viewProj,mm));gl.uniform3fv(loc.color,color);gl.uniform3f(loc.light,2.6,4.6,4.2);gl.uniform1f(loc.glow,.012);gl.uniform1f(loc.soft,soft||.2);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0)}
  function project(point){let root=mul(ry(yaw),rx(pitch)),p=[root[0]*point[0]+root[4]*point[1]+root[8]*point[2]+root[12],root[1]*point[0]+root[5]*point[1]+root[9]*point[2]+root[13],root[2]*point[0]+root[6]*point[1]+root[10]*point[2]+root[14]];let eye=[0,.15,dist],V=look(eye,target,[0,1,0]),P=persp(.72,canvas.width/canvas.height,.1,50),M=mul(P,V),x=M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],y=M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],w=M[3]*p[0]+M[7]*p[1]+M[11]*p[2]+M[15];return[(x/w*.5+.5)*canvas.clientWidth,(-y/w*.5+.5)*canvas.clientHeight]}
  function updateHotspots(){if(!opt.hotspotRoot)return;const map={flower:[0,1.68,0],stem:[0,.35,0],leaves:[.34,-.66,0],roots:[0,-1.18,0],head:[0,1.58,.02]};Object.entries(map).forEach(([name,pt])=>{let el=opt.hotspotRoot.querySelector(`[data-part="${name}"]`);if(!el)return;let s=project(pt);el.style.left=s[0]+'px';el.style.top=s[1]+'px'})}
  function tick(t){resize();let dt=Math.min((t-last)/1000,.05);last=t;if(auto&&!drag)yaw+=dt*.15;explode+=(explodeGoal-explode)*Math.min(1,dt*5.5);dist+=(distGoal-dist)*Math.min(1,dt*5);for(let i=0;i<3;i++)target[i]+=(targetGoal[i]-target[i])*Math.min(1,dt*5);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);let P=persp(.72,canvas.width/canvas.height,.1,50),V=look([0,.15,dist],target,[0,1,0]),VP=mul(P,V);for(const p of parts)drawMesh(modelOf(p),meshes[p.shape],p.color,VP,p.soft);updateHotspots();requestAnimationFrame(tick)}
  function reset(){yaw=.48;pitch=-.18;distGoal=4.4;targetGoal=[0,.22,0];explodeGoal=0;selected='flower';updateSelection();if(opt.onPart)opt.onPart({label:'Pianta completa',description:'Ruota la margherita, avvicinati con lo zoom oppure usa la vista esplosa per separare le parti.'})}
  function focus(name){let info=PARTS[name]||PARTS.flower;selected=name;targetGoal=info.focus.slice();distGoal=info.dist;auto=false;updateSelection();if(opt.onPart)opt.onPart(info)}
  function toggleExplode(){explodeGoal=explodeGoal>.5?0:1}
  function toggleAutoRotate(){auto=!auto}
  function updateSelection(){if(opt.partRail)opt.partRail.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.part===selected))}
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag=true;lastPt=[e.clientX,e.clientY]});
  canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);let vals=[...pointers.values()];if(vals.length===1&&lastPt){let dx=e.clientX-lastPt[0],dy=e.clientY-lastPt[1];yaw+=dx*.006;pitch=Math.max(-1.1,Math.min(.8,pitch+dy*.005));lastPt=[e.clientX,e.clientY]}else if(vals.length===2){let d=Math.hypot(vals[0][0]-vals[1][0],vals[0][1]-vals[1][1]);if(pinchStart)distGoal=Math.max(1.8,Math.min(7.2,distGoal+(pinchStart-d)*.008));pinchStart=d}});
  function end(e){pointers.delete(e.pointerId);if(!pointers.size){drag=false;lastPt=null;pinchStart=null}}
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('wheel',e=>{e.preventDefault();distGoal=Math.max(1.8,Math.min(7.2,distGoal+e.deltaY*.003))},{passive:false});canvas.addEventListener('dblclick',()=>focus('flower'));
  if(opt.partRail){['flower','petal','head','involucre','stem','leaves','roots'].forEach(name=>{let b=document.createElement('button');b.textContent=PARTS[name].label;b.dataset.part=name;b.addEventListener('click',()=>focus(name));opt.partRail.appendChild(b)})}
  if(opt.hotspotRoot){['flower','stem','leaves','roots','head'].forEach(name=>{let b=document.createElement('button');b.className='hotspot';b.dataset.part=name;b.setAttribute('aria-label','Focus '+PARTS[name].label);b.innerHTML='<span>'+PARTS[name].label+'</span>';b.addEventListener('click',()=>focus(name));opt.hotspotRoot.appendChild(b)})}
  if(opt.onPart)opt.onPart({label:'Pianta completa',description:'Ruota la margherita, avvicinati con lo zoom oppure usa la vista esplosa per separare le parti.'});
  requestAnimationFrame(tick);
  return{toggleExplode,reset,focus,toggleAutoRotate}
}
window.Herbarium3D={mount};
})();