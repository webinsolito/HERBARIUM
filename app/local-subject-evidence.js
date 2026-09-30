/* Local, offline-first subject evidence adapter. Pixel-only, no species claim. */
const clamp=value=>Math.max(0,Math.min(1,value));
const rounded=value=>+value.toFixed(3);
const now=()=>globalThis.performance?.now?.()??Date.now();

export function evidenceFromPixels({data,width,height,quality=1}={}){
  if(!data||!width||!height)return{plant:0,nonPlant:0,quality:0,source:'local-pixels'};

  let green=0,natural=0,edge=0,n=0,prev=null;
  let lumSum=0,lumSum2=0,rSum=0,gSum=0,bSum=0,rSum2=0,gSum2=0,bSum2=0;
  const stride=Math.max(4,Math.floor((width*height)/12000)*4);
  for(let i=0;i<data.length;i+=stride){
    const r=data[i],g=data[i+1],b=data[i+2];
    if(!Number.isFinite(b))break;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max?((max-min)/max):0;
    const greenDominance=(g-Math.max(r,b))/255;
    if(greenDominance>.035&&sat>.12)green++;
    if((g>r*.82&&g>b*.88&&sat>.08)||(r>g*.82&&g>b*.72&&sat>.16))natural++;
    const lum=.2126*r+.7152*g+.0722*b;
    if(prev!==null&&Math.abs(lum-prev)>22)edge++;
    prev=lum;lumSum+=lum;lumSum2+=lum*lum;
    rSum+=r;gSum+=g;bSum+=b;rSum2+=r*r;gSum2+=g*g;bSum2+=b*b;n++;
  }
  if(!n)return{plant:0,nonPlant:0,quality:0,source:'local-pixels'};

  const greenRatio=green/n,naturalRatio=natural/n,texture=edge/Math.max(1,n-1);
  const variance=(sum,sum2)=>Math.max(0,sum2/n-(sum/n)**2);
  const lumaStd=Math.sqrt(Math.max(0,lumSum2/n-(lumSum/n)**2))/64;
  const colorSpread=Math.sqrt((variance(rSum,rSum2)+variance(gSum,gSum2)+variance(bSum,bSum2))/3)/72;
  const structure=clamp(texture*1.8+lumaStd*.58+colorSpread*.55);
  const uniformGreen=greenRatio>.5&&texture<.025&&lumaStd<.12&&colorSpread<.12;

  // Green alone is not botanical evidence: flat green fabric/walls must fail closed.
  const plant=clamp(greenRatio*.62+naturalRatio*.2+structure*.45-(uniformGreen?.38:0));
  const nonPlant=clamp(
    (1-greenRatio)*.44+
    (naturalRatio<.16?.2:0)+
    (structure<.12?.14:0)+
    (uniformGreen?.72:0)
  );
  return{
    plant:rounded(plant),nonPlant:rounded(nonPlant),quality:clamp(quality),source:'local-pixels-v2',
    features:{
      greenRatio:rounded(greenRatio),naturalRatio:rounded(naturalRatio),texture:rounded(texture),
      lumaStd:rounded(lumaStd),colorSpread:rounded(colorSpread),structure:rounded(structure),uniformGreen
    }
  };
}

export async function evidenceFromImageElement(img,quality=1){
  if(!(img.complete&&img.naturalWidth)){
    if(typeof img.decode==='function'){try{await img.decode()}catch{}}
    if(!(img.complete&&img.naturalWidth)){
      if(img.complete)throw new Error('DECODE');
      await new Promise((resolve,reject)=>{
        const done=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(new Error('DECODE'))};
        const cleanup=()=>{img.removeEventListener('load',done);img.removeEventListener('error',fail)};
        img.addEventListener('load',done,{once:true});img.addEventListener('error',fail,{once:true});
      });
    }
  }
  const started=now(),max=160,sourceW=img.naturalWidth||img.width,sourceH=img.naturalHeight||img.height;
  const scale=Math.min(1,max/Math.max(sourceW,sourceH)),width=Math.max(1,Math.round(sourceW*scale)),height=Math.max(1,Math.round(sourceH*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('CANVAS');
  ctx.drawImage(img,0,0,width,height);
  const pixels=ctx.getImageData(0,0,width,height),result=evidenceFromPixels({
    data:pixels.data,width:pixels.width,height:pixels.height,quality
  });
  canvas.width=1;canvas.height=1;
  return{...result,analysis:{ms:Math.max(0,Math.round(now()-started)),width,height,pixels:width*height,sourceWidth:sourceW,sourceHeight:sourceH}};
}
