/* Local, offline-first subject evidence adapter.
 * Uses image pixels only; no network and no species claim.
 * Conservative heuristic: vegetation-like chroma + texture can support PLANT,
 * while weak vegetation evidence supports NON_PLANT only when quality is usable.
 */
const clamp=v=>Math.max(0,Math.min(1,v));

export function evidenceFromPixels({data,width,height,quality=1}={}){
  if(!data||!width||!height) return {plant:0,nonPlant:0,quality:0,source:'local-pixels'};
  let green=0,natural=0,edge=0,n=0,prev=null;
  const stride=Math.max(4,Math.floor((width*height)/12000)*4);
  for(let i=0;i<data.length;i+=stride){
    const r=data[i],g=data[i+1],b=data[i+2]; if(!Number.isFinite(b)) break;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max?((max-min)/max):0;
    const greenDominance=(g-Math.max(r,b))/255;
    if(greenDominance>.035&&sat>.12) green++;
    if((g>r*.82&&g>b*.88&&sat>.08)||(r>g*.82&&g>b*.72&&sat>.16)) natural++;
    const lum=.2126*r+.7152*g+.0722*b;
    if(prev!==null&&Math.abs(lum-prev)>22) edge++;
    prev=lum;n++;
  }
  if(!n) return {plant:0,nonPlant:0,quality:0,source:'local-pixels'};
  const greenRatio=green/n,naturalRatio=natural/n,texture=edge/Math.max(1,n-1);
  const plant=clamp(greenRatio*2.7+naturalRatio*.55+Math.min(texture,.35)*.35);
  const nonPlant=clamp((1-greenRatio)*.48+(naturalRatio<.18?.22:0)+(texture<.035?.12:0));
  return {plant:+plant.toFixed(3),nonPlant:+nonPlant.toFixed(3),quality:clamp(quality),source:'local-pixels',features:{greenRatio:+greenRatio.toFixed(3),naturalRatio:+naturalRatio.toFixed(3),texture:+texture.toFixed(3)}};
}

export async function evidenceFromImageElement(img,quality=1){
  const max=192,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,width,height);
  return evidenceFromPixels({...ctx.getImageData(0,0,width,height),quality});
}
