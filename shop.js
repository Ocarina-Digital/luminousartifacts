/* Luminous Artifacts · shop.js
   The lamps themselves: the sample prints shown until real photos are added, the live prints from the store,
   and how a print is drawn on the drying line. Used by the home page, the shop, each lamp's page and the drawer. */
(function(){
'use strict';
const {reduce,rng,renderScene,order,sfx}=window.LA;

/* tone any photo to look like a print under the safelight (same curve as the drawn scenes) */
function toneCanvas(img,w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const s=Math.max(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*s,dh=img.naturalHeight*s;
  x.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
  try{const im=x.getImageData(0,0,w,h),d=im.data,cx=w/2,cy=h/2,md=Math.hypot(cx,cy);
    for(let i=0;i<d.length;i+=4){const q=i/4,px=q%w,py=(q/w)|0;let L=d[i]*.3+d[i+1]*.59+d[i+2]*.11;L+=(Math.random()-.5)*22;
      const v=Math.hypot(px-cx,py-cy)/md;L*=1-.3*v*v;L=Math.max(0,Math.min(255,L));d[i]=Math.min(255,26+L*.98);d[i+1]=6+L*.71;d[i+2]=5+L*.62}
    x.putImageData(im,0,0)}catch(e){}
  return c}
const blobUrl=id=>/^[0-9a-f]{32}$/i.test(String(id))?'/_blob/'+id:'data:,';
function fmtPrice(v){const n=parseFloat(String(v??'').replace(/[^0-9.]/g,''));return n>0?'$'+(Number.isInteger(n)?n:n.toFixed(2)):''}
const noOf=n=>'No. '+String(n).padStart(3,'0');
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function deckle(seed){const r=rng(seed),pts=[],n=26,amp=1.5;
  const edge=(x0,y0,x1,y1,nx,ny)=>{for(let i=0;i<n;i++){const s=i/n,d=(i%2?amp:0)+r()*amp*.6;pts.push(`${(x0+(x1-x0)*s+nx*d).toFixed(2)}% ${(y0+(y1-y0)*s+ny*d).toFixed(2)}%`)}};
  edge(0,0,100,0,0,1);edge(100,0,100,100,-1,0);edge(100,100,0,100,0,-1);edge(0,100,0,0,1,0);return `polygon(${pts.join(',')})`}

/* samples shown until real photos are added */
const SAMPLES=[
  {scene:'boxcam',title:'The Brownie',camera:'Box camera, 1950s',status:'available',no:14},
  {scene:'tlr',title:'The Twin',camera:'Twin-lens reflex, 1950s',status:'spoken for',no:15},
  {scene:'bellows',title:'The Accordion',camera:'Folding bellows, 1930s',status:'available',no:16},
  {scene:'rangefinder',title:'The Desk Arm',camera:'Rangefinder, swing arm',status:'to order',no:17},
  {scene:'movie',title:'The Projectionist',camera:'8mm movie camera',status:'available',no:18},
];
const isOpen=it=>!/spoken|sold/i.test(it.status||'');
const keyOf=it=>it.id?('p-'+it.id):('no-'+String(it.no).padStart(3,'0'));
const lampHref=it=>it.slug?it.slug+'.html':'lamp.html#'+keyOf(it);   // real lamps on the public site have their own page
function askHref(it){const p=new URLSearchParams();const name=noOf(it.no)+', '+(it.title||'Untitled lamp');
  if(isOpen(it))p.set('ask',name);else{p.set('ask','One like '+name);p.set('find','1')}return 'commission.html#'+p}
const buyUrl=it=>/^https:\/\//i.test(it.buyUrl||'')?it.buyUrl:'';

/* drawing a print: a photo when there is one, otherwise a sample scene painted when it nears the screen */
const sceneIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;sceneIO.unobserve(e.target);paintScene(e.target)}),{rootMargin:'600px 0px'}):null;
function paintScene(c){const draw=()=>c.getContext('2d').drawImage(renderScene(c.dataset.scene,c.width,c.height,+c.dataset.seed),0,0);window.requestIdleCallback?requestIdleCallback(draw,{timeout:250}):setTimeout(draw,0)}   // a deadline, so a busy page can't starve it
function picture(it,w,h,seedBase){const title=it.title||'Untitled lamp',cam=it.camera||'';
  const scene=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.dataset.scene=it.scene||order[(+it.no||0)%order.length];c.dataset.seed=seedBase+order.indexOf(c.dataset.scene)*29;
    c.setAttribute('role','img');c.setAttribute('aria-label',title+', a lamp converted from a '+cam.toLowerCase());sceneIO?sceneIO.observe(c):paintScene(c);return c};
  if(it.image||it.assetId){const im=new Image();im.alt=title+(cam?', converted from a '+cam:'');im.loading='lazy';im.decoding='async';
    im.addEventListener('error',()=>{if(im.isConnected)im.replaceWith(scene())},{once:true});   // a missing or misnamed photo falls back to the drawn print, never a broken image
    im.src=it.image||blobUrl(it.assetId);return im}
  return scene()}

function printEl(it,i){
  const no=noOf(it.no),title=it.title||'Untitled lamp',cam=it.camera||'',st=it.status||'available',open=isOpen(it);
  const f=el('figure','print');
  f.innerHTML=`<span class="pin" aria-hidden="true"></span><button class="flip" type="button"><span class="face front"></span>
    <span class="face back" aria-hidden="true"><span class="bk-h">Luminous Artifacts<br>Vintage Camera Lamps</span><svg><use href="#seal"/></svg>
    <span><span class="bk-no"></span><br><span class="bk-name"></span><br><span class="bk-st"></span></span></span></button>
    <figcaption><span class="tape"></span><small></small><span class="price" hidden></span><span class="buyrow"><a class="buy btn solid" hidden target="_blank" rel="noopener noreferrer">Buy this lamp</a><a class="ask"></a></span></figcaption>`;
  f.querySelector('.flip').setAttribute('aria-label',title+'. Turn the print over');
  f.querySelector('.bk-no').textContent=no;
  const bn=f.querySelector('.bk-name');bn.append(title);if(cam)bn.append(document.createElement('br'),cam);
  f.querySelector('.bk-st').textContent=st;
  f.querySelector('figcaption .tape').textContent=title;
  const sm=f.querySelector('figcaption small');if(cam)sm.append(cam,document.createElement('br'));sm.append(no+' · '+st);
  const ask=f.querySelector('.ask');ask.href=lampHref(it);ask.textContent=open?'See this lamp →':'See the lamp →';
  const priceTxt=fmtPrice(it.price);
  if(priceTxt){const pr=f.querySelector('.price');pr.hidden=false;pr.textContent=/sold/i.test(st)?'Sold':priceTxt;if(/sold/i.test(st))pr.classList.add('sold')}
  const buy=f.querySelector('.buy'),bu=buyUrl(it);
  if(open&&bu){buy.hidden=false;buy.href=bu;buy.setAttribute('aria-label',`Buy ${title}${priceTxt?' for '+priceTxt:''}`)}
  f.querySelector('.front').appendChild(picture(it,320,400,300));
  if(/avail/i.test(st)){const av=document.createElement('span');av.className='avail';av.setAttribute('aria-hidden','true');av.textContent='Available';f.appendChild(av)}
  // the lamp in the picture switches on when you look at it: a warm glow placed on its bulb (or its beam)
  const LIGHT={boxcam:[50,13],tlr:[50,9],bellows:[23,19],rangefinder:[55,40],movie:[66,57]};const at=LIGHT[it.scene]||[50,32];
  const gl=document.createElement('span');gl.className='bulbglow';gl.setAttribute('aria-hidden','true');gl.style.setProperty('--gx',at[0]+'%');gl.style.setProperty('--gy',at[1]+'%');
  f.querySelector('.front').appendChild(gl);
  f.querySelectorAll('.face').forEach(x=>x.style.clipPath=deckle(40+i));
  f.querySelector('.flip').addEventListener('click',()=>{f.classList.toggle('flipped');sfx.paper()});
  return f}

/* hang a set of prints on wires, five to a line; prints develop as they reach the light, and the line sways when you scroll */
const swaying=new WeakSet();
function renderLine(box,items,perLine=5){
  box.textContent='';
  for(let r=0;r<items.length;r+=perLine){
    const line=el('div','line');
    line.innerHTML='<svg class="wire" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6 Q500 46 1000 6" fill="none" stroke="#3d130b" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
    const row=el('div','prints');items.slice(r,r+perLine).forEach((it,k)=>row.appendChild(printEl(it,r+k)));line.appendChild(row);box.appendChild(line)}
  if(!reduce&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{let k=0;es.forEach(e=>{if(e.isIntersecting){const f=e.target;io.unobserve(f);setTimeout(()=>f.classList.remove('latent'),60+(k++)*110)}})},{threshold:.12});
    box.querySelectorAll('.print').forEach(f=>{f.classList.add('latent');io.observe(f)})}
  watchLit(box);
  if(!reduce&&!swaying.has(box)){swaying.add(box);let last=scrollY,lt=performance.now(),q=false,settle;
    addEventListener('scroll',()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;const now=performance.now(),v=(scrollY-last)/Math.max(16,now-lt);last=scrollY;lt=now;
      box.style.setProperty('--wind',Math.max(-5,Math.min(5,v*3.2)).toFixed(2)+'deg');clearTimeout(settle);settle=setTimeout(()=>box.style.setProperty('--wind','0deg'),140)})},{passive:true})}
}

/* on touch screens there's no hover: whichever print sits in the middle of the screen has its lamp on */
const litIO=matchMedia('(hover:none)').matches&&'IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('lit',e.isIntersecting)),{rootMargin:'-38% 0px -38% 0px'}):null;
const watchLit=box=>{if(litIO)box.querySelectorAll('.print').forEach(f=>litIO.observe(f))};
/* the live line: the samples until real prints exist, then the prints from the store, in hanging order */
let PRINTS=[];const subs=[];
// on the public site the catalog is written into the page (from lamps.json); here, prints come from the store
let CATALOG=(Array.isArray(window.LAMPS)?window.LAMPS:[]).map(l=>Object.assign({scene:order[(+l.no||0)%order.length]},l));   // a lamp without a photo yet shows a drawn scene
/* on the live site, lamps.json is also read straight from the server, so editing that one file (and dropping photos in photos/)
   updates the shop without rebuilding anything. Every field is checked: text stays text, photos must live in photos/,
   buy links must be plain https:// addresses. */
const clean=l=>{if(!l||!l.title||!Number.isFinite(+l.no))return null;const t=v=>String(v==null?'':v).replace(/[\u0000-\u001f]/g,' ').trim();
  const o={no:Math.round(+l.no),title:t(l.title).slice(0,80),camera:t(l.camera).slice(0,90),status:t(l.status||'available').slice(0,24).toLowerCase(),details:t(l.details).slice(0,800)};
  const pr=t(l.price).replace(/[$,\s]/g,'');if(/^\d{1,6}(\.\d{1,2})?$/.test(pr))o.price=pr;
  if(/^photos\/[\w.\-\/]+\.(jpe?g|png|webp|avif)$/i.test(t(l.image))&&!/\.\./.test(l.image))o.image=t(l.image);
  if(/^https:\/\/[^\s"'<>]+$/i.test(t(l.buyUrl)))o.buyUrl=t(l.buyUrl);
  const built=Array.isArray(window.LAMPS)?window.LAMPS.find(b=>+b.no===o.no&&b.slug):null;if(built)o.slug=built.slug;   // a lamp that was built into its own page keeps linking there
  o.scene=order[o.no%order.length];return o};
let pending=null,changed=false;
if(/^https?:$/.test(location.protocol)&&!window.claude){
  pending=Promise.race([fetch('lamps.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{
      const L=(j&&Array.isArray(j.lamps)?j.lamps:[]).map(clean).filter(Boolean);
      const sig=a=>JSON.stringify(a.map(x=>[x.no,x.title,x.camera,x.status,x.price,x.image,x.buyUrl,x.details]));
      if(L.length&&sig(L)!==sig(CATALOG)){CATALOG=L;changed=true}}).catch(()=>{}),
    new Promise(r=>setTimeout(r,900))]).then(()=>{pending=null;if(changed)subs.forEach(cb=>cb(current(),true))})}
const current=()=>PRINTS.length?PRINTS:CATALOG.length?CATALOG:SAMPLES;
function onPrints(cb){subs.push(cb);if(pending&&!CATALOG.length)pending.then(()=>{if(!CATALOG.length)cb(current(),false)});else cb(current(),PRINTS.length>0||CATALOG.length>0)}
function find(key){return current().find(it=>keyOf(it)===key)||SAMPLES.find(it=>keyOf(it)===key)||null}
const ready=(async()=>{
  const c=window.claude;if(!c||!c.use)return null;
  const db=await c.use('db');if(!db)return null;
  const col=db.collection('prints');
  let lastKey='';
  col.onSnapshot(snap=>{
    const rows=snap.docs.map(d=>Object.assign({id:d.id},d.data())).filter(r=>/^[0-9a-f]{32}$/i.test(String(r.assetId||''))).sort((a,b)=>(a.order||0)-(b.order||0));
    const key=JSON.stringify(rows);if(key===lastKey)return;lastKey=key;PRINTS=rows;subs.forEach(cb=>cb(current(),PRINTS.length>0))
  },()=>{});
  return {db,col}})().catch(()=>null);

const src=it=>it.image||blobUrl(it.assetId);
window.SHOP={src,SAMPLES,onPrints,current,find,keyOf,lampHref,askHref,buyUrl,isOpen,printEl,renderLine,picture,toneCanvas,blobUrl,fmtPrice,noOf,el,deckle,ready,prints:()=>PRINTS};
})();
