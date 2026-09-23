export const QUALITY_VERSION='pixel-quality-v1';
export const QUALITY_LIMITS=Object.freeze({
  minSide:128,
  minMeanLuma:22,
  maxMeanLuma:238,
  minContrastStd:10,
  minEdgeEnergy:5.5
});

function decodeEvidence(entry){
  if(!entry?.data||!entry.width||!entry.height)return Promise.resolve(null);
  const blob=new Blob([entry.data],{type:entry.type||'image/jpeg'});
  if('createImageBitmap' in globalThis){
    return createImageBitmap(blob).then(image=>({image,close:()=>image.close?.()}));
  }
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob),image=new Image();
    image.onload=()=>resolve({image,close:()=>URL.revokeObjectURL(url)});
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('quality-decode-failed'));};
    image.src=url;
  });
}

function pixelStats(image){
  const size=96,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
  if(!ctx)throw new Error('quality-canvas-unavailable');
  ctx.drawImage(image,0,0,size,size);
  const rgba=ctx.getImageData(0,0,size,size).data;
  const gray=new Float32Array(size*size);
  let sum=0;
  for(let i=0,p=0;i<rgba.length;i+=4,p++){
    const y=.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];
    gray[p]=y;sum+=y;
  }
  const mean=sum/gray.length;
  let variance=0,edge=0,edges=0;
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=y*size+x,d=gray[i]-mean;variance+=d*d;
      if(x){edge+=Math.abs(gray[i]-gray[i-1]);edges++;}
      if(y){edge+=Math.abs(gray[i]-gray[i-size]);edges++;}
    }
  }
  return{meanLuma:mean,contrastStd:Math.sqrt(variance/gray.length),edgeEnergy:edge/Math.max(1,edges)};
}

export function decideQualityFromStats(stats,limits=QUALITY_LIMITS){
  if(!stats||!Number.isFinite(stats.meanLuma)||!Number.isFinite(stats.contrastStd)||!Number.isFinite(stats.edgeEnergy)){
    return{status:'UNKNOWN',usable:false,reasons:['invalid-stats']};
  }
  const reasons=[];
  if(stats.width<limits.minSide||stats.height<limits.minSide)reasons.push('too-small');
  if(stats.meanLuma<limits.minMeanLuma)reasons.push('too-dark');
  if(stats.meanLuma>limits.maxMeanLuma)reasons.push('too-bright');
  if(stats.contrastStd<limits.minContrastStd)reasons.push('low-contrast');
  if(stats.edgeEnergy<limits.minEdgeEnergy)reasons.push('blur-or-flat');
  return{status:reasons.length?'UNUSABLE':'PASS',usable:reasons.length===0,reasons};
}

export async function assessEvidenceQuality(evidence,{maxViews=3}={}){
  const views=(Array.isArray(evidence)?evidence:[]).filter(Boolean).slice(0,maxViews);
  if(!views.length)return{version:QUALITY_VERSION,status:'UNKNOWN',usable:false,reason:'no-evidence',views:[]};
  const results=[];
  for(const entry of views){
    if(entry.width<QUALITY_LIMITS.minSide||entry.height<QUALITY_LIMITS.minSide){
      results.push({role:entry.role||null,width:entry.width||0,height:entry.height||0,status:'UNUSABLE',usable:false,reasons:['too-small']});
      continue;
    }
    let decoded=null;
    try{
      decoded=await decodeEvidence(entry);
      if(!decoded){results.push({role:entry.role||null,status:'UNKNOWN',usable:false,reasons:['decode-unavailable']});continue;}
      const stats={...pixelStats(decoded.image),width:entry.width,height:entry.height};
      results.push({role:entry.role||null,...stats,...decideQualityFromStats(stats)});
    }catch{
      results.push({role:entry.role||null,status:'UNKNOWN',usable:false,reasons:['quality-error']});
    }finally{decoded?.close?.();}
  }
  const usable=results.filter(x=>x.usable);
  if(!usable.length)return{version:QUALITY_VERSION,status:'UNUSABLE',usable:false,reason:'no-usable-view',views:results};
  return{version:QUALITY_VERSION,status:usable.length===results.length?'PASS':'WARN',usable:true,reason:usable.length===results.length?'all-views-usable':'partial-views-usable',views:results};
}
