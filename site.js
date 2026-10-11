/* Luminous Artifacts · site.js
   Shared by every page: the safelight room, the sound knob, the lens menu and iris, the drawn sample photographs,
   and the shop links. Page scripts read what they need from window.LA. */
(function(){
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let irisBusy=false;   // while the aperture moves, the background room holds still so every frame goes to the iris
/* ===== YOUR SHOP LINKS: paste the full addresses between the quotes before launch ===== */
const SHOP_LINKS={
  ebay:'https://www.ebay.com/sch/i.html?_ssn=tirol28',   // every listing from the tirol28 eBay account
  etsy:'',        // e.g. https://www.etsy.com/shop/YourShop
  instagram:'https://www.instagram.com/luminousartifacts/'
};

/* ---------- seeded random ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- scenes (drawn in greyscale, then toned) ---------- */
const g = v => `rgb(${v},${v},${v})`;
function grad(ctx,y0,y1,a,b){const gr=ctx.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,g(a));gr.addColorStop(1,g(b));return gr}

const scenes = {};
/* shared studio set: dark backdrop, a table edge, a glowing lens and its spill */
function studio(ctx,w,h,r,tableY){
  ctx.fillStyle=grad(ctx,0,tableY,62,30);ctx.fillRect(0,0,w,tableY);
  ctx.fillStyle=grad(ctx,tableY,h,96,40);ctx.fillRect(0,tableY,w,h-tableY);
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(0,tableY,w,1.5);
  for(let i=0;i<40;i++){ctx.fillStyle=`rgba(0,0,0,${r()*.12})`;ctx.fillRect(0,tableY+r()*(h-tableY),w,1)}
}
function bloom(ctx,x,y,rad,str){
  const gr=ctx.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(255,255,255,${str})`);gr.addColorStop(.35,`rgba(255,255,255,${str*.35})`);gr.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gr;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
}
function lens(ctx,x,y,R,lit){
  ctx.fillStyle=g(12);ctx.beginPath();ctx.arc(x,y,R*1.25,0,7);ctx.fill();
  ctx.strokeStyle=g(150);ctx.lineWidth=R*.12;ctx.beginPath();ctx.arc(x,y,R*1.1,0,7);ctx.stroke();
  ctx.strokeStyle=g(70);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,R*1.22,0,7);ctx.stroke();
  if(lit){bloom(ctx,x,y,R*5,.85);ctx.fillStyle=g(255);ctx.beginPath();ctx.arc(x,y,R*.82,0,7);ctx.fill()}
  else{ctx.fillStyle=g(40);ctx.beginPath();ctx.arc(x,y,R*.82,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(x-R*.3,y-R*.3,R*.18,0,7);ctx.fill()}
}
function leather(ctx,x,y,w,h,r,tone){
  ctx.fillStyle=g(tone);ctx.fillRect(x,y,w,h);
  for(let i=0;i<w*h/30;i++){ctx.fillStyle=r()<.5?'rgba(0,0,0,.25)':'rgba(255,255,255,.05)';ctx.fillRect(x+r()*w,y+r()*h,1.5,1.5)}
}
function spill(ctx,x,y,rad,s){bloom(ctx,x,y,rad,s)}
/* the lamp cord, with its inline rocker switch */
function cord(ctx,x0,y0,x1,y1,cx,cy){ctx.strokeStyle=g(14);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx,cy,x1,y1);ctx.stroke();
  const t=.42,px=(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,py=(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1,dx=2*(1-t)*(cx-x0)+2*t*(x1-cx),dy=2*(1-t)*(cy-y0)+2*t*(y1-cy),u=Math.max(10,Math.hypot(ctx.canvas.width,ctx.canvas.height)*.022);
  ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=g(34);ctx.beginPath();ctx.roundRect(-u*1.1,-u*.42,u*2.2,u*.84,u*.3);ctx.fill();
  ctx.fillStyle=g(120);ctx.fillRect(-u*.35,-u*.42,u*.7,u*.22);ctx.restore()}
/* an Edison bulb in a brass socket: the part that makes it a lamp */
function bulb(ctx,x,base,s){
  const cy=base-s*.27-s*.42;
  bloom(ctx,x,cy,s*3.4,.95);
  ctx.fillStyle=g(150);ctx.fillRect(x-s*.16,base-s*.27,s*.32,s*.27);
  ctx.fillStyle=g(90);for(let k=1;k<4;k++)ctx.fillRect(x-s*.16,base-s*.27+k*s*.065,s*.32,1.5);
  ctx.fillStyle=g(200);ctx.fillRect(x-s*.16,base-s*.27,s*.32,2);
  const gl=ctx.createRadialGradient(x,cy,0,x,cy,s*.42);gl.addColorStop(0,'rgba(255,255,255,.95)');gl.addColorStop(1,'rgba(255,255,255,.42)');ctx.fillStyle=gl;ctx.beginPath();ctx.moveTo(x-s*.11,base-s*.27);ctx.lineTo(x-s*.2,cy+s*.2);ctx.ellipse(x,cy,s*.33,s*.4,0,Math.PI*.62,Math.PI*2.38);ctx.lineTo(x+s*.11,base-s*.27);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.strokeStyle=g(40);ctx.lineWidth=Math.max(1.6,s*.028);ctx.beginPath();ctx.moveTo(x-s*.07,base-s*.3);ctx.lineTo(x-s*.07,cy+s*.05);
  for(let k=0;k<4;k++)ctx.quadraticCurveTo(x-s*.07+(k+.5)*s*.035,cy-s*.14*(k%2?1:-1)-s*.04,x-s*.07+(k+1)*s*.035,cy+s*.05);
  ctx.lineTo(x+s*.07,base-s*.3);ctx.stroke();
  bloom(ctx,x,cy,s*.5,.55);
}

/* box camera lamp */
scenes.boxcam=(ctx,w,h,r)=>{
  const ty=h*.72;studio(ctx,w,h,r,ty);
  const bw=w*.42,bh=h*.42,bx=w*.5-bw/2,by=ty-bh;
  spill(ctx,w*.5,ty+h*.06,w*.55,.35);
  leather(ctx,bx,by,bw,bh,r,30);
  ctx.fillStyle=g(120);ctx.fillRect(bx,by,bw,3);ctx.fillRect(bx,by,3,bh);
  ctx.fillStyle=g(60);[[.12,.12],[.72,.12]].forEach(([u,v])=>{ctx.fillRect(bx+bw*u,by+bh*v,bw*.16,bh*.14);ctx.fillStyle=g(200);ctx.fillRect(bx+bw*u+3,by+bh*v+3,bw*.16-6,bh*.14-6);ctx.fillStyle=g(60)});
  ctx.fillStyle=g(160);ctx.fillRect(bx+bw*.3,by+bh*.82,bw*.4,3);
  lens(ctx,w*.5,by+bh*.55,bw*.12,false);
  bulb(ctx,w*.5,by,Math.min(h*.24,w*.3));
  cord(ctx,bx+bw,ty-6,w*1.05,h*.95,w*.85,ty+h*.15);
};
/* twin-lens reflex */
scenes.tlr=(ctx,w,h,r)=>{
  const ty=h*.78;studio(ctx,w,h,r,ty);
  const bw=w*.3,bh=h*.56,bx=w*.5-bw/2,by=ty-bh;
  spill(ctx,w*.5,ty+h*.05,w*.5,.3);
  leather(ctx,bx,by+bh*.12,bw,bh*.88,r,28);
  ctx.fillStyle=g(150);ctx.fillRect(bx,by,bw,bh*.12);ctx.fillStyle=g(80);ctx.fillRect(bx+4,by+4,bw-8,bh*.12-8);
  ctx.fillStyle=g(130);ctx.fillRect(bx,by+bh*.12,bw,4);
  ctx.fillStyle=g(110);ctx.fillRect(bx+bw*.06,by+bh*.18,bw*.88,bh*.78);ctx.fillStyle=g(26);ctx.fillRect(bx+bw*.09,by+bh*.2,bw*.82,bh*.74);
  lens(ctx,w*.5,by+bh*.36,bw*.2,false);
  lens(ctx,w*.5,by+bh*.72,bw*.2,false);
  bulb(ctx,w*.5,by,Math.min(h*.19,w*.24));
  ctx.fillStyle=g(170);ctx.beginPath();ctx.arc(bx+bw*1.04,by+bh*.5,bw*.07,0,7);ctx.fill();
  cord(ctx,bx,ty-4,-10,h*.98,w*.15,ty+h*.12);
};
/* folding bellows */
scenes.bellows=(ctx,w,h,r)=>{
  const ty=h*.74;studio(ctx,w,h,r,ty);
  spill(ctx,w*.66,ty+h*.04,w*.5,.35);
  ctx.fillStyle=g(150);ctx.beginPath();ctx.moveTo(w*.18,ty);ctx.lineTo(w*.82,ty);ctx.lineTo(w*.8,ty-8);ctx.lineTo(w*.2,ty-8);ctx.fill();
  leather(ctx,w*.12,ty-h*.4,w*.22,h*.4-8,r,26);
  ctx.fillStyle=g(130);ctx.fillRect(w*.12,ty-h*.4,w*.22,3);
  const n=9,x0=w*.34,x1=w*.6,t0=ty-h*.37,b0=ty-11,t1=ty-h*.29,b1=ty-h*.07;
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,xa=x0+(x1-x0)*a,xb=x0+(x1-x0)*b,ya=t0+(t1-t0)*a,yb=t0+(t1-t0)*b,za=b0+(b1-b0)*a,zb=b0+(b1-b0)*b;
    ctx.fillStyle=g(i%2?18:46);ctx.beginPath();ctx.moveTo(xa,ya);ctx.lineTo(xb,yb);ctx.lineTo(xb,zb);ctx.lineTo(xa,za);ctx.fill()}
  ctx.fillStyle=g(170);ctx.fillRect(x1,t1-6,w*.03,b1-t1+12);
  ctx.strokeStyle=g(160);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1+w*.015,b1+6);ctx.lineTo(x1-w*.05,ty-8);ctx.stroke();
  lens(ctx,x1+w*.07,(t1+b1)/2,w*.06,false);
  bulb(ctx,w*.23,ty-h*.4,Math.min(h*.22,w*.28));
  cord(ctx,w*.12,ty-10,-10,h*.94,w*.02,ty+h*.08);
};
/* rangefinder on a desk-lamp arm */
scenes.rangefinder=(ctx,w,h,r)=>{
  const ty=h*.82;studio(ctx,w,h,r,ty);
  ctx.fillStyle=g(150);ctx.beginPath();ctx.ellipse(w*.3,ty,w*.14,h*.025,0,0,7);ctx.fill();
  ctx.strokeStyle=g(140);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w*.3,ty-4);ctx.lineTo(w*.38,h*.42);ctx.lineTo(w*.52,h*.3);ctx.stroke();
  ctx.fillStyle=g(200);[[w*.38,h*.42],[w*.3,ty-4]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill()});
  ctx.save();ctx.translate(w*.6,h*.3);ctx.rotate(.38);
  const bw=w*.4,bh=h*.15;
  ctx.fillStyle=g(175);ctx.fillRect(-bw/2,-bh/2,bw,bh*.3);
  leather(ctx,-bw/2,-bh/2+bh*.3,bw,bh*.7,r,28);
  ctx.fillStyle=g(230);ctx.fillRect(-bw*.4,-bh/2+bh*.08,bw*.12,bh*.14);ctx.fillRect(bw*.22,-bh/2+bh*.08,bw*.12,bh*.14);
  ctx.fillStyle=g(30);ctx.fillRect(-bw*.06,-bh/2-bh*.18,bw*.12,bh*.18);
  ctx.restore();
  const lx=w*.6+Math.sin(.38)*-h*.1,ly=h*.3+Math.cos(.38)*h*.1;
  const cone=ctx.createLinearGradient(lx,ly,lx-w*.1,ty);cone.addColorStop(0,'rgba(255,255,255,.55)');cone.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(lx-14,ly);ctx.lineTo(lx+14,ly);ctx.lineTo(lx+w*.18,ty+h*.08);ctx.lineTo(lx-w*.34,ty+h*.08);ctx.fill();
  lens(ctx,lx,ly,w*.05,true);
  spill(ctx,lx-w*.06,ty+h*.03,w*.4,.4);
  cord(ctx,w*.17,ty-2,-10,h*.97,w*.06,ty+h*.04);
};
/* 8mm movie camera, beam out the front */
scenes.movie=(ctx,w,h,r)=>{
  const ty=h*.76;studio(ctx,w,h,r,ty);
  const bx=w*.18,by=ty-h*.3,bw=w*.38,bh=h*.24;
  const beam=ctx.createLinearGradient(bx+bw,0,w,0);beam.addColorStop(0,'rgba(255,255,255,.6)');beam.addColorStop(1,'rgba(255,255,255,.04)');
  ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(bx+bw+w*.08,by+bh*.45-8);ctx.lineTo(w,by-h*.08);ctx.lineTo(w,by+bh+h*.08);ctx.lineTo(bx+bw+w*.08,by+bh*.45+8);ctx.fill();
  for(let i=0;i<70;i++){const t=r();ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(bx+bw+w*.1+t*(w*.4),by+bh*.45+(r()-.5)*(16+t*h*.3),1.3,1.3)}
  ctx.fillStyle=g(140);ctx.fillRect(bx+bw*.25,ty-h*.06,bw*.5,h*.06);
  leather(ctx,bx,by,bw,bh,r,30);ctx.fillStyle=g(150);ctx.fillRect(bx,by,bw,3);
  [[bx+bw*.25,by-h*.1],[bx+bw*.72,by-h*.1]].forEach(([x,y])=>{ctx.fillStyle=g(36);ctx.beginPath();ctx.arc(x,y,h*.1,0,7);ctx.fill();ctx.strokeStyle=g(120);ctx.lineWidth=2;ctx.stroke();
    for(let k=0;k<3;k++){ctx.fillStyle=g(60);ctx.beginPath();ctx.arc(x+Math.cos(k*2.1)*h*.05,y+Math.sin(k*2.1)*h*.05,h*.022,0,7);ctx.fill()}
    ctx.fillStyle=g(170);ctx.beginPath();ctx.arc(x,y,h*.012,0,7);ctx.fill()});
  ctx.fillStyle=g(60);ctx.fillRect(bx+bw,by+bh*.3,w*.07,bh*.3);
  lens(ctx,bx+bw+w*.08,by+bh*.45,h*.05,true);
  cord(ctx,bx,ty-6,-10,h*.97,bx-w*.1,ty+h*.1);
};

/* render a scene to an offscreen canvas, toned for safelight with grain + vignette */
function renderScene(name,w,h,seed){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  scenes[name](ctx,w,h,rng(seed));
  const im=ctx.getImageData(0,0,w,h),d=im.data,r=rng(seed*7+3),cx=w/2,cy=h/2,md=Math.hypot(cx,cy);
  for(let i=0;i<d.length;i+=4){
    const p=i/4,x=p%w,y=(p/w)|0;
    let L=d[i]*.3+d[i+1]*.59+d[i+2]*.11;
    L+= (r()-.5)*34;
    const v=Math.hypot(x-cx,y-cy)/md; L*=1-.38*v*v;
    L=Math.max(0,Math.min(255,L));
    d[i]=Math.min(255,26+L*.98); d[i+1]=6+L*.71; d[i+2]=5+L*.62;
  }
  ctx.putImageData(im,0,0);return c;
}

/* sound: a 1950s room, all synthesized in the browser. Everything runs through a tube-radio
   chain (warm saturation, narrow bandwidth). The knob has three positions: Off, Room
   (tube hum + record crackle + the hardware), and Radio (adds The Darkroom Hour, a camera talk show). */
let AC=null,BUS=null,mode='off';   // silent until someone turns the knob
try{let m=localStorage.getItem('lc-sound');if(m==='radio')m='talk';if(['off','music','talk'].includes(m))mode=m}catch(e){}
const soundOn=()=>mode!=='off';
function ac(){if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C()}if(AC.state==='suspended')AC.resume();return AC}
function bus(){const a=ac();if(!a)return null;if(BUS)return BUS;
  const inp=a.createGain();inp.gain.value=1.4;
  const sh=a.createWaveShaper(),n=1024,cv=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(x*2.2)/Math.tanh(2.2)}sh.curve=cv;sh.oversample='2x';
  const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=170;hp.Q.value=.7;
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3600;lp.Q.value=.9;
  const pk=a.createBiquadFilter();pk.type='peaking';pk.frequency.value=1100;pk.gain.value=4;pk.Q.value=.8;
  const out=a.createGain();out.gain.value=.7;
  inp.connect(sh).connect(hp).connect(pk).connect(lp).connect(out).connect(a.destination);BUS=inp;return BUS}
function noise(dur,freq,q,gain,type,delay){const a=ac();if(!a||!soundOn())return;const n=Math.ceil(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=q;
  const g=a.createGain();g.gain.value=gain;s.connect(f).connect(g).connect(bus());s.start(a.currentTime+(delay||0))}
function tone(freq,dur,gain,type,delay,dest){const a=ac();if(!a||!soundOn())return;const o=a.createOscillator(),g=a.createGain(),t0=a.currentTime+(delay||0);o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain,t0+.004);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g).connect(dest||bus());o.start(t0);o.stop(t0+dur+.05)}
// a struck steel bell: inharmonic partials, like the bell inside a wind-up darkroom timer
function strike(base,gain,delay){[[1,1,1.6],[2.32,.45,.9],[4.25,.25,.5],[6.63,.12,.3]].forEach(([m,g,d])=>tone(base*m,d,gain*g,'sine',delay))}
let tickTock=0;
const sfx={
  click(){noise(.012,3200,2,.6);noise(.05,900,3,.35,'bandpass',.004);tone(180,.05,.15,'triangle')},               // bakelite push-button
  tick(){tickTock^=1;noise(.014,tickTock?3600:2700,6,.5);tone(tickTock?1900:1500,.03,.06,'square')},             // clockwork tick-tock
  ratchet(){noise(.016,2600,4,.5);tone(900+Math.random()*120,.02,.05,'square')},                                   // winding the timer
  ding(){strike(1180,.16)},
  bell(){for(let i=0;i<9;i++)strike(1180,.14,i*.075)},                                                             // ring-a-ling at the end
  thump(){noise(.1,160,.7,1.6,'lowpass');tone(52,.18,.55);noise(.03,1200,1,.3,'bandpass',.01)},                   // rubber stamp on the counter
  key(){noise(.012,2600+Math.random()*700,3,.7);noise(.06,420,2,.6,'bandpass',.008);tone(140,.05,.18,'triangle',.008)}, // typewriter type-bar
  carriage(){strike(2400,.12);noise(.35,1500,.8,.25,'bandpass',.08)},                                              // margin bell, carriage return
  paper(){noise(.18,3000,.6,.4,'bandpass');noise(.08,6000,.5,.12,'highpass',.05)},
  slosh(){const a=ac();if(!a||!soundOn())return;const n=a.sampleRate*1.2,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.Q.value=6;const g=a.createGain();const t0=a.currentTime;
    f.frequency.setValueAtTime(300,t0);f.frequency.linearRampToValueAtTime(900,t0+.5);f.frequency.linearRampToValueAtTime(250,t0+1.2);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.4,t0+.3);g.gain.linearRampToValueAtTime(0,t0+1.2);s.connect(f).connect(g).connect(bus());s.start()}
};

/* the room: tube hum + record crackle, and optionally a doo-wop record low on the radio */
let room=null,radio=null,music=null;
function crackleBuffer(a){const sec=6,n=a.sampleRate*sec,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++){d[i]=(Math.random()*2-1)*.025;if(Math.random()<.0009)d[i]+=(Math.random()<.5?-1:1)*(.4+Math.random()*.6);if(Math.random()<.00004){for(let k=0;k<40&&i+k<n;k++)d[i+k]+=(Math.random()*2-1)*.5*(1-k/40)}}
  return b}
function startRoom(){const a=ac();if(!a||room)return;const g=a.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(1,a.currentTime+2);g.connect(bus());
  const hum=a.createGain();hum.gain.value=.018;hum.connect(g);
  [60,120,180,240].forEach((f,i)=>{const o=a.createOscillator();o.type=i?'sine':'triangle';o.frequency.value=f;const og=a.createGain();og.gain.value=[1,.6,.25,.1][i];o.connect(og).connect(hum);o.start()});
  const s=a.createBufferSource();s.buffer=crackleBuffer(a);s.loop=true;const cg=a.createGain();cg.gain.value=.22;const cf=a.createBiquadFilter();cf.type='highpass';cf.frequency.value=900;s.connect(cf).connect(cg).connect(g);s.start();
  room={g}}
function stopRoom(){const a=ac();if(!a||!room)return;const r=room;room=null;r.g.gain.linearRampToValueAtTime(0,a.currentTime+.4);setTimeout(()=>r.g.disconnect(),500)}
// Radio: "The Darkroom Hour", a camera talk show on Radio Luminous, 620 on your dial.
// Pre-recorded segments play in order with a little tuning static and a vibraphone sting between them.
const SHOW=['01-sign-on','02-brownie','03-twin-lens','04-argus','05-sponsor','06-press','07-sign-off'].map(n=>'audio/'+n+'.mp3');
const showCache={};let showIdx=0;
async function loadSeg(a,url){if(showCache[url])return showCache[url];const r=await fetch(url);if(!r.ok)throw 0;const buf=await a.decodeAudioData(await r.arrayBuffer());showCache[url]=buf;return buf}
function startRadio(){const a=ac();if(!a||radio)return;
  const g=a.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(1,a.currentTime+1.2);
  const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=190;
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200;
  const vib=a.createBiquadFilter();vib.type='peaking';vib.frequency.value=1800;vib.gain.value=1.5;vib.Q.value=1.2;
  g.connect(hp).connect(vib).connect(lp).connect(bus());
  let alive=true,src=null;
  function staticBurst(dur){const n=Math.ceil(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*.35*Math.sin(Math.PI*i/n);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.Q.value=3;
    f.frequency.setValueAtTime(400,a.currentTime);f.frequency.exponentialRampToValueAtTime(2200,a.currentTime+dur);s.connect(f).connect(g);s.start()}
  // a little theater-organ cue between segments: rising arpeggio, then the chord swells and fades
  function sting(at){const notes=[261.63,329.63,392,523.25];
    notes.forEach((f,i)=>{const d=at+i*.13,dur=1.9-i*.13;[[1,.045],[2,.028],[3,.014],[4,.008]].forEach(([h,gn])=>tone(f*h,dur,gn,'sine',d,g))})}
  async function play(){if(!alive)return;
    try{const buf=await loadSeg(a,SHOW[showIdx%SHOW.length]);if(!alive)return;
      src=a.createBufferSource();src.buffer=buf;src.connect(g);src.start();
      src.onended=()=>{if(!alive)return;showIdx++;staticBurst(.5);sting(.55);setTimeout(play,2300)}}
    catch(e){staticBurst(1.2);setTimeout(()=>{if(alive){showIdx++;play()}},4000)}}
  staticBurst(.9);setTimeout(play,900);
  radio={stop(){alive=false;try{src&&src.stop()}catch(e){}g.gain.linearRampToValueAtTime(0,a.currentTime+.4);setTimeout(()=>g.disconnect(),600)}}}
function stopRadio(){if(radio){radio.stop();radio=null}}
// Music: "Luminous", an original doo-wop ballad in Bb (I–vi–IV–V, 12/8). Piano triplets, upright bass, brushes,
// a vocal group and a tenor sax, mastered like a 45 on a home hi-fi. It loops without a seam; the room's crackle plays under it.
const RECORD='audio/doowop.mp3';let recordBuf=null;
function startMusic(){const a=ac();if(!a||music)return;
  const g=a.createGain();g.gain.value=0;
  const lo=a.createBiquadFilter();lo.type='lowshelf';lo.frequency.value=140;lo.gain.value=-1.5;
  g.connect(lo).connect(a.destination);
  let alive=true,src=null;
  (recordBuf?Promise.resolve(recordBuf):fetch(RECORD).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(d=>a.decodeAudioData(d)).then(b=>recordBuf=b))
    .then(buf=>{if(!alive)return;src=a.createBufferSource();src.buffer=buf;src.loop=true;src.connect(g);src.start();
      g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(.62,a.currentTime+1.6)}).catch(()=>{});
  music={stop(){alive=false;const t=a.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.5);
    setTimeout(()=>{try{src&&src.stop()}catch(e){}g.disconnect()},650)}}}
function stopMusic(){if(music){music.stop();music=null}}
function tuneStatic(){const a=ac();if(!a||!soundOn())return;const n=Math.ceil(a.sampleRate*.6),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*.4*Math.sin(Math.PI*i/n);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.Q.value=4;
  f.frequency.setValueAtTime(500,a.currentTime);f.frequency.exponentialRampToValueAtTime(2400,a.currentTime+.55);s.connect(f).connect(bus());s.start()}

// knob: off → music (the record, straight away) → talk radio (tuned in through static, with the room's hum) → off
function applyMode(){if(!AC)return;if(mode==='off'){stopRoom();stopRadio();stopMusic();return}
  if(mode==='music'){stopRoom();stopRadio();startMusic()}else{stopMusic();startRoom();startRadio()}}

const soundBtn=document.getElementById('soundBtn'),soundState=document.getElementById('soundState');
const LABEL={off:'Off',music:'Music',talk:'Talk radio'};
function paintSound(){soundBtn.dataset.mode=mode;soundState.textContent=LABEL[mode];soundBtn.setAttribute('aria-label','Sound: '+LABEL[mode]+'. Click to change.')}
paintSound();
soundBtn.addEventListener('click',()=>{mode={off:'music',music:'talk',talk:'off'}[mode]||'music';if(mode==='talk')setTimeout(tuneStatic,30);try{localStorage.setItem('lc-sound',mode)}catch(e){}paintSound();ac();applyMode();if(soundOn())sfx.click()});
let woke=false;
document.addEventListener('click',e=>{if(!woke){woke=true;ac();applyMode()}if(e.target.closest('.btn'))sfx.click()});

/* film ribbons drifting through the dark, light rippling off the trays, dust in the safelight.
   One canvas behind everything. Each strip's sprocket holes and frames are batched into a single path per strip,
   phones and low-power devices draw at ~30fps at 1x, and nothing runs while the tab is hidden. */
(function(){if(reduce)return;
  const cv=document.getElementById('atmos');if(!cv)return;const x=cv.getContext('2d');
  const small=()=>innerWidth<820,lowPower=(navigator.deviceMemory||8)<=4||(navigator.hardwareConcurrency||8)<=4;
  let W,H,dpr,minFrame;
  function size(){W=innerWidth;H=innerHeight;dpr=small()||lowPower?1:Math.min(devicePixelRatio||1,1.5);minFrame=small()||lowPower?31:0;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);x.setTransform(dpr,0,0,dpr,0,0)}
  size();let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,150)});
  // each strip: vertical place, tilt, width, wave, travel speed (px/s), opacity, parallax
  const R=[
    {y:.2, a:-.16,w:34,amp:42,k:.0036,wt:.22,run:34, alpha:.6, par:.16},
    {y:.6, a:.1, w:24,amp:56,k:.0031,wt:-.17,run:-24,alpha:.38,par:.3},
    {y:.88,a:-.05,w:18,amp:30,k:.0047,wt:.27,run:18, alpha:.26,par:.46},
  ];
  // caustics, rendered small and stretched, refreshed a few times a second
  const cw=96,ch=54,cc=document.createElement('canvas');cc.width=cw;cc.height=ch;const cx=cc.getContext('2d'),ci=cx.createImageData(cw,ch);
  function caustics(t){const d=ci.data;for(let j=0;j<ch;j++){const v=j/ch*4,fallY=Math.max(0,1-j/ch*1.1);for(let i=0;i<cw;i++){
      const u=i/cw*7;const s=Math.sin(u*1.3+t*.6)+Math.sin(v*1.9-t*.45+u*.4)+Math.sin((u+v)*1.1+t*.35)+Math.sin(Math.hypot(u-3.5,v-1)*2.2-t*.8);
      let c=Math.max(0,1-Math.abs(s)*1.6);c=c*c*c;const k=(j*cw+i)*4;d[k]=255;d[k+1]=70;d[k+2]=40;d[k+3]=c*fallY*(1-Math.abs(i/cw-.5)*1.2)*150}}
    cx.putImageData(ci,0,0)}
  const STEP=4,HOLE=11,FRAME=44;
  const motes=Array.from({length:small()?24:46},(_,i)=>({cream:i%5===0,x:Math.random(),y:Math.random(),r:.5+Math.random()*1.6,vx:(Math.random()-.5)*.005,vy:.002+Math.random()*.006,p:Math.random()*6}));
  const pts=[],ny=[],len=[],nx=[],nyy=[];
  // a small rotated rectangle added to the current path (corners are too small to need rounding)
  function quad(cx0,cy0,ux,uy,hw2,hh2){const ax=ux*hw2,ay=uy*hw2,bx=-uy*hh2,by=ux*hh2;
    x.moveTo(cx0-ax-bx,cy0-ay-by);x.lineTo(cx0+ax-bx,cy0+ay-by);x.lineTo(cx0+ax+bx,cy0+ay+by);x.lineTo(cx0-ax+bx,cy0-ay+by);x.closePath()}
  let lastC=-1e9,sy=scrollY,tPrev=performance.now(),lastDraw=0;
  function frame(now){requestAnimationFrame(frame);
    if(irisBusy){tPrev=now;return}
    if(now-lastDraw<minFrame)return;lastDraw=now;
    const t=now/1000,dt=Math.min(.05,(now-tPrev)/1000);tPrev=now;
    if(Math.abs(scrollY-sy)>H*.5)sy=scrollY;          // a jump (reload, anchor, iris) snaps; ordinary scrolling glides
    sy+=(scrollY-sy)*(1-Math.pow(.0015,dt));          // eased scroll so the parallax glides
    x.clearRect(0,0,W,H);
    if(now-lastC>90){caustics(t);lastC=now}
    x.globalCompositeOperation='screen';x.globalAlpha=.2;x.drawImage(cc,-40,-20,W+80,H*.75);x.globalCompositeOperation='source-over';
    for(const r of R){
      const span=H+500,base=((r.y*H-sy*r.par)%span+span)%span-250;
      x.save();x.translate(W/2,base);x.rotate(r.a);x.globalAlpha=r.alpha;
      const L=W*1.7,n=Math.ceil(L/STEP)+1;let acc=0;
      for(let i=0;i<n;i++){const s=-L/2+i*STEP;const y=Math.sin(s*r.k+t*r.wt)*r.amp+Math.sin(s*r.k*2.1-t*r.wt*.7+1.3)*r.amp*.32;pts[i]=s;ny[i]=y;
        if(i)acc+=Math.hypot(STEP,y-ny[i-1]);len[i]=acc}
      for(let i=0;i<n;i++){const a=i?i-1:0,b=i<n-1?i+1:n-1,dx=pts[b]-pts[a],dy=ny[b]-ny[a],l=Math.hypot(dx,dy)||1;nx[i]=-dy/l;nyy[i]=dx/l}
      const hw=r.w/2;
      x.beginPath();for(let i=0;i<n;i++)x[i?'lineTo':'moveTo'](pts[i]+nx[i]*hw,ny[i]+nyy[i]*hw);
      for(let i=n-1;i>=0;i--)x.lineTo(pts[i]-nx[i]*hw,ny[i]-nyy[i]*hw);
      x.closePath();x.fillStyle='#170504';x.fill();x.lineWidth=1;x.strokeStyle='rgba(255,80,50,.28)';x.stroke();
      // things sit at exact distances along the strip, so they glide instead of popping
      const total=len[n-1];let lo=0;
      const at=d=>{while(lo<n-2&&len[lo+1]<d)lo++;const hi=lo+1,f=(d-len[lo])/((len[hi]-len[lo])||1),dx=pts[hi]-pts[lo],dy=ny[hi]-ny[lo],l=Math.hypot(dx,dy)||1;
        return[pts[lo]+dx*f,ny[lo]+dy*f,dx/l,dy/l]};
      x.beginPath();lo=0;
      for(let d=((t*r.run)%FRAME+FRAME)%FRAME;d<total;d+=FRAME){const[px,py,ux,uy]=at(d);quad(px,py,ux,uy,FRAME*.4,hw*.5)}
      x.fillStyle='rgba(255,120,90,.12)';x.fill();
      const hs=Math.max(2.2,r.w*.09);x.beginPath();lo=0;
      for(let d=((t*r.run)%HOLE+HOLE)%HOLE;d<total;d+=HOLE){const[px,py,ux,uy]=at(d),ox=-uy*hw*.76,oy=ux*hw*.76;
        quad(px+ox,py+oy,ux,uy,hs*.7,hs*.55);quad(px-ox,py-oy,ux,uy,hs*.7,hs*.55)}
      x.fillStyle='rgba(255,110,80,.42)';x.fill();
      x.restore()}
    // dust drifting through the safelight
    x.globalAlpha=1;
    for(const m of motes){m.x+=(m.vx+Math.sin(t*.4+m.p)*.003)*dt;m.y+=m.vy*dt;if(m.y>1.05){m.y=-.05;m.x=Math.random()}
      const lit=Math.max(0,1-Math.hypot(m.x-.5,m.y*1.3)/.75);x.fillStyle=m.cream?`rgba(255,238,222,${(.06+lit*.38).toFixed(2)})`:`rgba(255,130,100,${(.08+lit*.45).toFixed(2)})`;x.beginPath();x.arc(m.x*W,m.y*H,m.r,0,7);x.fill()}
  }
  requestAnimationFrame(frame);
})();

/* film advances between sections as you scroll */
(function(){if(reduce)return;const runs=[...document.querySelectorAll('.reel-run')];
  let tk=false;addEventListener('scroll',()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{runs.forEach((r,i)=>r.style.transform=`translateX(${((scrollY*(i%2?-.35:.35))%88).toFixed(1)}px)`);tk=false})},{passive:true});
})();

/* everything below the fold develops as it comes into the light */
(function(){if(reduce||!('IntersectionObserver' in window))return;
  const els=[...document.querySelectorAll('section h2, .line-sec .head .tape, .sheet, form.env, .contact, .card, .ab-notes li')];
  const fold=innerHeight*.9;els.forEach(e=>{if(e.getBoundingClientRect().top>fold)e.classList.add('will-dev')});
  const io=new IntersectionObserver(es=>{let k=0;es.forEach(en=>{if(en.isIntersecting){const e=en.target;e.style.transitionDelay=(k++*.18)+'s';e.classList.add('developed');io.unobserve(e);setTimeout(()=>{e.classList.remove('will-dev','developed');e.style.transitionDelay=''},3400)}})},{threshold:.06});
  els.forEach(e=>{if(e.classList.contains('will-dev'))io.observe(e)});
})();

/* the lens: the focus ring turns to the section you're on; picking one closes the iris, changes the view and pulls focus */
(function(){
  const marks=document.getElementById('marks');if(!marks)return;
  const links=[...marks.querySelectorAll('a')],barrel=marks.parentElement;let current=null,lockUntil=0;
  const idx=document.getElementById('lensIndex');
  function center(a,instant){const li=a.parentElement;const x=li.offsetLeft+li.offsetWidth/2;
    if(instant){idx.style.transition='none';idx.style.left=x+'px';void idx.offsetWidth;idx.style.transition=''}else idx.style.left=x+'px'}
  function mark(a,force,instant){if(!a||(!force&&performance.now()<lockUntil))return;if(a===current&&!instant)return;current=a;
    links.forEach(l=>{const on=l===a;l.classList.toggle('on',on);if(on)l.setAttribute('aria-current','true');else l.removeAttribute('aria-current')});center(a,instant)}
  links.forEach(a=>a.addEventListener('click',()=>{mark(a,true);lockUntil=performance.now()+1600}));
  const secs=links.map(a=>{const h=a.getAttribute('href');const id=h.includes('#')?h.split('#')[1]:'';return[id&&document.getElementById(id),a]}).filter(([s])=>s);
  addEventListener('la:ready',()=>current&&center(current,true));   // the type has loaded and widths changed
  if(!secs.length){const here=links.find(l=>l.classList.contains('on'));if(!here){idx.hidden=true;return}   // a page off the map (404): no stop is marked
    current=null;mark(here,true,true);addEventListener('resize',()=>center(current,true));return}
  function spy(){const mid=innerHeight*.5;let hit=links[0];for(const[s,a]of secs){if(s.getBoundingClientRect().top<=mid)hit=a}mark(hit)}
  let q=false;addEventListener('scroll',()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;spy()})},{passive:true});
  addEventListener('resize',()=>center(current,true));
  mark(links[0],true,true);
})();
/* a clean arrival: the room shows first; the page waits (briefly) for its type, goes back to where you were if you reloaded,
   then fades in once, so nothing reflows or jumps in front of you */
(function(){const de=document.documentElement;
  let nav='navigate';try{nav=(performance.getEntriesByType('navigation')[0]||{}).type||'navigate'}catch(e){}
  try{history.scrollRestoration='manual'}catch(e){}
  const key='lc-y:'+location.pathname;let y=0;
  try{if(nav==='reload'||nav==='back_forward')y=+sessionStorage.getItem(key)||0;sessionStorage.removeItem(key)}catch(e){}
  addEventListener('pagehide',()=>{try{sessionStorage.setItem(key,String(Math.round(scrollY)))}catch(e){}});
  Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,900))]).then(()=>requestAnimationFrame(()=>{
    const t=location.hash&&document.getElementById(location.hash.slice(1));
    if(t)t.scrollIntoView({behavior:'instant',block:'start'});else scrollTo({top:y,behavior:'instant'});
    dispatchEvent(new Event('la:ready'));
    if(de.classList.contains('first')){try{localStorage.setItem('lc-visited','1')}catch(e){}setTimeout(()=>de.classList.remove('first'),4200)}   // the lights-on moment happens once
    let viaShutter=false;try{viaShutter=sessionStorage.getItem('lc-iris')==='1'||document.getElementById('iris').classList.contains('shut')}catch(e){}
    if(viaShutter)de.classList.remove('fl');            // arriving through the shutter: the page is simply there when the blades open
    else if(de.classList.contains('fl')){de.classList.add('fl-in');de.classList.remove('fl');setTimeout(()=>de.classList.remove('fl-in'),500)}}))})();

/* the room responds to you: a safelight in your hand (desktop), and an exposure counter that winds on as you scroll */
(function(){
  if(!matchMedia('(hover:hover) and (pointer:fine) and (min-width:1101px)').matches)return;
  const light=document.createElement('div');light.className='handlight';light.setAttribute('aria-hidden','true');document.body.appendChild(light);
  let tx=innerWidth/2,ty=innerHeight*.3,x=tx,y=ty,run=false;
  function step(){x+=(tx-x)*.12;y+=(ty-y)*.12;light.style.setProperty('--hx',x.toFixed(1)+'px');light.style.setProperty('--hy',y.toFixed(1)+'px');
    if(Math.abs(tx-x)+Math.abs(ty-y)>.6)requestAnimationFrame(step);else run=false}
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;if(!light.classList.contains('on'))light.classList.add('on');if(!run&&!reduce){run=true;requestAnimationFrame(step)}else if(reduce){x=tx;y=ty;step()}},{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>light.classList.remove('on'));
  // the counter: thirty-six exposures to the roll
  const N=36,box=document.createElement('div');box.className='excount';box.setAttribute('aria-hidden','true');
  box.innerHTML='<span class="win"><span class="roll"></span></span><b>Exposure<small>of 36</small></b>';
  const roll=box.querySelector('.roll');for(let i=1;i<=N;i++){const s=document.createElement('span');s.textContent=i;roll.appendChild(s)}
  document.body.appendChild(box);let last=0,q=false,atFoot=false;
  // it steps out of the way at the very bottom, so it never sits on the footer links
  const fb=document.querySelector('.foot-base');if(fb&&'IntersectionObserver' in window)new IntersectionObserver(es=>{atFoot=es[0].isIntersecting;upd()}).observe(fb);
  function upd(){q=false;const max=document.documentElement.scrollHeight-innerHeight;const f=max>0?scrollY/max:0;const n=Math.min(N,1+Math.floor(f*(N-1)+.0001));
    box.classList.toggle('on',scrollY>innerHeight*.35&&!atFoot);if(n!==last){last=n;roll.style.transform=`translateY(${-(n-1)*30}px)`}}
  addEventListener('scroll',()=>{if(!q){q=true;requestAnimationFrame(upd)}},{passive:true});addEventListener('la:ready',upd);upd();
})();

/* the bulb over the i comes on at random, with a stutter like an old filament warming up, glows a while, and goes out */
(function(){
  const b=document.querySelector('#wordmark .ibulb, symbol .ibulb');if(!b||reduce)return;   // reduced motion: it simply stays lit
  const on=v=>b.classList.toggle('lit',v),R=(a,z)=>a+Math.random()*(z-a);
  function flickerOn(){const steps=[[0,1],[70,0],[140,1],[190,0],[300,1]];if(Math.random()<.5)steps.splice(3,2,[260,1]);
    steps.forEach(([t,v])=>setTimeout(()=>on(!!v),t));setTimeout(stayOn,320)}
  function stayOn(){setTimeout(goOut,R(2600,7000))}
  function goOut(){if(Math.random()<.35){on(false);setTimeout(()=>on(true),80);setTimeout(()=>on(false),160)}else on(false);setTimeout(flickerOn,R(2500,9000))}
  on(false);setTimeout(flickerOn,R(900,1800));
})();

/* hanging signs swing when they come into view (and when brushed); FAQ drawers slide; the lamp's stamp thunks down */
(function(){
  if(reduce)return;
  const swing=d=>{if(d.classList.contains('swing'))return;d.classList.add('swing');d.addEventListener('animationend',()=>d.classList.remove('swing'),{once:true})};
  const signs=[...document.querySelectorAll('.dept')];
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);setTimeout(()=>swing(e.target),250)}}),{threshold:.6});
    signs.forEach(d=>io.observe(d))}
  if(matchMedia('(hover:hover)').matches)signs.forEach(d=>{let last=0;d.addEventListener('pointerenter',()=>{const t=performance.now();if(t-last>2200){last=t;swing(d)}})});
  // FAQ: the answer slides open and shut
  document.querySelectorAll('.faq details').forEach(d=>{const s=d.querySelector('summary');if(!s)return;let anim=null;
    s.addEventListener('click',e=>{e.preventDefault();if(anim)anim.cancel();
      const from=d.offsetHeight;d.style.overflow='hidden';
      if(!d.open){d.open=true;const to=d.offsetHeight;anim=d.animate([{height:from+'px'},{height:to+'px'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'})
        anim.onfinish=anim.oncancel=()=>{d.style.overflow='';anim=null}}
      else{const to=s.offsetHeight+(d.offsetHeight-d.clientHeight);anim=d.animate([{height:from+'px'},{height:to+'px'}],{duration:220,easing:'cubic-bezier(.4,0,.6,1)'});
        anim.onfinish=()=>{d.open=false;d.style.overflow='';anim=null};anim.oncancel=()=>{d.style.overflow='';anim=null}}})});
  // the lamp page: once the lamp is filled in, its status stamp comes down
  const st=document.getElementById('lampStatus');
  if(st){let done=false;const go=()=>{if(done||!st.textContent.trim())return;done=true;st.classList.add('thunk')};
    new MutationObserver(go).observe(st,{childList:true,characterData:true,subtree:true});addEventListener('la:ready',go);setTimeout(go,900)}
})();

/* the pull chain on the hanging safelight: one tug and the tray is lit the way it will be at home, under the warm light of one of our lamps */
(function(){
  const btn=document.getElementById('pullChain');if(!btn)return;const wrap=btn.closest('.traywrap')||document.body,lamp=btn.closest('.lamp');
  const set=on=>{wrap.classList.toggle('warm',on);lamp.classList.toggle('warm',on);btn.setAttribute('aria-pressed',String(on));
    btn.setAttribute('aria-label',on?'Pull the chain to go back to the red safelight':'Pull the chain to see the tray under one of our lamps');btn.title=on?'Back to safelight':'Pull for lamp light'};
  btn.addEventListener('click',()=>{const on=!wrap.classList.contains('warm');
    btn.classList.remove('tug');void btn.offsetWidth;btn.classList.add('tug');try{sfx.click()}catch(e){}
    if(reduce||!on){setTimeout(()=>set(on),120);return}
    // a filament warming up: it catches, drops, then holds
    setTimeout(()=>set(true),120);setTimeout(()=>set(false),190);setTimeout(()=>set(true),260)});
})();

/* the iris: every pick in the header closes the aperture, changes the view and opens it again with a focus pull.
   Drawn on one canvas (no per-frame DOM or SVG mask work), eased in time, and sized once per resize. */
const IRIS=(function(){
  /* a real leaf shutter: seven curved, blued-steel blades swing in, the mechanism clunks shut, a flashbulb pops as it
     springs open again and the picture comes into focus. Drawn on one canvas, eased in time, sized once per resize. */
  const iris=document.getElementById('iris'),cv=document.getElementById('irisCanvas');if(!iris||!cv)return null;
  const x=cv.getContext('2d'),main=document.querySelector('main');
  let W=0,H=0,k=1,dpr=1;
  function size(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);k=Math.hypot(W,H)/2/150}
  size();addEventListener('resize',()=>{size();draw()});
  const R=172,N=7,TAU=Math.PI*2,FAR=420;
  let r=R,vf=0,flash=0,tok=0,spin=0;
  // the opening: a rounded heptagon, rounder when wide open (as real blades are), sharper as it stops down
  function hole(rr,rot){const bulge=1+.13*Math.min(1,rr/R);x.moveTo(Math.cos(rot)*rr,Math.sin(rot)*rr);
    for(let i=0;i<N;i++){const a0=rot+i*TAU/N,a1=a0+TAU/N,am=(a0+a1)/2;
      x.quadraticCurveTo(Math.cos(am)*rr*bulge,Math.sin(am)*rr*bulge,Math.cos(a1)*rr,Math.sin(a1)*rr)}x.closePath()}
  function draw(){try{paint()}catch(e){}}   // a drawing hiccup must never strand the shutter
  function paint(){
    x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
    if(r>=R&&flash<=0)return;
    const rot=(1-r/R)*1.25+spin;
    x.setTransform(dpr*k,0,0,dpr*k,dpr*W/2,dpr*H/2);
    if(r<R){
      x.save();x.beginPath();x.rect(-FAR,-FAR,FAR*2,FAR*2);hole(r,rot);x.clip('evenodd');
      x.fillStyle='#060606';x.fillRect(-FAR,-FAR,FAR*2,FAR*2);
      // each blade: a curved leaf pivoting from outside the frame, shaded like black camera steel
      for(let i=0;i<N;i++){
        const a0=rot+i*TAU/N,a1=a0+TAU/N,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
        const px=c0*r,py=s0*r,qx=c1*r,qy=s1*r,tx=-s0,ty=c0;      // tangent at this blade's tip
        x.beginPath();x.moveTo(px,py);
        x.quadraticCurveTo(px+tx*FAR*.45+c0*FAR*.15,py+ty*FAR*.45+s0*FAR*.15,px+tx*FAR+c0*FAR*.6,py+ty*FAR+s0*FAR*.6);
        x.lineTo(qx+(-s1)*FAR+c1*FAR*.6,qy+c1*FAR+s1*FAR*.6);
        x.quadraticCurveTo(qx+(-s1)*FAR*.45+c1*FAR*.15,qy+c1*FAR*.45+s1*FAR*.15,qx,qy);
        x.closePath();
        const g=x.createLinearGradient(px,py,px+tx*120+c0*60,py+ty*120+s0*60);
        g.addColorStop(0,i%2?'#2c2c2e':'#232325');g.addColorStop(.35,i%2?'#161617':'#121213');g.addColorStop(.62,'#2a2a2c');g.addColorStop(1,'#08080a');
        x.fillStyle=g;x.fill();
        // the leading edge catches a thin line of red light
        x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+tx*FAR*.45+c0*FAR*.15,py+ty*FAR*.45+s0*FAR*.15,px+tx*FAR+c0*FAR*.6,py+ty*FAR+s0*FAR*.6);
        x.lineWidth=.6;x.strokeStyle='rgba(220,220,225,.32)';x.stroke();
        x.lineWidth=1.4;x.strokeStyle='rgba(0,0,0,.55)';x.stroke()}
      // depth: the blades' inner edge falls into shadow just outside the opening
      const sh=x.createRadialGradient(0,0,r*.98,0,0,r+18);sh.addColorStop(0,'rgba(0,0,0,.7)');sh.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=sh;x.beginPath();x.arc(0,0,r+20,0,TAU);x.fill();
      // the lens barrel: a knurled ring and its markings just beyond the blades
      x.lineWidth=1.2;x.strokeStyle='rgba(90,90,95,.6)';x.beginPath();x.arc(0,0,R*.97,0,TAU);x.stroke();
      x.lineWidth=3;x.setLineDash([.6,1.6]);x.strokeStyle='rgba(40,40,42,.95)';x.beginPath();x.arc(0,0,R*1.03,0,TAU);x.stroke();x.setLineDash([]);
      x.restore()}
    // the flashbulb: a warm white bloom through the opening as the shutter springs open
    if(flash>0){x.save();x.beginPath();hole(Math.max(r,1),rot);x.clip();
      const fl=x.createRadialGradient(0,0,0,0,0,Math.max(r,40)*1.1);fl.addColorStop(0,`rgba(255,244,228,${flash})`);fl.addColorStop(1,`rgba(255,180,140,${flash*.25})`);
      x.fillStyle=fl;x.fillRect(-FAR,-FAR,FAR*2,FAR*2);x.restore()}
    // the viewfinder while the view comes back: focusing circle, split line and frame corners
    if(vf>.01){x.globalAlpha=vf;x.strokeStyle='#e2a08a';x.lineWidth=.45;x.beginPath();x.arc(0,0,9,0,TAU);x.stroke();
      x.setLineDash([1.2,1.2]);x.beginPath();x.moveTo(-9,0);x.lineTo(9,0);x.stroke();x.setLineDash([]);
      x.beginPath();for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){x.moveTo(62*sx,40*sy);x.lineTo(54*sx,40*sy);x.moveTo(62*sx,40*sy);x.lineTo(62*sx,34*sy)}x.stroke();x.globalAlpha=1}
  }
  const easeIn=p=>p*p*p,                       // blades accelerate under the spring...
        outQuart=p=>1-Math.pow(1-p,4),
        backOut=p=>{const c=1.35;return 1+(c+1)*Math.pow(p-1,3)+c*Math.pow(p-1,2)};   // ...and spring open with the faintest overshoot
  function anim(to,ms,ease,each,my){const from=r;return new Promise(res=>{let t0=0;
    (function f(now){if(my!==tok)return res(false);if(!t0)t0=now;
      const p=Math.min(1,(now-t0)/ms);r=Math.max(0,from+(to-from)*ease(p));/* never below zero: a hair under 0 from rounding used to throw and leave the shutter shut */each&&each(p);draw();if(p<1)requestAnimationFrame(f);else res(true)})(performance.now())})}
  const wait=(ms,my)=>new Promise(res=>setTimeout(()=>res(my===tok),ms));
  // the sound: the release, the blades, then the second click as they open (only when sound is on)
  function clickShut(){try{if(soundOn()&&ac()){noise(.012,4200,2.4,.7);noise(.035,1300,1.4,.55,'bandpass',.05);tone(120,.04,.14,'square',.05)}}catch(e){}}
  function clickOpen(){try{if(soundOn()&&ac()){noise(.01,3600,2.2,.45);noise(.025,900,1.2,.3,'bandpass',.015)}}catch(e){}}
  let guard=0;
  function show(){iris.classList.add('run');irisBusy=true;clearTimeout(guard);guard=setTimeout(()=>{if(iris.classList.contains('run')){tok++;hide();if(main)main.classList.remove('pull','pull-in')}},7000)}   // safety net: the room is never left dark
  function hide(){irisBusy=false;iris.classList.remove('run','shut');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cv.width,cv.height)}
  function clunk(){if(!main)return;main.classList.remove('clunk');void main.offsetWidth;main.classList.add('clunk')}   // the whole camera jolts as the mirror and blades hit their stops
  async function open(my){
    if(main){main.classList.remove('pull-in');main.classList.add('pull')}
    vf=.75;flash=0;draw();iris.classList.remove('shut');
    await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));if(my!==tok)return;
    clickOpen();
    if(main){main.classList.remove('pull');main.classList.add('pull-in')}
    const done=await anim(R*1.02,600*speed,backOut,p=>{vf=.75*(1-p);flash=p<.08?p/.08*.42:Math.max(0,.42*(1-(p-.08)/.32));spin=.06*Math.sin(p*Math.PI)},my);
    if(done){spin=0;flash=0;hide();setTimeout(()=>{if(my===tok&&main)main.classList.remove('pull-in')},650)}}
  // the first page gets the full shutter; after that it fires quicker, so moving around the site stays snappy
  let seen=0;try{seen=+sessionStorage.getItem('lc-pages')||0;sessionStorage.setItem('lc-pages',String(seen+1))}catch(e){}
  const speed=(innerWidth<820?.75:1)*(seen>0?.6:1);
  const closeMs=()=>Math.max(110,250*speed*r/R);
  async function shut(my){show();clickShut();spin=0;
    if(!await anim(0,closeMs(),easeIn,null,my))return false;
    clunk();return wait(70,my)}           // a beat of darkness: the exposure
  // pick something: close, do the swap, open. A new pick during an animation takes over from wherever the blades are.
  async function go(swap){if(reduce){swap();return}const my=++tok;
    if(!await shut(my))return;swap();open(my)}
  // leaving for the other page: close here, open there
  function leave(url){if(reduce){location.href=url;return}const my=++tok;
    shut(my).then(done=>{if(!done)return;try{sessionStorage.setItem('lc-iris','1')}catch(e){}location.href=url})}
  // arriving from the other page with the iris shut: open once the type has settled (or after a short wait at most)
  let arriving=false;try{arriving=sessionStorage.getItem('lc-iris')==='1';sessionStorage.removeItem('lc-iris')}catch(e){}
  if(arriving&&!reduce){r=0;show();draw();const my=++tok;
    const id=location.hash&&document.getElementById(location.hash.slice(1));if(id)id.scrollIntoView({behavior:'instant',block:'start'});
    // open only once the new page is laid out and showing (type loaded, place restored), never onto an empty room
    let opened=false;const go2=()=>{if(opened)return;opened=true;requestAnimationFrame(()=>requestAnimationFrame(()=>open(my)))};
    addEventListener('la:ready',go2,{once:true});setTimeout(go2,1400)}
  else hide();
  // coming Back to this page: phones restore it exactly as it was left, shutter closed, so open it again
  addEventListener('pageshow',e=>{if(!e.persisted)return;const my=++tok;
    if(reduce||!iris.classList.contains('run')){hide();if(main)main.classList.remove('pull','pull-in','clunk');return}
    r=0;draw();open(my)});
  return {go,leave};
})();

/* phones: the Menu button opens and closes the list of stops */
(function(){
  const mh=document.getElementById('masthead'),btn=document.getElementById('menuBtn');if(!mh||!btn)return;
  const label=btn.querySelector('.mb-t');
  const set=o=>{mh.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o));btn.setAttribute('aria-label',o?'Close the site menu':'Open the site menu')};
  btn.addEventListener('click',e=>{e.stopPropagation();set(!mh.classList.contains('open'));sfx.click()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&mh.classList.contains('open')){set(false);btn.focus()}});
  document.addEventListener('click',e=>{if(mh.classList.contains('open')&&!mh.contains(e.target))set(false)});
  document.querySelectorAll('#marks a').forEach(a=>a.addEventListener('click',()=>set(false)));
  matchMedia('(min-width:861px)').addEventListener('change',()=>set(false));
  addEventListener('pageshow',e=>{if(e.persisted)set(false)});   // never come Back to a menu left open
  // phones: the header keeps just the logo and the menu key; the radio moves into the menu, under the dial face
  const snd=document.getElementById('soundBtn'),nav=document.getElementById('mainnav');
  if(snd&&nav){const home=snd.parentElement,row=document.createElement('div');row.className='nav-radio';
    const k=document.createElement('span');k.className='nr-k';k.textContent='On the radio';row.appendChild(k);nav.appendChild(row);
    const mq=matchMedia('(max-width:860px)');
    const place=()=>{if(mq.matches){if(snd.parentElement!==row)row.appendChild(snd)}else if(snd.parentElement!==home)home.insertBefore(snd,btn)};
    place();mq.addEventListener('change',place)}
})();

/* every link in the header goes through the lens */
(function(){if(!IRIS)return;
  document.querySelectorAll('header .logo, .marks a').forEach(a=>{
    a.addEventListener('click',e=>{const h=a.getAttribute('href')||'';if(e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();
      const u=new URL(h,location.href),norm=p=>p.replace(/(index|luminous-camera)\.html$/,''),same=norm(u.pathname)===norm(location.pathname);
      if(same){const t=u.hash?document.getElementById(u.hash.slice(1)):null;
        IRIS.go(()=>{if(t)t.scrollIntoView({behavior:'instant',block:'start'});else scrollTo({top:0,behavior:'instant'});history.replaceState(null,'',u.hash||location.pathname)})}
      else IRIS.leave(u.href)});
  });
})();

/* every so often the old safelight stutters */
(function(){if(reduce)return;function flick(){document.body.classList.add('flick');setTimeout(()=>document.body.classList.remove('flick'),70);
    setTimeout(()=>{document.body.classList.add('flick');setTimeout(()=>document.body.classList.remove('flick'),50)},170);
    setTimeout(flick,22000+Math.random()*26000)}
  setTimeout(flick,14000+Math.random()*10000)})();


/* shop links: eBay, Etsy, Instagram */
document.querySelectorAll('.shoplink').forEach(a=>{const u=SHOP_LINKS[a.dataset.shop]||'';
  if(/^https:\/\//i.test(u)){a.href=u;a.target='_blank';a.rel='noopener noreferrer'}
  else{   // a store with no address yet is shown as "coming soon", never as a link that goes nowhere
    a.classList.add('pending');a.removeAttribute('href');a.setAttribute('aria-disabled','true');
    const wrap=a.closest('.if-link');
    if(wrap){wrap.textContent=' (our '+a.textContent.trim()+' is coming soon)'}
    else if(a.classList.contains('ticket')){const sm=a.querySelector('small');if(sm)sm.textContent='Coming soon';a.title=''}
    else a.title='Coming soon'}});

window.LA={busy:()=>irisBusy,reduce,rng,renderScene,order:['boxcam','tlr','bellows','rangefinder','movie'],sfx,IRIS};
})();
