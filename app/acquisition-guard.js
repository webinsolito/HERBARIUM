const DEFAULTS={maxBytes:18*1024*1024,maxPixels:24_000_000,maxEdge:4096,outputEdge:1600,quality:.82};
const ACCEPTED=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
const now=()=>globalThis.performance?.now?.()??Date.now();

export function validateImageFile(file,opt={}){
  const c={...DEFAULTS,...opt};
  if(!file)return{ok:false,code:'NO_FILE',message:'Nessuna foto selezionata.'};
  const type=(file.type||'').toLowerCase();
  if(type&&!ACCEPTED.has(type))return{ok:false,code:'TYPE',message:'Formato foto non supportato. Usa JPEG, PNG, WebP o una foto iPhone.'};
  if(!file.size)return{ok:false,code:'EMPTY',message:'La foto è vuota o non leggibile.'};
  if(file.size>c.maxBytes)return{ok:false,code:'TOO_LARGE',message:'Foto troppo pesante. Prova a scattarla di nuovo o scegli una versione più piccola.'};
  return{ok:true,config:c};
}

function decode(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('DECODE'))};
    img.src=url;
  });
}

function metrics(start,file,w,h,blob,resized){
  return Object.freeze({
    prepareMs:Math.max(0,Math.round(now()-start)),
    inputBytes:file.size||0,
    inputPixels:w*h,
    outputBytes:blob.size||file.size||0,
    outputPixels:(blob.__herbariumWidth||w)*(blob.__herbariumHeight||h),
    resized
  });
}

export async function prepareImageFile(file,opt={}){
  const start=now(),v=validateImageFile(file,opt);
  if(!v.ok)return v;
  try{
    const img=await decode(file),{config:c}=v,w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h)return{ok:false,code:'DECODE',message:'Non riesco a leggere questa foto.'};
    if(w*h>c.maxPixels||Math.max(w,h)>c.outputEdge){
      const scale=Math.min(1,c.outputEdge/Math.max(w,h)),cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale)),canvas=document.createElement('canvas');
      canvas.width=cw;canvas.height=ch;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)return{ok:false,code:'CANVAS',message:'Il dispositivo non riesce a preparare questa foto.'};
      ctx.drawImage(img,0,0,cw,ch);
      const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',c.quality));
      canvas.width=1;canvas.height=1;
      if(!blob)return{ok:false,code:'COMPRESS',message:'Non riesco a preparare la foto. Riprova con un’altra immagine.'};
      Object.defineProperties(blob,{__herbariumWidth:{value:cw},__herbariumHeight:{value:ch}});
      return{ok:true,blob,width:cw,height:ch,resized:true,original:{width:w,height:h,bytes:file.size},metrics:metrics(start,file,w,h,blob,true)};
    }
    return{ok:true,blob:file,width:w,height:h,resized:false,original:{width:w,height:h,bytes:file.size},metrics:metrics(start,file,w,h,file,false)};
  }catch{
    return{ok:false,code:'DECODE',message:'Foto non leggibile. Riprova dalla fotocamera o dalla libreria.'};
  }
}

function optimizedFile(blob,source){
  if(blob===source)return source;
  if(typeof File!=='function')return blob;
  const base=(source.name||'foto').replace(/\.[^.]+$/,'');
  return new File([blob],`${base}-herbarium.jpg`,{type:'image/jpeg',lastModified:source.lastModified||Date.now()});
}

export function installAcquisitionGuard(doc=document){
  const grid=doc.querySelector('#captureGrid');
  if(!grid)return{attached:false,reason:'capture-grid-missing'};
  if(grid.dataset.herbariumAcquisitionGuard==='true'){
    return{attached:true,reused:true,authoritative:true,transport:'memory-handoff',outputEdge:DEFAULTS.outputEdge};
  }

  let box=doc.querySelector('#acquisitionStatus');
  if(!box){
    box=doc.createElement('div');
    box.id='acquisitionStatus';
    box.className='card hidden';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');
    grid.insertAdjacentElement('afterend',box);
  }

  const show=(kind,text)=>{
    box.classList.remove('hidden');
    box.innerHTML=`<span class="k">Foto</span><p class="notice ${kind==='error'?'bad':kind==='ok'?'ok':'warn'}">${text}</p>`;
  };
  const preparedByInput=new WeakMap();
  const passthroughEvents=new WeakSet();
  const inFlight=new WeakSet();

  const consume=input=>{
    const payload=preparedByInput.get(input)||null;
    if(payload)preparedByInput.delete(input);
    return payload;
  };

  grid.dataset.herbariumAcquisitionGuard='true';
  grid.addEventListener('change',async event=>{
    if(passthroughEvents.has(event))return;
    const input=event.target?.closest?.('input[type=file]');
    if(!input||!grid.contains(input))return;
    event.stopImmediatePropagation();
    if(!input.isConnected||inFlight.has(input))return;

    const file=input.files?.[0];
    if(!file)return;
    inFlight.add(input);
    input.dataset.herbariumBusy='true';
    input.setAttribute('aria-busy','true');
    input.setAttribute('accept','image/*');
    input.removeAttribute('capture');
    show('wait','Preparo la foto sul dispositivo…');

    try{
      const result=await prepareImageFile(file);
      if(!result.ok){
        preparedByInput.delete(input);
        input.value='';
        show('error',result.message+' Il riconoscimento resta UNKNOWN.');
        doc.defaultView.dispatchEvent(new CustomEvent('herbarium:acquisition-error',{detail:{code:result.code}}));
        return;
      }

      const authoritative=optimizedFile(result.blob,file);
      preparedByInput.set(input,{file:authoritative,result,metrics:result.metrics});
      input.dataset.herbariumPrepared='true';
      input.dataset.herbariumResized=String(result.resized);
      show('ok',result.resized?`Foto ottimizzata sul dispositivo · ${result.width}×${result.height}px`:'Foto verificata · dimensioni già adatte.');
      doc.defaultView.dispatchEvent(new CustomEvent('herbarium:acquisition-ready',{detail:{metrics:result.metrics,resized:result.resized,width:result.width,height:result.height}}));

      if(!input.isConnected){preparedByInput.delete(input);return}
      const resume=new Event('change',{bubbles:true});
      passthroughEvents.add(resume);
      input.dispatchEvent(resume);
    }finally{
      inFlight.delete(input);
      input.dataset.herbariumBusy='false';
      input.removeAttribute('aria-busy');
    }
  },{capture:true});

  const api=Object.freeze({
    prepare:prepareImageFile,
    consume,
    show,
    hasPrepared:input=>preparedByInput.has(input)
  });
  doc.defaultView.HerbariumAcquisition=api;
  return{attached:true,inputs:grid.querySelectorAll('input[type=file]').length,authoritative:true,transport:'memory-handoff',delegated:true,outputEdge:DEFAULTS.outputEdge};
}
