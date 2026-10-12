/*! dsh-glassui 0.1.0 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */
window.__ModuleLoader__.load({id:"dsh-glassui",factory(require){const module={exports:{}};const exports=module.exports;
"use strict";var Te=Object.defineProperty;var Lt=Object.getOwnPropertyDescriptor;var Nt=Object.getOwnPropertyNames;var Ct=Object.prototype.hasOwnProperty;var Mt=(s,e)=>{for(var t in e)Te(s,t,{get:e[t],enumerable:!0})},It=(s,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Nt(e))!Ct.call(s,i)&&i!==t&&Te(s,i,{get:()=>e[i],enumerable:!(a=Lt(e,i))||a.enumerable});return s};var Dt=s=>It(Te({},"__esModule",{value:!0}),s);var Xs={};Mt(Xs,{DEBUG_GLOBAL:()=>Ee,apply:()=>qs,inject:()=>zs,name:()=>Hs});module.exports=Dt(Xs);var Re="dsh-glassui",Ye="__DSH_GLASSUI__",Pt=["bay","sunrise","meadow","graphite","lagoon","dusk","dune","tide","aurora","bloom","prism"],_e=["auto",...Pt,"none","custom"],Ot=["floating","docked"],Ft=["glass","solid"],j=Object.freeze({enabled:!0,tint:35,wallpaper:"auto",wallpaperUrl:"",sidebar:"floating",codeBlocks:"glass",refraction:!0,highlights:!0,exclude:""}),qe=2048,Gt=1e3,Kt=/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;function re(s){if(s.length===0||s.length>qe||/["'()\\\s<>]/.test(s))return!1;if(Kt.test(s)||s.startsWith("/")&&!s.startsWith("//")||s.startsWith("./")||s.startsWith("../"))return!0;try{let e=new URL(s);return e.protocol==="https:"||e.protocol==="http:"}catch{return!1}}function ke(s,e,t){return typeof e=="string"&&s.includes(e)?e:t}function Ae(s,e){return typeof s=="boolean"?s:e}function je(s,e,t){return typeof s=="string"&&s.length<=e?s.trim():t}function F(s){let e=typeof s=="object"&&s!==null?s:{},t=j,a=typeof e.tint=="number"&&Number.isFinite(e.tint)?Math.min(100,Math.max(0,Math.round(e.tint))):t.tint;return{enabled:Ae(e.enabled,t.enabled),tint:a,wallpaper:ke(_e,e.wallpaper,t.wallpaper),wallpaperUrl:je(e.wallpaperUrl,qe,t.wallpaperUrl),sidebar:ke(Ot,e.sidebar,t.sidebar),codeBlocks:ke(Ft,e.codeBlocks,t.codeBlocks),refraction:Ae(e.refraction,t.refraction),highlights:Ae(e.highlights,t.highlights),exclude:je(e.exclude,Gt,t.exclude)}}function Xe(s,e){return Object.keys(j).every(t=>s[t]===e[t])}var Wt=300,ue=class{engine;stored;pending=new Map;timers=new Map;form;detachForm;writing=!1;failed=!1;disposed=!1;save="loading";state;listeners=new Set;constructor(e,t={...j}){this.engine=e,this.stored=t,this.state={settings:t,save:this.save,diagnostics:e.diagnostics()},e.apply(t)}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));attach(e){if(this.disposed)return()=>{};this.detachForm?.(),this.form=e;let t=()=>{if(this.disposed||this.form!==e)return;let r=e.getSnapshot();r.status==="ready"&&(this.stored=F(r.value)),this.recompute(),this.flush()},a=e.subscribe(t);t();let i=()=>{a(),this.form===e&&(this.form=void 0,this.detachForm=void 0,this.save="local",this.recompute())};return this.detachForm=i,i}update(e,t){if(this.disposed)return;let a=F({...this.state.settings,[e]:t});this.pending.set(e,{value:a[e]}),this.failed=!1;let i=this.timers.get(e);i!==void 0&&clearTimeout(i),this.timers.set(e,setTimeout(()=>{this.timers.delete(e),this.flush()},Wt)),this.recompute()}refreshDiagnostics(){this.disposed||(this.state={...this.state,diagnostics:this.engine.diagnostics()},this.emit())}async flush(){if(!(this.writing||this.disposed)){this.writing=!0;try{for(;this.isActive();){let e=this.form,t=e?.getSnapshot();if(!e||t?.status!=="ready"||!t.writable)break;let a=[...this.pending].find(([c])=>!this.timers.has(c));if(!a)break;let[i,r]=a,n=!1;this.recompute();try{n=await e.set(i,r.value)}catch(c){this.isActive()&&console.warn("dsh-glassui: saving a setting failed",c)}if(!this.isActive())return;if(this.form!==e||this.pending.get(i)!==r)continue;this.pending.delete(i),this.failed||=!n;let l=e.getSnapshot();l.status==="ready"&&(this.stored=F(l.value))}}finally{this.writing=!1,this.recompute()}}}isActive(){return!this.disposed}recompute(){if(this.disposed)return;let e=this.form?.getSnapshot();e?e.status==="loading"?this.save="loading":e.status==="unavailable"||!e.writable?this.save="local":this.pending.size>0||this.writing?this.save="saving":this.save=this.failed?"error":"saved":this.pending.size>0&&(this.save="local");let t=F({...this.stored,...Object.fromEntries([...this.pending].map(([i,r])=>[i,r.value]))}),a=!Xe(t,this.state.settings);a&&this.engine.apply(t),!(!a&&this.save===this.state.save)&&(this.state={settings:t,save:this.save,diagnostics:this.engine.diagnostics()},this.emit())}emit(){for(let e of this.listeners)e()}dispose(){this.disposed=!0,this.detachForm?.(),this.form=void 0;for(let e of this.timers.values())clearTimeout(e);this.timers.clear(),this.pending.clear(),this.listeners.clear()}};var E=String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`,Bt=new RegExp(String.raw`^rgba?\(\s*(${E})\s*,\s*(${E})\s*,\s*(${E})\s*(?:,\s*(${E})(%?)\s*)?\)$`,"i"),Ut=new RegExp(String.raw`^rgba?\(\s*(${E})\s+(${E})\s+(${E})\s*(?:/\s*(${E})(%?)\s*)?\)$`,"i"),Ht=new RegExp(String.raw`^color\(\s*srgb\s+(${E})\s+(${E})\s+(${E})\s*(?:/\s*(${E})(%?)\s*)?\)$`,"i");function Y(s){return Math.min(255,Math.max(0,Math.round(s)))}function Je(s,e){if(s===void 0)return 1;let t=Number(s)/(e==="%"?100:1);return Math.min(1,Math.max(0,t))}function $e(s){let e=s.trim(),t=Bt.exec(e)??Ut.exec(e);if(t)return{r:Y(Number(t[1])),g:Y(Number(t[2])),b:Y(Number(t[3])),a:Je(t[4],t[5])};let a=Ht.exec(e);if(a)return{r:Y(Number(a[1])*255),g:Y(Number(a[2])*255),b:Y(Number(a[3])*255),a:Je(a[4],a[5])}}function Qe(s){let e=Math.round(s.a*1e3)/1e3;return e>=1?`rgb(${s.r} ${s.g} ${s.b})`:`rgb(${s.r} ${s.g} ${s.b} / ${e})`}function pe(s){return`${s.r},${s.g},${s.b},${Math.round(s.a*1e3)}`}var zt=[1,-1,2,-2,3,-3],Vt=["b","g","r"];function Ze(s,e){let t=new Set(e.map(pe));for(let[,i]of s)i&&t.add(pe(i));let a=new Map;for(let[i,r]of s){if(!r)continue;let n;e:for(let l of Vt)for(let c of zt){let u=r[l]+c;if(u<0||u>255)continue;let d={...r,[l]:u};if(!t.has(pe(d))){n=d;break e}}n&&(t.add(pe(n)),a.set(i,n))}return a}var q="data-glassui",G="data-glassui-sidebar",I="data-glassui-wallpaper",X="data-glassui-highlights",J="data-glassui-raw",h="data-glassui-surface",_="data-glassui-fill",m="data-glassui-flat",$="data-glassui-echo",N="data-glassui-paint",Q="data-glassui-float",D="data-glassui-lens",ne="data-glassui-ignore",L="data-glassui-material";var b="data-glassui-owned",K="--glassui-t",W="--glassui-wallpaper",Z="--glassui-lx",ee="--glassui-ly",oe=["sidebar","composer","panel","menu","smoke","code","backdrop"],et=[q,G,I,X,J,h,_,m,$,N,Q,D,b].map(s=>`[${s}]`).join(",");var y={input:"--dsw-specific-input-major",sidebar:"--dsw-specific-sidebar-fill",toast:"--dsw-alias-toast-bg",tooltip:"--dsw-alias-tooltip-bg",layer1:"--dsw-alias-bg-layer-1",layer2:"--dsw-alias-bg-layer-2",layer3:"--dsw-alias-bg-layer-3",floating:"--dsw-alias-button-floating-fill",elevated:"--dsw-alias-button-elevated-fill",overlay:"--dsw-alias-bg-overlay",base:"--dsw-alias-bg-base",code:"--dsw-alias-markdown-code-block",codeBanner:"--dsw-alias-markdown-code-block-banner"},C=Object.keys(y),tt=new Set(["code","codeBanner"]),Le=["--dsw-alias-markdown-inline-code","--dsw-alias-markdown-citation","--dsw-alias-markdown-tag","--dsw-alias-markdown-placeholder","--dsw-specific-bubble","--dsw-specific-selector","--dsw-specific-tip","--dsw-specific-login-input","--dsw-specific-sidebar-nav-item-active","--dsw-specific-sidebar-nav-item-hover","--dsw-alias-bg-module-platform","--dsw-alias-bg-multi-select","--dsw-alias-bg-document-preview","--dsw-alias-interactive-bg-hover-solid","--dsw-alias-button-primary-dimmed"],te={panel:"--dsw-elevation-panel",prominent:"--dsw-elevation-prominent",soft:"--dsw-elevation-soft"},Ne="--dsw-elevation-stroke",B={panel:"rgb(1 0 61 / 0)",prominent:"rgb(1 0 62 / 0)",soft:"rgb(1 0 63 / 0)"},R={fill:"--dsw-menu-surface-fill",filter:"--dsw-menu-backdrop-filter",overlayFill:"--dsw-specific-menu",groupHeader:"--dsw-alias-menu-group-header-fill"},P="data-ds-dark-theme",Ce="data-platform",Me="data-markdown-variant",aa=[...Object.values(y),...Le,...Object.values(te),Ne,...Object.values(R)];var jt={bay:{light:{bg:["#b9d4ff","#eef4ff"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,40,120,0.16)",ribbons:[["#9cc6ff","#cfe6ff"],["#5f9df7","#97ccff"],["#4cc0e8","#3d8ff2"],["#2f72e8","#6aaeff"],["#1d4fc4","#4b8cf0"]]},dark:{bg:["#040a1e","#0b1838"],glow:"rgba(80,140,255,0.35)",crest:"rgba(170,210,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#183a8c","#2c63c6"],["#1d55b8","#3a8ae0"],["#0f7fa6","#2266c8"],["#2a3fb0","#4b78e0"],["#101f66","#2647a8"]]}},sunrise:{light:{bg:["#ffd9bf","#fff1e8"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(120,30,60,0.14)",ribbons:[["#ffc49a","#ffe0c2"],["#ff9a8c","#ffc49a"],["#f084b8","#ff9e94"],["#b58cf0","#ef8cc4"],["#7e6ee6","#b48cf0"]]},dark:{bg:["#16070c","#24101e"],glow:"rgba(255,120,90,0.3)",crest:"rgba(255,200,170,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#8a3a1e","#c26434"],["#962c44","#c4563a"],["#82306e","#b0425a"],["#55348e","#8a3a7c"],["#2c2470","#5a3490"]]}},meadow:{light:{bg:["#d2f0dc","#f1faf3"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,80,50,0.14)",ribbons:[["#bfeac8","#e0f6e2"],["#86d8a6","#bdebc8"],["#4fc4a6","#86d89a"],["#2fa59a","#5ccaa0"],["#1f7f86","#3aa894"]]},dark:{bg:["#03120e","#08201a"],glow:"rgba(80,220,160,0.25)",crest:"rgba(170,255,210,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#185c3c","#2a8a56"],["#11704e","#2a9a66"],["#0c6a64","#1a8a6e"],["#0e5260","#127068"],["#08343e","#0e5056"]]}},graphite:{light:{bg:["#dcdfe5","#f4f5f7"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(0,0,0,0.12)",ribbons:[["#d2d6dd","#e8eaee"],["#b6bbc5","#d4d8de"],["#9aa0ac","#bcc1c9"],["#7e8492","#a2a8b2"],["#626876","#868c98"]]},dark:{bg:["#0c0d0f","#1a1b1f"],glow:"rgba(255,255,255,0.12)",crest:"rgba(255,255,255,0.22)",shade:"rgba(0,0,0,0.5)",ribbons:[["#3a3d44","#4e525a"],["#2e3138","#43474f"],["#25282e","#373a42"],["#1d1f24","#2c2f35"],["#141519","#22242a"]]}},lagoon:{light:{bg:["#bdeff0","#effbfb"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(0,90,100,0.15)",ribbons:[["#a6eae6","#d4f6f2"],["#62d6d2","#9fe9e2"],["#2fc0c8","#5fd8cf"],["#1a9fb6","#3cc2c4"],["#0d7a98","#1fa2b2"]]},dark:{bg:["#021317","#06252b"],glow:"rgba(60,220,220,0.25)",crest:"rgba(160,255,250,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0d5a5e","#178a86"],["#0b6e72","#16a0a0"],["#08707e","#0f8e96"],["#075866","#0b7682"],["#043a46","#08525e"]]}},dusk:{light:{bg:["#e4d7ff","#fbf1ff"],glow:"rgba(255,255,255,0.7)",crest:"rgba(255,255,255,0.7)",shade:"rgba(70,20,110,0.15)",ribbons:[["#d9c4ff","#f0e2ff"],["#b79cff","#dcc0ff"],["#e39cdc","#c3a0ff"],["#f08cb4","#d896e8"],["#8a6cf0","#cf86d8"]]},dark:{bg:["#0c0718","#1a0f2e"],glow:"rgba(190,120,255,0.28)",crest:"rgba(230,190,255,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#3a2a7a","#5a3c9c"],["#4c2a86","#7a3a96"],["#6a2c80","#9a3c78"],["#3c2470","#6a2e86"],["#1e1650","#3c2070"]]}},dune:{light:{bg:["#f6e6cf","#fdf7ee"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(110,60,10,0.14)",ribbons:[["#f2dcb8","#faecd6"],["#e9c590","#f4dbb2"],["#dea872","#ecc48e"],["#cf8c5c","#e2a876"],["#b46e48","#cf8c60"]]},dark:{bg:["#120c06","#22170c"],glow:"rgba(255,180,100,0.22)",crest:"rgba(255,220,170,0.26)",shade:"rgba(0,0,0,0.5)",ribbons:[["#5a3e22","#7a5630"],["#6a4426","#8c5c32"],["#74462a","#966036"],["#5e3622","#7c4a2c"],["#3a2216","#58321e"]]}},tide:{light:{bg:["#c6e2ff","#f2f8ff"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(10,50,130,0.16)",ribbons:[["#9ee6ff","#d0f4ff"],["#5fcff5","#9ee6ff"],["#3aa8f0","#5fd0f0"],["#2f7ce6","#4fb0f2"],["#2552c8","#3c88e8"]]},dark:{bg:["#020b1a","#071a33"],glow:"rgba(60,170,255,0.32)",crest:"rgba(150,220,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0f4a7a","#1d74a8"],["#0e5f8e","#1f8ac0"],["#0b6f9a","#1a5fb0"],["#173c94","#2c66c8"],["#0b1f5a","#183c94"]]}}},Yt=[[.14,.2,760],[.76,.16,820],[.5,.86,860],[.94,.7,640],[.26,.92,600]],st=[[.5,.08,720],[.08,.58,700],[.92,.5,700],[.32,.98,620],[.72,.96,640]],qt={prism:{light:{geometry:st,bg:["#f6f3ff","#fdf8fb"],glow:"rgba(255,255,255,0.6)",blobs:[["#ff9ad5",.8],["#8fd3ff",.85],["#ffe27a",.7],["#a6f0c6",.75],["#c3a2ff",.75]]},dark:{geometry:st,bg:["#07061a","#0d0a22"],glow:"rgba(160,120,255,0.16)",blobs:[["#ff3fa4",.55],["#2d9cff",.6],["#ffb800",.35],["#20d38a",.5],["#8b5cff",.55]]}},aurora:{light:{bg:["#e6efff","#f6f1ff"],glow:"rgba(255,255,255,0.55)",blobs:[["#5ec8ff",.9],["#a98bff",.8],["#4fe0b8",.75],["#7aa6ff",.8],["#ffb3dc",.6]]},dark:{bg:["#03061a","#080b26"],glow:"rgba(80,120,255,0.18)",blobs:[["#14c995",.7],["#2f55ff",.75],["#7d3cff",.65],["#00a6cc",.6],["#ff3d93",.38]]}},bloom:{light:{bg:["#fff0e6","#fff8f2"],glow:"rgba(255,255,255,0.55)",blobs:[["#ff9a6b",.85],["#ff86ba",.75],["#ffc94d",.7],["#b893ff",.65],["#ff7676",.5]]},dark:{bg:["#10060d","#1b0a16"],glow:"rgba(255,120,90,0.16)",blobs:[["#ff5a2a",.6],["#e0307f",.65],["#ffa600",.38],["#6f3cff",.6],["#ff3a3a",.38]]}}},Ie={bay:{style:"ribbons"},sunrise:{style:"ribbons"},meadow:{style:"ribbons"},graphite:{style:"ribbons"},lagoon:{style:"ribbons"},dusk:{style:"ribbons"},dune:{style:"ribbons"},tide:{style:"ribbons",groups:[{items:[0,1,2],motion:{duration:36,x:1.2,y:2.4,scale:1.02}},{items:[3,4],motion:{duration:26,x:-1.8,y:-2.2,scale:1}}]},aurora:{style:"blobs",groups:[{items:[0,3],motion:{duration:48,x:7,y:5,scale:1.12}},{items:[1,4],motion:{duration:60,x:-8,y:6,scale:.9}},{items:[2],motion:{duration:40,x:5,y:-7,scale:1.15}}]},prism:{style:"blobs",groups:[{items:[0,2],motion:{duration:56,x:6,y:7,scale:1.1}},{items:[1,3],motion:{duration:46,x:7,y:-6,scale:1.12}},{items:[4],motion:{duration:38,x:-8,y:-5,scale:.92}}]},bloom:{style:"blobs",groups:[{items:[0,3],motion:{duration:52,x:-6,y:6,scale:1.14}},{items:[1,4],motion:{duration:44,x:7,y:-5,scale:.9}},{items:[2],motion:{duration:64,x:-5,y:-6,scale:1.1}}]}},w=1600,T=1e3,at=12;function v(s){return String(Math.round(s*10)/10)}function Xt(s){let e=T*(.26+s*.135),t=T*(.075+s*.012),a=.9+s*.28,i=2.1+s*.45,r=s*1.15+.4,n=[];for(let l=0;l<=at;l++){let c=-w*.06+w*1.12*l/at,u=c/w,d=e+t*Math.sin(a*u*Math.PI*2+r)+t*.38*Math.sin(i*u*Math.PI*2+r*1.7)-u*T*.1;n.push([c,d])}return n}function Jt(s){let e=l=>s[Math.max(0,Math.min(s.length-1,l))]??[0,0],[t,a]=e(0),i=`M${v(t)} ${v(a)}`;for(let l=0;l<s.length-1;l++){let[c,u]=e(l-1),[d,g]=e(l),[f,S]=e(l+1),[O,de]=e(l+2),ce=d+(f-c)/6,H=g+(S-u)/6,z=f-(O-d)/6,V=S-(de-g)/6;i+=`C${v(ce)} ${v(H)} ${v(z)} ${v(V)} ${v(f)} ${v(S)}`}let r=w*1.06,n=-w*.06;return`${i}L${v(r)} ${T+120}L${v(n)} ${T+120}Z`}function De(){return{defs:new Map,body:[]}}var he=.15;function ge(s,e=0){let t=new Map;for(let{defs:i}of s)for(let[r,n]of i)t.set(r,n);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[-w*e,-T*e,w*(1+2*e),T*(1+2*e)].map(v).join(" ")}" preserveAspectRatio="xMidYMid slice"><defs>${[...t.values()].join("")}</defs>${s.flatMap(i=>i.body).join("")}</svg>`}function it(s,e){let t=De();return t.defs.set("b",`<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient>`),t.defs.set("g",`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${w*.22}" cy="${T*.05}" r="${w*.7}"><stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${e}" stop-opacity="0"/></radialGradient>`),t.body.push(`<rect width="${w}" height="${T}" fill="url(#b)"/>`,`<rect width="${w}" height="${T}" fill="url(#g)"/>`),t}function Qt(s,e){let[t,a]=s.ribbons[e]??["#000","#000"],i=De();return i.defs.set("s",'<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>'),i.defs.set("f",'<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>'),i.defs.set("c",'<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>'),i.defs.set(`r${e}`,`<linearGradient id="r${e}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${T*.4}"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="${a}"/></linearGradient>`),i.defs.set(`p${e}`,`<path id="p${e}" d="${Jt(Xt(e))}"/>`),i.body.push(`<use href="#p${e}" fill="${s.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,`<use href="#p${e}" fill="url(#r${e})" fill-opacity="0.92" filter="url(#f)"/>`,`<use href="#p${e}" fill="none" stroke="${s.crest}" stroke-width="2.5" filter="url(#c)"/>`),i}function Zt(s,e,t){let[a,i]=s.blobs[e]??["#000",0],[r,n,l]=(s.geometry??Yt)[e]??[.5,.5,400],c=(t?1-r:r)*w,u=n*T,d=De();return d.defs.set(`o${e}`,`<radialGradient id="o${e}"><stop offset="0" stop-color="${a}" stop-opacity="${i}"/><stop offset="0.45" stop-color="${a}" stop-opacity="${v(i*.55)}"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>`),d.body.push(`<circle cx="${v(c)}" cy="${v(u)}" r="${l}" fill="url(#o${e})"/>`),d}function nt(s,e){if(Ie[s].style==="blobs"){let a=qt[s][e];return[it(a.bg,a.glow),...a.blobs.map((i,r)=>Zt(a,r,s==="bloom"))]}let t=jt[s][e];return[it(t.bg,t.glow),...t.ribbons.map((a,i)=>Qt(t,i))]}function le(s){return Ie[s].groups!==void 0}function es(s,e){return ge(nt(s,e))}function ot(s,e){let t=Ie[s].groups,a=nt(s,e);if(!t)return[{svg:ge(a),motion:void 0}];let[i]=a,r=[{svg:ge(i?[i]:[]),motion:void 0}];for(let n of t){let l=n.items.map(c=>a[c+1]).filter(c=>c!==void 0);r.push({svg:ge(l,he),motion:n.motion})}return r}function Pe(s){return`data:image/svg+xml,${s.replace(/"/g,"'").replace(/\s+/g," ").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E")}`}function fe(s){return`url("${Pe(s)}")`}var rt=new Map;function se(s,e){let t=`${s}|${e}`,a=rt.get(t);return a===void 0&&(a=fe(es(s,e)),rt.set(t,a)),a}function lt(s,e,t){let a="<rect width='100%' height='100%' rx='18' ry='18' fill='none'",i=["<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>","<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",`<stop offset='0' stop-color='white' stop-opacity='${s}'/>`,`<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(s*20)/100}'/>`,"<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",`<stop offset='1' stop-color='white' stop-opacity='${e}'/>`,"</linearGradient>",`${a} stroke='black' stroke-opacity='${t}' stroke-width='1'/>`,`${a} stroke='url(#r)' stroke-width='3'/>`,"</svg>"].join("");return`url("${Pe(i)}")`}var A=`:root[${q}]`,M=`${A} body`,dt=`${A} body[${P}]`,k=`${M} [${h}]`,Oe=`${k}:not([${h}="backdrop"]):not([${m}])`;function p(s,e){let t=Object.entries(e).map(([a,i])=>`  ${a}: ${i};`).join(`
`);return`${s} {
${t}
}`}var ts={[K]:.35,"--glassui-floor":0,"--glassui-tt":`max(var(${K}), var(--glassui-floor))`,"--glassui-blur":"calc(6px + var(--glassui-tt) * 22px)","--glassui-filter":"blur(var(--glassui-blur)) saturate(180%) brightness(1.04)","--glassui-fill-a":"calc(0.16 + var(--glassui-tt) * 0.62)","--glassui-dense-a":"calc(0.52 + var(--glassui-tt) * 0.42)","--glassui-smoke-a":"calc(0.5 + var(--glassui-tt) * 0.42)","--glassui-code-a":"calc(0.4 + var(--glassui-tt) * 0.4)","--glassui-canvas-a":"calc(0.4 + var(--glassui-tt) * 0.5)","--glassui-inset":"8px","--glassui-radius":"18px"},ss={"--glassui-glass-rgb":"255 255 255","--glassui-smoke-rgb":"30 30 32","--glassui-rim-hi":.9,"--glassui-rim-lo":.38,"--glassui-edge":"rgb(0 0 0 / 0.08)","--glassui-drop":"rgb(0 0 0 / 0.14)","--glassui-contact":"rgb(0 0 0 / 0.2)","--glassui-sheen":.2,"--glassui-light-a":.3,"--glassui-pane-rim":lt(.95,.5,.1),[R.fill]:"rgb(250 250 252 / calc(0.5 + var(--glassui-tt) * 0.42))",[R.overlayFill]:"rgb(250 250 252 / calc(0.86 + var(--glassui-tt) * 0.12))",[R.groupHeader]:"rgb(250 250 252 / calc(0.8 + var(--glassui-tt) * 0.18))"},as={"--glassui-glass-rgb":"40 40 44","--glassui-smoke-rgb":"44 44 48","--glassui-rim-hi":.32,"--glassui-rim-lo":.12,"--glassui-edge":"rgb(0 0 0 / 0.5)","--glassui-drop":"rgb(0 0 0 / 0.42)","--glassui-contact":"rgb(0 0 0 / 0.5)","--glassui-sheen":.07,"--glassui-light-a":.16,"--glassui-pane-rim":lt(.4,.18,.5),[R.fill]:"rgb(44 44 48 / calc(0.46 + var(--glassui-tt) * 0.44))",[R.overlayFill]:"rgb(44 44 48 / calc(0.86 + var(--glassui-tt) * 0.12))",[R.groupHeader]:"rgb(44 44 48 / calc(0.8 + var(--glassui-tt) * 0.18))"},is={"--glassui-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","0 0 0 0.5px var(--glassui-edge)"].join(", "),"--glassui-contained-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","inset 0 0 0 0.5px var(--glassui-edge)"].join(", "),[R.filter]:"var(--glassui-filter)",...Object.fromEntries(C.map(s=>[`--glassui-src-${s}`,`var(${y[s]})`]))};function Fe(s,e,t){return`var(${Ne}), var(--glassui-rim), ${e}, ${t}, 0 0 0 0 ${s}`}var rs={[te.panel]:Fe(B.panel,"0 2px 6px -2px rgb(0 0 0 / 0.06)","0 10px 28px -10px var(--glassui-drop)"),[te.prominent]:Fe(B.prominent,"0 3px 10px -3px rgb(0 0 0 / 0.08)","0 18px 44px -14px var(--glassui-drop)"),[te.soft]:Fe(B.soft,"0 4px 16px -6px rgb(0 0 0 / 0.06)","0 14px 36px -16px var(--glassui-drop)")},ns=Object.fromEntries(["panel","prominent","soft"].map(s=>[te[s],["var(--glassui-contained-rim)","0 1px 2px -3px rgb(0 0 0 / 0.12)","0 16px 22px -33px var(--glassui-contact)",`0 0 0 0 ${B[s]}`].join(", ")])),os="linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)",ls=`radial-gradient(240px circle at var(${Z}) var(${ee}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`,ds=[`@property ${Z} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,`@property ${ee} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,"@property --glassui-light { syntax: '*'; inherits: false; }","@property --glassui-pane { syntax: '*'; inherits: false; }","@property --glassui-pane-size { syntax: '*'; inherits: false; }"].join(`
`);function cs(){let s=[p(`${k}[${h}="sidebar"], ${k}[${h}="composer"]`,{"--glassui-pct":"calc(var(--glassui-fill-a) * 100%)"}),p(`${k}[${h}="panel"], ${k}[${h}="menu"]`,{"--glassui-pct":"calc(var(--glassui-dense-a) * 100%)"}),p(`${k}[${h}="smoke"]`,{"--glassui-pct":"calc(var(--glassui-smoke-a) * 100%)"}),p(`${k}[${h}="code"]`,{"--glassui-pct":"calc(var(--glassui-code-a) * 100%)"}),p(`${k}[${h}="backdrop"], ${k}[${m}]`,{"--glassui-pct":"0%"}),p(Oe,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)"}),p(`${M} [${$}]`,{"background-color":"transparent"}),p(`${Oe}[${h}="code"]`,{"box-shadow":"var(--glassui-rim)"})],e=t=>`color-mix(in srgb, var(--glassui-src-${t}) var(--glassui-pct, 100%), transparent)`;for(let t of C)s.push(p(`${k}[${_}="${t}"]`,{[y[t]]:e(t)}));return s.push(p(`${k}[${h}="code"][${_}="code"]`,{[y.codeBanner]:"transparent"})),s.push(p(`${Oe}[${N}]`,{"--glassui-pane":"none","--glassui-pane-size":"100% 100%","background-image":`var(--glassui-light, none), var(--glassui-pane, none), ${os}`,"background-size":"auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)","background-position":"center","background-repeat":"no-repeat"}),p(`${A}[${X}] body [${h}][${N}]`,{"--glassui-light":ls}),p(`${A}[${G}="floating"] body [${h}="sidebar"][${Q}]:not([${m}])`,{"clip-path":"inset(var(--glassui-inset) round var(--glassui-radius))","--glassui-pane":"var(--glassui-pane-rim)","--glassui-pane-size":"calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))"})),s}function us(){let s=`${M} [${L}]`;return[p(`${s}:not([${L}="none"])`,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)","box-shadow":"var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)"}),p(`${s}[${L}="regular"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))"}),p(`${s}[${L}="dense"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))"}),p(`${s}[${L}="smoke"]`,{"background-color":"rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))"})]}function ps(){return[p(`${A}[${I}]`,{background:`var(${W}) center / cover no-repeat fixed`}),p(`${A}[${I}] body`,{"background-color":"color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"})]}function gs(){return[`@media (prefers-contrast: more) {
${[p(A,{"--glassui-floor":.85}),p(M,{"--glassui-edge":"rgb(0 0 0 / 0.45)"}),p(dt,{"--glassui-edge":"rgb(255 255 255 / 0.35)"})].join(`
`)}
}`,`@media (prefers-reduced-transparency: reduce) {
${p(A,{"--glassui-floor":1})}
}`,`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${p(A,{"--glassui-floor":.9})}
}`].join(`
`)}function ct(){return`${["/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",ds,"@media screen and (forced-colors: none) {",p(A,ts),p(M,{...ss,...is}),p(dt,as),p(`${M}, ${M} *`,rs),p(`${k}[${D}]`,{...ns,"box-shadow":"var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"}),...cs(),...us(),...ps(),gs(),"}"].join(`
`)}
`}var hs=new Set(["layer1","layer2","layer3","floating","elevated","overlay","base"]),fs=.5,bs=.25,ms=160;function vs(s,e){if(s!=="none"){for(let t of["prominent","panel","soft"])if(e[t]!==""&&s.includes(e[t]))return t}}function U(s,e,t,a=!1){return{kind:s,fill:e,paint:s!=="backdrop"&&t.backgroundImage==="none",float:a}}function ut(s,e){if(s.managed)return;let t=e.fills.get(s.background),a=vs(s.boxShadow,e.elevation),i=s.area>fs;if(s.backdropFilter!=="none"&&s.backdropFilter===e.menuFilter)return i?void 0:U("menu",void 0,s);switch(t){case"sidebar":return i?U("backdrop",t,s):U("sidebar",t,s,s.width>=ms&&s.boxShadow==="none"&&s.backgroundImage==="none");case"input":return U(i?"backdrop":"composer",t,s);case"toast":case"tooltip":return i?void 0:U("smoke",t,s);case"code":case"codeBanner":return i?void 0:{kind:"code",fill:t,paint:!1,float:!1};case void 0:return;default:break}if(hs.has(t)&&(a==="panel"||a==="prominent"))return U("panel",t,s);if(t==="base"&&a===void 0&&s.area>=bs)return U("backdrop",t,s)}var pt=`[${h}][${N}]:not([${m}]):not([${h}="backdrop"])`,be=class{doc;enabled=!1;frame=0;x=0;y=0;target=null;lit=new Set;constructor(e){this.doc=e}move=e=>{e.pointerType!=="mouse"&&e.pointerType!=="pen"||(this.x=e.clientX,this.y=e.clientY,this.target=e.target instanceof Element?e.target:null,this.schedule())};out=e=>{e.relatedTarget===null&&(this.target=null,this.schedule())};schedule(){let e=this.doc.defaultView;this.frame===0&&e&&(this.frame=e.requestAnimationFrame(this.paint))}paint=()=>{this.frame=0;let e=new Set;for(let t=this.target?.closest(pt);t;t=t.parentElement?.closest(pt))t instanceof HTMLElement&&e.add(t);for(let t of this.lit)e.has(t)||this.clear(t);for(let t of e){let a=t.getBoundingClientRect();t.style.setProperty(Z,`${Math.round(this.x-a.left-t.clientLeft)}px`),t.style.setProperty(ee,`${Math.round(this.y-a.top-t.clientTop)}px`)}this.lit.clear();for(let t of e)this.lit.add(t)};clear(e){e.style.removeProperty(Z),e.style.removeProperty(ee)}setEnabled(e){if(e===this.enabled)return;this.enabled=e;let t=this.doc.defaultView,a=this.doc.documentElement;if(e){a.setAttribute(X,""),t?.addEventListener("pointermove",this.move,{passive:!0,capture:!0}),this.doc.addEventListener("pointerout",this.out,{passive:!0});return}t?.removeEventListener("pointermove",this.move,{capture:!0}),this.doc.removeEventListener("pointerout",this.out),this.frame!==0&&t?.cancelAnimationFrame(this.frame),this.frame=0,this.target=null;for(let i of this.lit)this.clear(i);this.lit.clear(),a.removeAttribute(X)}dispose(){this.setEnabled(!1)}};function ys(s){let e=[],t=0,a=0;for(let i=0;i<s.length;i++){let r=s[i];r==="("?t++:r===")"?t=Math.max(0,t-1):r===","&&t===0&&(e.push(s.slice(a,i)),a=i+1)}return e.push(s.slice(a)),e.map(i=>i.trim()).filter(i=>i.length>0)}function ws(s){let e="",t=0;for(let a of s)a==="("?t++:a===")"?t=Math.max(0,t-1):t===0&&(e+=a);return e}var xs=/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)px/gi;function Ss(s){let e=0,t=0;if(s.trim()==="none")return{x:e,y:t};for(let a of ys(s)){let i=ws(a);if(/\binset\b/i.test(i))continue;let r=[...i.matchAll(xs)].map(g=>Number(g[1]));if(r.length<2)continue;let[n=0,l=0,c=0,u=0]=r,d=Math.max(0,c)*1.5+u;e=Math.max(e,d-n),t=Math.max(t,d-l)}return{x:e,y:t}}function gt(s){let e=Ss(s.boxShadow),t=0;s.outlineStyle!=="none"&&(t=Math.max(0,(parseFloat(s.outlineWidth)||0)+(parseFloat(s.outlineOffset)||0)));let a=i=>Math.max(0,Math.ceil(i-.001));return{x:a(Math.max(e.x,t)),y:a(Math.max(e.y,t))}}function ht(s,e){return Math.max(6,Math.min(Math.min(s,e)*.34,28))}function ft(s){return Math.round(s*1.7)}function bt({width:s,height:e,radius:t,bezel:a}){let i=new Uint8ClampedArray(s*e*4),r=s/2,n=e/2,l=Math.max(0,Math.min(t,r,n));for(let c=0;c<e;c++)for(let u=0;u<s;u++){let d=u+.5-r,g=c+.5-n,f=Math.abs(d)-(r-l),S=Math.abs(g)-(n-l),O=-(Math.hypot(Math.max(f,0),Math.max(S,0))+Math.min(Math.max(f,S),0)-l),de=0,ce=0;if(O>0&&O<a){let z,V;if(f>0&&S>0){let Ve=Math.hypot(f,S)||1;z=f/Ve*Math.sign(d),V=S/Ve*Math.sign(g)}else f>S?(z=Math.sign(d),V=0):(z=0,V=Math.sign(g));let ze=Math.pow(1-O/a,2.4);de=-z*ze,ce=-V*ze}let H=(c*s+u)*4;i[H]=128+de*127,i[H+1]=128+ce*127,i[H+2]=128,i[H+3]=255}return i}function mt(s,e){if(s.size===0)return"";let t=e?`[${P}]`:`:not([${P}])`,a=[...s].map(([i,r])=>`  ${y[i]}: ${Qe(r)};`).join(`
`);return`${A} body${t}:not([${J}]) {
${a}
}`}function vt(s){return`${M} [${h}][${D}="${s}"]:not([${h}="backdrop"]):not([${m}]) {
  backdrop-filter: url(#glassui-lens-${s}) saturate(180%) brightness(1.04);
}`}var me=class{doc;element;nudges="";lenses=new Map;constructor(e){this.doc=e}setNudges(e){e!==this.nudges&&(this.nudges=e,this.flush())}setLens(e,t){if(t===void 0){if(!this.lenses.delete(e))return}else{if(this.lenses.get(e)===t)return;this.lenses.set(e,t)}this.flush()}flush(){this.element?.isConnected||(this.element=this.doc.createElement("style"),this.element.setAttribute(b,"dynamic"),this.doc.head.append(this.element)),this.element.textContent=[this.nudges,...this.lenses.values()].filter(Boolean).join(`
`)}dispose(){this.element?.remove(),this.element=void 0,this.nudges="",this.lenses.clear()}};var yt="http://www.w3.org/2000/svg",Es=12,Ts=.35,ks=160,As=24,Rs="rgb(128 128 128)",Ge={composer:0,smoke:1,menu:2,panel:3},ve=class{doc;sheet;entries=new Map;maps=new Map;resize;defs;enabled=!1;blur=12;nextId=1;frame=0;constructor(e,t){this.doc=e,this.sheet=t;let a=e.defaultView;this.resize=a&&typeof a.ResizeObserver=="function"?new a.ResizeObserver(i=>{for(let r of i)this.resized(r.target)}):void 0}get active(){let e=0;for(let t of this.entries.values())t.live&&e++;return e}setEnabled(e){if(e!==this.enabled){this.enabled=e;for(let t of["focusin","focusout","transitionend","animationend"])e?this.doc.addEventListener(t,this.recheck,{capture:!0,passive:!0}):this.doc.removeEventListener(t,this.recheck,{capture:!0});e||(this.releaseAll(),this.frame!==0&&this.doc.defaultView?.cancelAnimationFrame(this.frame),this.frame=0)}}setBlur(e){if(e!==this.blur){this.blur=e;for(let t of this.defs?.querySelectorAll("feGaussianBlur")??[])t.setAttribute("stdDeviation",this.deviation())}}sync(e){let t=new Set(this.enabled?e.filter(a=>Ge[a.kind]!==void 0&&a.area>0&&a.area<=Ts).sort((a,i)=>(Ge[a.kind]??9)-(Ge[i.kind]??9)||a.area-i.area).slice(0,Es).map(a=>a.element):[]);for(let a of[...this.entries.keys()])(!t.has(a)||!a.isConnected)&&this.release(a);for(let a of t){if(this.entries.has(a)){this.verify(a);continue}let i={id:this.nextId++,key:"",live:!1,timer:void 0};this.entries.set(a,i),a.setAttribute(D,String(i.id)),this.resize?.observe(a),this.schedule(a,0)}}recheck=()=>{let e=this.doc.defaultView;this.frame!==0||!e||(this.frame=e.requestAnimationFrame(()=>{this.frame=0;for(let t of this.entries.keys())this.verify(t)}))};verify(e){let t=this.entries.get(e);!t||t.timer!==void 0||!e.isConnected||t.key!==this.geometryKey(e)&&this.build(e)}deviation(){return(this.blur*.8).toFixed(1)}resized(e){let t=this.entries.get(e);!t||t.key===this.geometryKey(e)||(this.setLive(t,!1),this.schedule(e,ks))}setLive(e,t){e.live!==t&&(e.live=t,this.sheet.setLens(e.id,t?vt(e.id):void 0))}schedule(e,t){let a=this.entries.get(e);a&&(a.timer!==void 0&&clearTimeout(a.timer),a.timer=setTimeout(()=>{a.timer=void 0,this.build(e)},t))}geometryKey(e){let{width:t,height:a}=this.size(e),i=this.doc.defaultView;if(!i)return"";let r=i.getComputedStyle(e),n=Math.round(Math.min(parseFloat(r.borderTopLeftRadius)||0,t/2,a/2)),l=gt(r);return`${t}x${a}r${n}s${l.x},${l.y}`}size(e){if(e instanceof(this.doc.defaultView?.HTMLElement??HTMLElement))return{width:Math.round(e.offsetWidth),height:Math.round(e.offsetHeight)};let t=e.getBoundingClientRect();return{width:Math.round(t.width),height:Math.round(t.height)}}build(e){let t=this.entries.get(e);if(!t||!this.enabled)return;if(!e.isConnected){this.release(e);return}let a=this.geometryKey(e),i=/^(\d+)x(\d+)r(\d+)s(\d+),(\d+)$/.exec(a);t.key=a;let r=Number(i?.[1]??0),n=Number(i?.[2]??0),l=Number(i?.[3]??0),c={x:Number(i?.[4]??0),y:Number(i?.[5]??0)};if(!i||r<8||n<8||c.x!==0||c.y!==0){this.setLive(t,!1);return}let u=ht(r,n),d=this.map(`${r}x${n}r${l}`,{width:r,height:n,radius:l,bezel:u});if(d===void 0){this.setLive(t,!1);return}let g={x:String(-c.x),y:String(-c.y),width:String(r),height:String(n)},f=this.filter(t.id);for(let[S,O]of Object.entries(g))f.setAttribute(S,O);f.replaceChildren(this.node("feGaussianBlur",{in:"SourceGraphic",stdDeviation:this.deviation(),edgeMode:"duplicate",result:"blur"}),this.node("feFlood",{...g,"flood-color":Rs,result:"neutral"}),this.node("feImage",{...g,href:d,preserveAspectRatio:"none",result:"image"}),this.node("feMerge",{result:"map"},[this.node("feMergeNode",{in:"neutral"}),this.node("feMergeNode",{in:"image"})]),this.node("feDisplacementMap",{in:"blur",in2:"map",scale:String(ft(u)),xChannelSelector:"R",yChannelSelector:"G"})),this.setLive(t,!0)}map(e,t){let a=this.maps.get(e);if(a!==void 0)return a;let i=this.doc.createElement("canvas");i.width=t.width,i.height=t.height;let r=i.getContext("2d");if(!r)return;let n=r.createImageData(t.width,t.height);n.data.set(bt(t)),r.putImageData(n,0,0);let l=i.toDataURL("image/png");if(this.maps.set(e,l),this.maps.size>As){let c=this.maps.keys().next().value;c!==void 0&&this.maps.delete(c)}return l}filter(e){let t=this.doc.getElementById(`glassui-lens-${e}`);if(t instanceof(this.doc.defaultView?.SVGFilterElement??SVGFilterElement))return t;let a=this.node("filter",{id:`glassui-lens-${e}`,x:"0",y:"0",filterUnits:"userSpaceOnUse",primitiveUnits:"userSpaceOnUse","color-interpolation-filters":"sRGB"});return this.container().append(a),a}container(){if(this.defs?.isConnected)return this.defs;let e=this.doc.createElementNS(yt,"svg");return e.setAttribute(b,"defs"),e.setAttribute("aria-hidden","true"),e.setAttribute("focusable","false"),e.setAttribute("width","0"),e.setAttribute("height","0"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none",this.doc.body.append(e),this.defs=e,e}node(e,t,a=[]){let i=this.doc.createElementNS(yt,e);for(let[r,n]of Object.entries(t))i.setAttribute(r,n);return i.append(...a),i}release(e){let t=this.entries.get(e);t&&(t.timer!==void 0&&clearTimeout(t.timer),this.resize?.unobserve(e),this.setLive(t,!1),e.removeAttribute(D),this.doc.getElementById(`glassui-lens-${t.id}`)?.remove(),this.entries.delete(e))}releaseAll(){for(let e of[...this.entries.keys()])this.release(e)}dispose(){this.setEnabled(!1),this.releaseAll(),this.resize?.disconnect(),this.defs?.remove(),this.defs=void 0,this.maps.clear()}};var ae="rgba(0, 0, 0, 0)",ye=class{doc;host;cache=new Map;constructor(e){this.doc=e}container(){if(this.host?.isConnected)return this.host;let e=this.doc.createElement("div");return e.setAttribute(b,"probes"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict",this.doc.body.append(e),this.host=e,this.cache.clear(),e}probe(e,t){let a=this.cache.get(e);if(a?.isConnected)return a;let i=this.doc.createElement("div");return t(i),this.container().append(i),this.cache.set(e,i),i}style(e){let t=this.doc.defaultView;if(!t)throw new Error("dsh-glassui: probes need a document with a window");return t.getComputedStyle(e)}color(e){return this.style(this.probe(`bg:${e}`,t=>t.style.background=`var(${e})`)).backgroundColor}raw(){let e=this.doc.body;e.setAttribute(J,"");try{let t=new Map(C.map(i=>[i,this.color(y[i])])),a=Le.map(i=>this.color(i)).filter(i=>i!==ae);return{watched:t,reserved:a}}finally{e.removeAttribute(J)}}elevation(){let e=t=>this.style(this.probe(`sentinel:${t}`,a=>a.style.color=B[t])).color;return{panel:e("panel"),prominent:e("prominent"),soft:e("soft")}}menuFilter(){return this.style(this.probe("menu-filter",e=>e.style.setProperty("backdrop-filter",`var(${R.filter})`))).backdropFilter}tagged(e,t,a){let i=this.probe(`tagged:${e}:${t}:${a}`,r=>{r.setAttribute(h,e),r.setAttribute(_,t),a&&r.setAttribute(m,""),r.style.background=`var(${y[t]})`});return this.style(i).backgroundColor}dispose(){this.host?.remove(),this.host=void 0,this.cache.clear()}};var _s=12;function $s(s,e,t){switch(s.wallpaper){case"none":return;case"custom":return re(s.wallpaperUrl)?{name:"custom",image:`url("${s.wallpaperUrl}")`,preset:void 0}:void 0;case"auto":return t?void 0:{name:"bay",image:se("bay",e),preset:"bay"};default:return{name:s.wallpaper,image:se(s.wallpaper,e),preset:s.wallpaper}}}function Ls(s){let e=[[0,0],[.2,.1],[.5,.5],[.8,.9],[1,1]],t=1+2*he;return e.map(([a,i])=>({offset:a,transform:`translate(${Ke(s.x*i/t)}%, ${Ke(s.y*i/t)}%) scale(${Ke(1+(s.scale-1)*i,4)})`}))}function Ke(s,e=3){let t=10**e;return Math.round(s*t)/t}var We=class{doc;container;layers=[];key="";constructor(e){this.doc=e}show(e,t){let a=`${e}|${t.length}`;if(this.container?.isConnected&&a===this.key){t.forEach((l,c)=>this.layers[c]?.style.setProperty("background-image",l.image));return}this.hide(),this.key=a;let i=this.doc.createElement("div");i.setAttribute(b,"wallpaper"),i.setAttribute("aria-hidden","true"),i.style.cssText="position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;";let r=this.doc.createElement("div");r.style.cssText="position:absolute;left:50%;top:50%;width:max(100vw,160vh);height:max(100vh,62.5vw);transform:translate(-50%,-50%);",i.append(r);for(let l of t){let c=this.doc.createElement("div");c.style.cssText=`position:absolute;inset:${-he*100}%;background:center / 100% 100% no-repeat;will-change:transform;`,c.style.setProperty("background-image",l.image),r.append(c),this.layers.push(c),typeof c.animate=="function"&&c.animate(Ls(l.motion),{duration:l.motion.duration*1e3,iterations:Number.POSITIVE_INFINITY,direction:"alternate",easing:`steps(${l.motion.duration*_s})`})}this.doc.documentElement.insertBefore(i,this.doc.body),this.container=i}hide(){for(let e of this.layers)for(let t of e.getAnimations())t.cancel();this.layers=[],this.container?.remove(),this.container=void 0,this.key=""}},we=class{doc;live;cache=new Map;layerCache=new Map;current;constructor(e){this.doc=e,this.live=new We(e)}apply(e,t,a,i=!0){let r=`${e.wallpaper}|${e.wallpaperUrl}|${t}|${a}|${i}`;if(r===this.current)return;this.current=r,this.cache.has(r)||this.cache.set(r,$s(e,t,a));let n=this.cache.get(r),l=this.doc.documentElement;if(!n){this.live.hide(),l.removeAttribute(I),l.style.removeProperty(W);return}let c=n.preset;if(i&&c!==void 0&&le(c)){let u=this.layers(c,t);l.style.setProperty(W,u.base),this.live.show(c,u.moving)}else this.live.hide(),l.style.setProperty(W,n.image);l.setAttribute(I,n.name)}layers(e,t){let a=`${e}|${t}`,i=this.layerCache.get(a);if(!i){let[r,...n]=ot(e,t);i={base:r?fe(r.svg):"none",moving:n.flatMap(l=>l.motion?[{image:fe(l.svg),motion:l.motion}]:[])},this.layerCache.set(a,i)}return i}dispose(){this.live.hide();let e=this.doc.documentElement;e.removeAttribute(I),e.style.removeProperty(W),this.current=void 0}};var xe=new Set(["DIV","ASIDE","NAV","HEADER","FOOTER","SECTION","MAIN","FORM","DIALOG","MENU","UL","OL","ARTICLE","BUTTON","FIELDSET","DETAILS"]),Ns=new Set(["SVG","PRE","CODE","TABLE","IFRAME","VIDEO","CANVAS","IMG","TEXTAREA","SELECT","SCRIPT","STYLE","TEMPLATE"]),Cs="/* dsh-glassui:",Ms=8,Is=new Set(["sidebar","composer","panel","smoke","code"]);function Ds(){return Object.fromEntries(oe.map(s=>[s,0]))}function Ps(s,e){let t=e.trim();if(t==="")return"";try{return s.createDocumentFragment().querySelector(t),t}catch{return}}var Se=class{win;doc;env;onChange;settings;running=!1;idle="disabled";probes;sheet;lenses;highlights;wallpaper;ownSheet;signatures;rawKey="";expected=new Map;missing=[];ambiguous=[];tagged=new Map;echoes=new Set;roots=new Set;singles=new Set;requeue=[];walkers=[];frame=0;paletteDirty=!1;exclude="";invalidExclude=!1;stats={batches:0,inspected:0,longestMs:0,totalMs:0};subtree;bodyWatch;rootWatch;headWatch;stopEnvironment;disposed=!1;constructor(e,t,a){this.win=e,this.doc=e.document,this.env=t,this.onChange=a,this.probes=new ye(this.doc),this.sheet=new me(this.doc),this.lenses=new ve(this.doc,this.sheet),this.highlights=new be(this.doc),this.wallpaper=new we(this.doc),this.stopEnvironment=this.env.onChange(()=>{this.settings&&this.apply(this.settings),this.paletteChanged()})}get active(){return this.running}apply(e){if(this.disposed)return;let t=this.settings;if(this.settings=e,!e.enabled||this.env.forcedColors()){this.idle=e.enabled?"forced-colors":"disabled",this.stop();return}if(!this.running){this.start();return}let a=this.doc.documentElement;a.setAttribute(G,e.sidebar),t?.tint!==e.tint&&(a.style.setProperty(K,String(e.tint/100)),this.expected.clear(),this.lenses.setBlur(this.blurPx())),t?.exclude!==e.exclude&&this.updateExclude(!0),t?.codeBlocks!==e.codeBlocks&&this.updateCodeBlocks(),this.applyPresentation()}start(){let e=this.settings;if(!e||!this.doc.body)return;this.running=!0,this.idle=void 0,this.ensureStylesheet();let t=this.doc.documentElement;t.setAttribute(q,"on"),t.setAttribute(G,e.sidebar),t.style.setProperty(K,String(e.tint/100)),this.lenses.setBlur(this.blurPx()),this.updateExclude(!1),this.refreshPalette(),this.applyPresentation(),this.subtree=new this.win.MutationObserver(a=>this.mutated(a)),this.subtree.observe(this.doc.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style",ne,L,"contenteditable"],attributeOldValue:!0}),this.bodyWatch=new this.win.MutationObserver(()=>this.paletteChanged()),this.bodyWatch.observe(this.doc.body,{attributes:!0,attributeFilter:[P,"style","class"]}),this.rootWatch=new this.win.MutationObserver(()=>this.applyPresentation()),this.rootWatch.observe(t,{attributes:!0,attributeFilter:[Ce]}),this.headWatch=new this.win.MutationObserver(a=>{a.some(i=>!this.ownRecord(i))&&this.paletteChanged()}),this.headWatch.observe(this.doc.head,{childList:!0,subtree:!0,characterData:!0}),this.doc.addEventListener("load",this.loaded,!0),this.doc.addEventListener("transitionend",this.settled,!0),this.doc.addEventListener("animationend",this.settled,!0),this.roots.add(this.doc.body),this.schedule()}stop(){let e=this.running;this.running=!1,this.frame!==0&&this.win.cancelAnimationFrame(this.frame),this.frame=0,this.subtree?.disconnect(),this.bodyWatch?.disconnect(),this.rootWatch?.disconnect(),this.headWatch?.disconnect(),this.subtree=this.bodyWatch=this.rootWatch=this.headWatch=void 0,this.doc.removeEventListener("load",this.loaded,!0),this.doc.removeEventListener("transitionend",this.settled,!0),this.doc.removeEventListener("animationend",this.settled,!0),this.roots.clear(),this.singles.clear(),this.walkers=[],this.requeue.length=0,this.lenses.dispose(),this.highlights.dispose(),this.wallpaper.dispose(),this.sheet.dispose(),this.probes.dispose(),this.ownSheet?.remove(),this.ownSheet=void 0;for(let a of[...this.tagged.keys()])this.untag(a);for(let a of this.echoes)a.removeAttribute($);this.echoes.clear(),this.signatures=void 0,this.rawKey="",this.expected.clear();let t=this.doc.documentElement;t.removeAttribute(q),t.removeAttribute(G),t.style.removeProperty(K);for(let a of this.doc.querySelectorAll(et)){if(a.hasAttribute(b)){a.remove();continue}for(let i of[...a.getAttributeNames()])i.startsWith("data-glassui")&&i!==ne&&i!==L&&a.removeAttribute(i)}e&&this.changed()}dispose(){this.disposed=!0,this.stopEnvironment?.(),this.stopEnvironment=void 0,this.stop(),this.notifyFrame!==0&&this.win.cancelAnimationFrame(this.notifyFrame),this.notifyFrame=0}diagnostics(){let e=Ds();for(let[t,a]of this.tagged)!a.flat&&t.isConnected&&e[a.kind]++;return{running:this.running,idle:this.running?void 0:this.idle,environment:{refraction:this.env.refraction,finePointer:this.env.finePointer(),reducedTransparency:this.env.reducedTransparency(),reducedMotion:this.env.reducedMotion()},missingTokens:[...this.missing],ambiguousTokens:[...this.ambiguous],surfaces:e,lenses:this.lenses.active,invalidExclude:this.invalidExclude,scans:{...this.stats}}}blurPx(){let e=(this.settings?.tint??35)/100;return 6+Math.max(e,this.env.reducedTransparency()?1:0,this.env.increasedContrast()?.85:0)*22}scheme(){return this.doc.body.hasAttribute(P)?"dark":"light"}applyPresentation(){let e=this.settings;if(!this.running||!e)return;this.lenses.setBlur(this.blurPx());let t=this.doc.documentElement.getAttribute(Ce)==="darwin";this.wallpaper.apply(e,this.scheme(),t,!this.env.reducedMotion()),this.highlights.setEnabled(e.highlights&&this.env.finePointer()&&!this.env.reducedMotion()&&!this.env.reducedTransparency()),this.lenses.setEnabled(e.refraction&&this.env.refraction&&!this.env.reducedTransparency()),this.syncLenses()}ensureStylesheet(){for(let t of this.doc.querySelectorAll("style"))if(t.textContent.startsWith(Cs))return;let e=this.doc.createElement("style");e.setAttribute(b,"stylesheet"),e.textContent=ct(),this.doc.head.append(e),this.ownSheet=e}updateCodeBlocks(){if(this.settings?.codeBlocks!=="glass"){for(let[e,t]of[...this.tagged])t.kind==="code"&&this.untag(e);this.syncLenses(),this.changed()}this.rawKey="",this.paletteChanged()}codeGlass(){return this.settings?.codeBlocks==="glass"}watchedFills(){return this.codeGlass()?[...C]:C.filter(e=>!tt.has(e))}updateExclude(e){let t=Ps(this.doc,this.settings?.exclude??"");this.invalidExclude=t===void 0;let a=t??"";if(a!==this.exclude&&(this.exclude=a,!!e)){if(a!==""){for(let i of[...this.tagged.keys()])i.closest(a)&&this.untag(i);for(let i of this.echoes)i.closest(a)&&(i.removeAttribute($),this.echoes.delete(i))}this.syncLenses(),this.changed(),this.roots.add(this.doc.body),this.schedule()}}paletteChanged(){this.running&&(this.paletteDirty=!0,this.schedule())}refreshPalette(){let e=this.probes.raw(),t=this.watchedFills(),a=[...e.reserved,...C.filter(d=>!t.includes(d)).map(d=>e.watched.get(d)??ae)],i=[...e.watched.values(),...e.reserved,t.length].join("|")+this.scheme(),r=i!==this.rawKey;this.rawKey=i;let n=d=>d===ae?void 0:$e(d),l=Ze(t.map(d=>[d,n(e.watched.get(d)??ae)]),a.map(n).filter(d=>d!==void 0));this.sheet.setNudges(mt(l,this.scheme()==="dark"));let c=new Map,u=new Map;this.missing=[];for(let d of t){if(e.watched.get(d)===ae){this.missing.push(d);continue}let g=this.probes.color(y[d]);u.set(g,[...u.get(g)??[],d])}this.ambiguous=[];for(let[d,g]of u){let[f]=g;g.length===1&&f!==void 0?c.set(d,f):this.ambiguous.push(...g)}return this.signatures={fills:c,elevation:this.probes.elevation(),menuFilter:this.probes.menuFilter()},this.expected.clear(),r}loaded=e=>{e.target instanceof this.win.HTMLLinkElement&&this.paletteChanged()};ownedNode(e){let t=e instanceof this.win.Element?e:e.parentElement;return t!==null&&t.closest(`[${b}]`)!==null}ownRecord(e){if(this.ownedNode(e.target))return!0;if(e.type!=="childList")return!1;let t=[...e.addedNodes,...e.removedNodes];return t.length>0&&t.every(a=>a instanceof this.win.Element&&a.hasAttribute(b))}settled=e=>{let t=e.target;this.running&&t instanceof this.win.Element&&xe.has(t.tagName)&&(this.singles.add(t),this.schedule())};mutated(e){let t=!1;for(let a of e)if(!this.ownRecord(a)){if(a.type==="attributes"){if(!(a.target instanceof this.win.Element)||a.attributeName==="style"&&this.onlyOwnStyleChanged(a))continue;this.clearSubtree(a.target),this.roots.add(a.target);continue}for(let i of a.addedNodes)i instanceof this.win.Element&&!i.hasAttribute(b)&&(this.clearSubtree(i),this.roots.add(i));a.removedNodes.length>0&&(t=!0)}t&&this.prune(),this.schedule()}onlyOwnStyleChanged(e){let t=a=>{let i=this.doc.createElement("div").style;i.cssText=a;for(let r of[...i])r.startsWith("--glassui-")&&i.removeProperty(r);return i.cssText};return t(e.oldValue??"")===t(e.target.getAttribute("style")??"")}clearSubtree(e){for(let t of[...this.tagged.keys()])e.contains(t)&&this.untag(t);for(let t of this.echoes)e.contains(t)&&(t.removeAttribute($),this.echoes.delete(t));this.syncLenses(),this.changed()}schedule(){this.running&&this.frame===0&&(this.frame=this.win.requestAnimationFrame(this.process))}process=()=>{if(this.frame=0,!this.running)return;let e=performance.now();if(this.paletteDirty){this.paletteDirty=!1;let n=this.refreshPalette();if(this.applyPresentation(),n)this.roots.add(this.doc.body);else for(let l of this.tagged.keys())this.singles.add(l)}for(let n of this.roots)this.admissible(n)&&n.isConnected&&!this.walkers.some(l=>!l.started&&l.root.contains(n))&&(this.walkers=this.walkers.filter(l=>l.started||!n.contains(l.root)),this.walkers.push({root:n,walker:this.walker(n),started:!1}));this.roots.clear();let t=e+Ms,a=[];for(let n of this.singles)if(this.singles.delete(n),n.isConnected&&xe.has(n.tagName)&&this.admissible(n)&&a.push(this.inspect(n)),(a.length&63)===0&&performance.now()>t)break;e:for(;this.walkers.length>0&&performance.now()<=t;){let n=this.walkers[0];if(!n)break;if(!n.root.isConnected||!this.admissible(n.root)){this.walkers.shift();continue}n.started||(n.started=!0,xe.has(n.root.tagName)&&this.admissible(n.root)&&a.push(this.inspect(n.root)));for(let l=n.walker.nextNode();l;l=n.walker.nextNode())if(a.push(this.inspect(l)),(a.length&63)===0&&performance.now()>t)break e;this.walkers.shift()}let i=!1;for(let n of a)i=this.commit(n)||i;for(let n of this.requeue.splice(0))this.singles.add(n);i&&this.syncLenses();let r=performance.now()-e;this.stats.batches++,this.stats.inspected+=a.length,this.stats.totalMs+=r,this.stats.longestMs=Math.max(this.stats.longestMs,r),i&&this.changed(),(this.walkers.length>0||this.roots.size>0||this.singles.size>0)&&this.schedule()};admissible(e){return e.closest(`[${b}],[${ne}],[contenteditable]`)?!1:this.exclude===""||!e.closest(this.exclude)}walker(e){let t=a=>{let i=a,r=i.tagName;if(this.codeGlass()&&i.hasAttribute(Me)){this.singles.add(i);for(let n of i.querySelectorAll("div"))this.singles.add(n);return NodeFilter.FILTER_REJECT}return Ns.has(r.toUpperCase())||i.hasAttribute(b)||i.hasAttribute(ne)||i.hasAttribute("contenteditable")||i.hasAttribute(Me)||this.exclude!==""&&i.matches(this.exclude)?NodeFilter.FILTER_REJECT:xe.has(r)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP};return this.doc.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:t})}inspect(e){let t=this.signatures,a=this.tagged.get(e);if(!t)return{element:e,verdict:void 0,area:0,untag:!1};let i=this.win.getComputedStyle(e);if(a)return(a.kind==="menu"?i.backdropFilter!=="none":a.fill!==void 0&&i.backgroundColor===this.expectedFor(a.kind,a.fill,a.flat))?{element:e,verdict:void 0,area:a.area,untag:!1}:(this.requeue.push(e),{element:e,verdict:void 0,area:0,untag:!0});let r=i.backgroundColor,n=i.backdropFilter;if(!t.fills.has(r)&&(n==="none"||n!==t.menuFilter))return{element:e,verdict:void 0,area:0,untag:!1,echo:this.echoes.has(e)||this.isEcho(e,r)};let l=e.getBoundingClientRect(),c=Math.max(1,this.win.innerWidth*this.win.innerHeight),u={background:r,backgroundImage:i.backgroundImage,boxShadow:i.boxShadow,backdropFilter:n,area:l.width*l.height/c,width:l.width,managed:e.hasAttribute(L)};return{element:e,verdict:ut(u,t),area:u.area,untag:!1}}isEcho(e,t){let a=$e(t);if(!a||a.a===0||a.a>=1)return!1;let i=e.parentElement?.closest(`[${h}]:not([${m}])`),r=i?this.tagged.get(i):void 0;return!r||r.kind==="backdrop"||r.kind==="menu"||r.fill===void 0?!1:t===this.expectedFor(r.kind,r.fill,!1)}expectedFor(e,t,a){let i=`${e}|${t}|${a}`,r=this.expected.get(i);return r===void 0&&(r=this.probes.tagged(e,t,a),this.expected.set(i,r)),r}commit(e){let{element:t,verdict:a}=e;if(e.untag)return this.untag(t),!0;if(e.echo&&!this.echoes.has(t))return t.setAttribute($,""),this.echoes.add(t),!1;if(!a||this.tagged.has(t)||!t.isConnected)return!1;let i=!1;if(a.fill!==void 0&&Is.has(a.kind)){let r=a.kind==="code"?`[${h}="code"]`:`[${_}="${a.fill}"]`,n=t.parentElement?.closest(`${r}:not([${m}])`);i=n!=null&&this.tagged.get(n)?.kind!=="backdrop"}return t.setAttribute(h,a.kind),a.fill!==void 0&&t.setAttribute(_,a.fill),i&&t.setAttribute(m,""),a.paint&&!i&&t.setAttribute(N,""),a.float&&!i&&t.setAttribute(Q,""),this.tagged.set(t,{kind:a.kind,fill:a.fill,flat:i,area:e.area}),i&&this.requeue.push(t),!0}untag(e){for(let t of[h,_,m,N,Q])e.removeAttribute(t);this.tagged.delete(e);for(let t of this.echoes)e.contains(t)&&(t.removeAttribute($),this.echoes.delete(t))}prune(){for(let t of this.echoes)t.isConnected||(t.removeAttribute($),this.echoes.delete(t));let e=!1;for(let t of this.tagged.keys())t.isConnected||(this.untag(t),e=!0);e&&(this.syncLenses(),this.changed())}syncLenses(){let e=[];for(let[t,a]of this.tagged)!a.flat&&t.isConnected&&e.push({element:t,kind:a.kind,area:a.area});this.lenses.sync(e)}notifyFrame=0;changed(){this.disposed||!this.onChange||this.notifyFrame!==0||(this.notifyFrame=this.win.requestAnimationFrame(()=>{this.notifyFrame=0,this.onChange?.()}))}};function wt(s){let e=d=>typeof s.matchMedia=="function"?s.matchMedia(d):void 0,t=e("(hover: hover) and (pointer: fine)"),a=e("(prefers-reduced-motion: reduce)"),i=e("(prefers-reduced-transparency: reduce)"),r=e("(prefers-contrast: more)"),n=e("(forced-colors: active)"),l=s.navigator.userAgentData?.brands,c=l?l.some(d=>/Chromium/i.test(d.brand)):/(?:Chrome|Chromium)\/\d/.test(s.navigator.userAgent),u=typeof s.CSS<"u"&&typeof s.CSS.supports=="function"&&s.CSS.supports("backdrop-filter","url(#a)");return{refraction:c&&u,finePointer:()=>t?.matches??!1,reducedMotion:()=>a?.matches??!1,reducedTransparency:()=>i?.matches??!1,increasedContrast:()=>r?.matches??!1,forcedColors:()=>n?.matches??!1,onChange(d){let g=[t,a,i,r,n].filter(f=>f!==void 0);for(let f of g)f.addEventListener("change",d);return()=>{for(let f of g)f.removeEventListener("change",d)}}}}var Be="dsh-glassui",xt={title:"Glass UI",subtitle:"Adjust glass, wallpaper and effects.","status.on":"On","status.off":"Off","status.forced":"Paused while high contrast is on","status.surfaces":"{count} glass surfaces","section.material":"Material","enable.label":"Glass material","enable.hint":"Turn off to see DSH\u2019s original look.","tint.label":"Transparency","tint.clear":"Clear","tint.tinted":"Tinted","section.wallpaper":"Wallpaper","wallpaper.auto":"Automatic","wallpaper.auto.hint":"Bay in a browser, none in the macOS app.","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"Live","wallpaper.live.hint":"Moves slowly. It holds still with Reduce Motion, and costs a little more power than a still wallpaper.","wallpaper.none":"None","wallpaper.custom":"Custom","wallpaper.url.label":"Image URL","wallpaper.url.placeholder":"https://\u2026 or /path/on/this/server.jpg","wallpaper.url.invalid":"Use an http(s) URL, a path on this server, or a base64 image data URL.","section.layout":"Layout and effects","sidebar.label":"Sidebar","sidebar.floating":"Floating","sidebar.docked":"Docked","code.label":"Code blocks","code.hint":"Glass is a denser tint that keeps code easy to read.","code.glass":"Glass","code.solid":"Solid","refraction.label":"Refraction","refraction.hint":"Bends the background along glass edges.","refraction.unavailable":"Needs a Chromium-based browser such as Chrome, Edge or the DSH desktop app.","highlights.label":"Pointer highlights","highlights.hint":"A soft light follows the pointer. Off on touch screens and with Reduce Motion.","section.compat":"Compatibility","exclude.label":"Leave these elements alone","exclude.hint":"CSS selectors, comma separated. Use this when another plugin looks wrong under glass.","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"This selector is not valid, so it is ignored.","diag.title":"Diagnostics","diag.surfaces":"Glass surfaces","diag.lenses":"Refracting now","diag.tokens":"DSH theme tokens","diag.tokens.ok":"All found","diag.tokens.missing":"Not in this DSH release: {list}","diag.tokens.ambiguous":"Indistinguishable: {list}","diag.scan":"Scanning","diag.scan.value":"{batches} passes, longest {longest} ms","diag.copy":"Copy diagnostics","diag.copied":"Copied","diag.copy.failed":"Copy failed. Select the text below instead.","kind.sidebar":"Sidebar","kind.composer":"Composer","kind.panel":"Panels","kind.menu":"Menus","kind.smoke":"Toasts and tooltips","kind.code":"Code blocks","kind.backdrop":"Backgrounds","save.local":"This connection cannot save settings, so changes last until the page reloads.","save.error":"Could not save the change. The previous value is back.","save.saving":"Saving\u2026",footer:"dsh-glassui {version}. Unofficial; not affiliated with DeepSeek."},St={title:"Glass UI",subtitle:"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F\u3001\u58C1\u7D19\u3001\u8868\u793A\u52B9\u679C\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002","status.on":"\u30AA\u30F3","status.off":"\u30AA\u30D5","status.forced":"\u30CF\u30A4\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u306E\u305F\u3081\u4E00\u6642\u505C\u6B62\u4E2D","status.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762 {count} \u500B","section.material":"\u8CEA\u611F","enable.label":"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F","enable.hint":"\u30AA\u30D5\u306B\u3059\u308B\u3068 DSH \u672C\u6765\u306E\u898B\u305F\u76EE\u306B\u623B\u308A\u307E\u3059\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u30AF\u30EA\u30A2","tint.tinted":"\u30C6\u30A3\u30F3\u30C8","section.wallpaper":"\u58C1\u7D19","wallpaper.auto":"\u81EA\u52D5","wallpaper.auto.hint":"\u30D6\u30E9\u30A6\u30B6\u3067\u306F Bay\u3001macOS \u30A2\u30D7\u30EA\u3067\u306F\u58C1\u7D19\u306A\u3057\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52D5\u304F","wallpaper.live.hint":"\u3086\u3063\u304F\u308A\u52D5\u304D\u307E\u3059\u3002\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u304C\u30AA\u30F3\u306E\u3068\u304D\u306F\u6B62\u307E\u308A\u307E\u3059\u3002\u9759\u6B62\u3057\u305F\u58C1\u7D19\u3088\u308A\u5C11\u3057\u3060\u3051\u96FB\u529B\u3092\u4F7F\u3044\u307E\u3059\u3002","wallpaper.none":"\u306A\u3057","wallpaper.custom":"\u30AB\u30B9\u30BF\u30E0","wallpaper.url.label":"\u753B\u50CF\u306E URL","wallpaper.url.placeholder":"https://\u2026 \u307E\u305F\u306F /\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9.jpg","wallpaper.url.invalid":"http(s) \u306E URL\u3001\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9\u3001\u307E\u305F\u306F base64 \u306E\u753B\u50CF\u30C7\u30FC\u30BF URL \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002","section.layout":"\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u52B9\u679C","sidebar.label":"\u30B5\u30A4\u30C9\u30D0\u30FC","sidebar.floating":"\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0","sidebar.docked":"\u30C9\u30C3\u30AD\u30F3\u30B0","code.label":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","code.hint":"\u30AC\u30E9\u30B9\u306F\u30B3\u30FC\u30C9\u304C\u8AAD\u307F\u3084\u3059\u3044\u6FC3\u3055\u306B\u3057\u3066\u3042\u308A\u307E\u3059\u3002","code.glass":"\u30AC\u30E9\u30B9","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u5C48\u6298","refraction.hint":"\u30AC\u30E9\u30B9\u306E\u7E01\u3067\u80CC\u666F\u304C\u66F2\u304C\u3063\u3066\u898B\u3048\u307E\u3059\u3002","refraction.unavailable":"Chrome\u3001Edge\u3001DSH \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u306A\u3069 Chromium \u7CFB\u306E\u30D6\u30E9\u30A6\u30B6\u3067\u4F7F\u3048\u307E\u3059\u3002","highlights.label":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u30CF\u30A4\u30E9\u30A4\u30C8","highlights.hint":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u4F4D\u7F6E\u306B\u67D4\u3089\u304B\u3044\u5149\u304C\u5F53\u305F\u308A\u307E\u3059\u3002\u30BF\u30C3\u30C1\u753B\u9762\u3068\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u3067\u306F\u30AA\u30D5\u306B\u306A\u308A\u307E\u3059\u3002","section.compat":"\u4E92\u63DB\u6027","exclude.label":"\u5909\u66F4\u3057\u306A\u3044\u8981\u7D20","exclude.hint":"CSS \u30BB\u30EC\u30AF\u30BF\u30FC\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\u6307\u5B9A\u3057\u307E\u3059\u3002\u307B\u304B\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u304C\u5D29\u308C\u308B\u3068\u304D\u306B\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u30BB\u30EC\u30AF\u30BF\u30FC\u306E\u66F8\u304D\u65B9\u304C\u6B63\u3057\u304F\u306A\u3044\u305F\u3081\u3001\u7121\u8996\u3057\u3066\u3044\u307E\u3059\u3002","diag.title":"\u8A3A\u65AD\u60C5\u5831","diag.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762","diag.lenses":"\u5C48\u6298\u4E2D","diag.tokens":"DSH \u306E\u30C6\u30FC\u30DE\u30C8\u30FC\u30AF\u30F3","diag.tokens.ok":"\u3059\u3079\u3066\u898B\u3064\u304B\u308A\u307E\u3057\u305F","diag.tokens.missing":"\u3053\u306E\u7248\u306E DSH \u306B\u306A\u3044\u3082\u306E: {list}","diag.tokens.ambiguous":"\u533A\u5225\u3067\u304D\u306A\u3044\u3082\u306E: {list}","diag.scan":"\u8D70\u67FB","diag.scan.value":"{batches} \u56DE\u3001\u6700\u9577 {longest} ms","diag.copy":"\u8A3A\u65AD\u60C5\u5831\u3092\u30B3\u30D4\u30FC","diag.copied":"\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F","diag.copy.failed":"\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u4E0B\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u9078\u629E\u3057\u3066\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002","kind.sidebar":"\u30B5\u30A4\u30C9\u30D0\u30FC","kind.composer":"\u5165\u529B\u6B04","kind.panel":"\u30D1\u30CD\u30EB","kind.menu":"\u30E1\u30CB\u30E5\u30FC","kind.smoke":"\u30C8\u30FC\u30B9\u30C8\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7","kind.code":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","kind.backdrop":"\u80CC\u666F","save.local":"\u3053\u306E\u63A5\u7D9A\u3067\u306F\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u5909\u66F4\u306F\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u307E\u3067\u6709\u52B9\u3067\u3059\u3002","save.error":"\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u5143\u306E\u5024\u306B\u623B\u3057\u307E\u3057\u305F\u3002","save.saving":"\u4FDD\u5B58\u4E2D\u2026",footer:"dsh-glassui {version}\u3002\u975E\u516C\u5F0F\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u3067\u3001DeepSeek \u3068\u306F\u95A2\u4FC2\u3042\u308A\u307E\u305B\u3093\u3002"},Et={title:"Glass UI",subtitle:"\u8BBE\u7F6E\u73BB\u7483\u6750\u8D28\u3001\u5899\u7EB8\u548C\u663E\u793A\u6548\u679C\u3002","status.on":"\u5DF2\u5F00\u542F","status.off":"\u5DF2\u5173\u95ED","status.forced":"\u9AD8\u5BF9\u6BD4\u5EA6\u6A21\u5F0F\u4E0B\u5DF2\u6682\u505C","status.surfaces":"{count} \u4E2A\u73BB\u7483\u754C\u9762","section.material":"\u6750\u8D28","enable.label":"\u73BB\u7483\u6750\u8D28","enable.hint":"\u5173\u95ED\u540E\u6062\u590D DSH \u539F\u672C\u7684\u5916\u89C2\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u901A\u900F","tint.tinted":"\u7740\u8272","section.wallpaper":"\u5899\u7EB8","wallpaper.auto":"\u81EA\u52A8","wallpaper.auto.hint":"\u6D4F\u89C8\u5668\u4E2D\u4F7F\u7528 Bay\uFF0CmacOS \u5E94\u7528\u4E2D\u4E0D\u4F7F\u7528\u5899\u7EB8\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52A8\u6001","wallpaper.live.hint":"\u7F13\u6162\u6D41\u52A8\u3002\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u4FDD\u6301\u9759\u6B62\uFF0C\u8017\u7535\u7565\u9AD8\u4E8E\u9759\u6001\u5899\u7EB8\u3002","wallpaper.none":"\u65E0","wallpaper.custom":"\u81EA\u5B9A\u4E49","wallpaper.url.label":"\u56FE\u7247\u5730\u5740","wallpaper.url.placeholder":"https://\u2026 \u6216 /\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84.jpg","wallpaper.url.invalid":"\u8BF7\u4F7F\u7528 http(s) \u5730\u5740\u3001\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84\u6216 base64 \u56FE\u7247\u6570\u636E\u5730\u5740\u3002","section.layout":"\u5E03\u5C40\u4E0E\u6548\u679C","sidebar.label":"\u4FA7\u680F","sidebar.floating":"\u60AC\u6D6E","sidebar.docked":"\u505C\u9760","code.label":"\u4EE3\u7801\u5757","code.hint":"\u73BB\u7483\u6548\u679C\u4F7F\u7528\u8F83\u6D53\u7684\u8272\u8C03\uFF0C\u4EE3\u7801\u4F9D\u7136\u6E05\u6670\u6613\u8BFB\u3002","code.glass":"\u73BB\u7483","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u6298\u5C04","refraction.hint":"\u73BB\u7483\u8FB9\u7F18\u5904\u7684\u80CC\u666F\u4F1A\u4EA7\u751F\u5F2F\u66F2\u3002","refraction.unavailable":"\u9700\u8981 Chrome\u3001Edge \u6216 DSH \u684C\u9762\u5E94\u7528\u7B49\u57FA\u4E8E Chromium \u7684\u6D4F\u89C8\u5668\u3002","highlights.label":"\u6307\u9488\u9AD8\u5149","highlights.hint":"\u67D4\u548C\u7684\u5149\u4F1A\u8DDF\u968F\u6307\u9488\u3002\u5728\u89E6\u6478\u5C4F\u4E0A\u4EE5\u53CA\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u5173\u95ED\u3002","section.compat":"\u517C\u5BB9\u6027","exclude.label":"\u4E0D\u5904\u7406\u7684\u5143\u7D20","exclude.hint":"\u4EE5\u9017\u53F7\u5206\u9694\u7684 CSS \u9009\u62E9\u5668\u3002\u5F53\u5176\u4ED6\u63D2\u4EF6\u5728\u73BB\u7483\u6548\u679C\u4E0B\u663E\u793A\u5F02\u5E38\u65F6\u4F7F\u7528\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u8BE5\u9009\u62E9\u5668\u65E0\u6548\uFF0C\u5DF2\u88AB\u5FFD\u7565\u3002","diag.title":"\u8BCA\u65AD\u4FE1\u606F","diag.surfaces":"\u73BB\u7483\u754C\u9762","diag.lenses":"\u6B63\u5728\u6298\u5C04","diag.tokens":"DSH \u4E3B\u9898\u4EE4\u724C","diag.tokens.ok":"\u5168\u90E8\u627E\u5230","diag.tokens.missing":"\u6B64\u7248\u672C DSH \u4E2D\u4E0D\u5B58\u5728\uFF1A{list}","diag.tokens.ambiguous":"\u65E0\u6CD5\u533A\u5206\uFF1A{list}","diag.scan":"\u626B\u63CF","diag.scan.value":"{batches} \u6B21\uFF0C\u6700\u957F {longest} \u6BEB\u79D2","diag.copy":"\u590D\u5236\u8BCA\u65AD\u4FE1\u606F","diag.copied":"\u5DF2\u590D\u5236","diag.copy.failed":"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u4E0B\u65B9\u6587\u672C\u8FDB\u884C\u590D\u5236\u3002","kind.sidebar":"\u4FA7\u680F","kind.composer":"\u8F93\u5165\u6846","kind.panel":"\u9762\u677F","kind.menu":"\u83DC\u5355","kind.smoke":"\u63D0\u793A\u4E0E\u5DE5\u5177\u63D0\u793A","kind.code":"\u4EE3\u7801\u5757","kind.backdrop":"\u80CC\u666F","save.local":"\u5F53\u524D\u8FDE\u63A5\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u66F4\u6539\u5C06\u5728\u9875\u9762\u91CD\u65B0\u52A0\u8F7D\u524D\u6709\u6548\u3002","save.error":"\u65E0\u6CD5\u4FDD\u5B58\u66F4\u6539\uFF0C\u5DF2\u6062\u590D\u539F\u6765\u7684\u503C\u3002","save.saving":"\u6B63\u5728\u4FDD\u5B58\u2026",footer:"dsh-glassui {version}\u3002\u975E\u5B98\u65B9\u63D2\u4EF6\uFF0C\u4E0E DeepSeek \u65E0\u5173\u3002"};var x=require("react");var o=require("react/jsx-runtime"),Os=1e3;function Fs(s){return(0,x.useSyncExternalStore)(s.subscribe,s.getSnapshot)}function Gs(s){return(0,x.useSyncExternalStore)(s.subscribe,s.revision),s.translate}function Ks(){let s=()=>document.body.hasAttribute("data-ds-dark-theme")?"dark":"light",[e,t]=(0,x.useState)(s);return(0,x.useEffect)(()=>{let a=new MutationObserver(()=>t(s()));return a.observe(document.body,{attributes:!0,attributeFilter:["data-ds-dark-theme"]}),()=>a.disconnect()},[]),e}function ie(s){return(0,o.jsxs)("div",{className:"glassui-row",children:[(0,o.jsxs)("div",{className:"glassui-row__text",children:[s.htmlFor?(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:s.htmlFor,children:s.label}):(0,o.jsx)("span",{className:"glassui-row__label",children:s.label}),s.hint?(0,o.jsx)("span",{className:"glassui-row__hint",children:s.hint}):null]}),(0,o.jsx)("div",{className:"glassui-row__control",children:s.children})]})}function Ue(s){return(0,o.jsx)("button",{type:"button",role:"switch",className:"glassui-switch","aria-checked":s.checked,"aria-label":s.label,disabled:s.disabled,onClick:()=>s.onChange(!s.checked)})}function At(s){let e=[...s.currentTarget.querySelectorAll('[role="radio"]')],t=e.findIndex(i=>i===s.target);if(t<0)return;let a;switch(s.key){case"ArrowRight":case"ArrowDown":a=(t+1)%e.length;break;case"ArrowLeft":case"ArrowUp":a=(t+e.length-1)%e.length;break;case"Home":a=0;break;case"End":a=e.length-1;break;default:return}s.preventDefault(),e[a]?.focus(),e[a]?.click()}function Tt(s){let e=Math.max(0,s.options.findIndex(t=>t.value===s.value));return(0,o.jsxs)("div",{className:"glassui-segmented",role:"radiogroup","aria-label":s.label,onKeyDown:At,style:{"--glassui-segments":s.options.length,"--glassui-index":e},children:[(0,o.jsx)("span",{className:"glassui-segmented__thumb","aria-hidden":"true"}),s.options.map(t=>(0,o.jsx)("button",{type:"button",role:"radio","aria-checked":t.value===s.value,tabIndex:t.value===s.value?0:-1,className:"glassui-segmented__option",onClick:()=>s.onChange(t.value),children:t.label},t.value))]})}function kt(s){let[e,t]=(0,x.useState)(s.value);(0,x.useEffect)(()=>t(s.value),[s.value]);let a=s.validate?e.trim()!==""&&!s.validate(e.trim()):!1,i=()=>{let r=e.trim();r===s.value||a||s.onCommit(r)};return(0,o.jsxs)("div",{className:"glassui-field",children:[(0,o.jsx)("input",{id:s.id,className:"glassui-input",value:e,placeholder:s.placeholder,spellCheck:!1,autoComplete:"off","aria-invalid":s.invalid||a,onChange:r=>t(r.target.value),onBlur:i,onKeyDown:r=>{r.key==="Enter"&&i()}}),s.invalid||a?(0,o.jsx)("span",{className:"glassui-field__error",role:"alert",children:s.message}):null]})}function He(s){if(s==="auto")return"bay";if(!(s==="none"||s==="custom"))return s}function Ws(s){let{t:e}=s;return(0,o.jsx)("div",{className:"glassui-wallpapers",role:"radiogroup","aria-label":e("section.wallpaper"),onKeyDown:At,children:_e.map(t=>{let a=He(t),i=a?se(a,s.scheme):void 0,r=t!=="auto"&&a!==void 0&&le(a),n=e(`wallpaper.${t}`);return(0,o.jsxs)("button",{type:"button",role:"radio","aria-checked":s.value===t,tabIndex:s.value===t?0:-1,"aria-label":r?`${n}, ${e("wallpaper.live")}`:n,className:"glassui-wallpaper","data-choice":t,onClick:()=>s.onChange(t),children:[(0,o.jsxs)("span",{className:"glassui-wallpaper__swatch","aria-hidden":"true",style:i?{backgroundImage:i}:void 0,children:[t==="auto"?(0,o.jsx)("span",{className:"glassui-wallpaper__badge",children:"A"}):null,r?(0,o.jsx)("span",{className:"glassui-wallpaper__badge","data-kind":"live",children:e("wallpaper.live")}):null]}),(0,o.jsx)("span",{className:"glassui-wallpaper__name",children:n})]},t)})})}function Bs(s){let{state:e,t}=s,{diagnostics:a}=e,[i,r]=(0,x.useState)("idle"),n=JSON.stringify({version:s.version,settings:{...e.settings,wallpaperUrl:e.settings.wallpaperUrl?"[configured]":""},diagnostics:a,userAgent:navigator.userAgent},null,2),l=oe.filter(d=>a.surfaces[d]>0).map(d=>`${t(`kind.${d}`)} ${a.surfaces[d]}`).join(" \xB7 "),c=a.missingTokens.length===0&&a.ambiguousTokens.length===0?t("diag.tokens.ok"):[a.missingTokens.length>0?t("diag.tokens.missing",{list:a.missingTokens.join(", ")}):"",a.ambiguousTokens.length>0?t("diag.tokens.ambiguous",{list:a.ambiguousTokens.join(", ")}):""].filter(Boolean).join(" "),u=async()=>{try{await navigator.clipboard.writeText(n),r("done")}catch{r("failed")}};return(0,o.jsxs)("div",{className:"glassui-diagnostics",children:[(0,o.jsxs)("dl",{className:"glassui-facts",children:[(0,o.jsx)("dt",{children:t("diag.surfaces")}),(0,o.jsx)("dd",{children:l||"\u2014"}),(0,o.jsx)("dt",{children:t("diag.lenses")}),(0,o.jsx)("dd",{children:a.lenses}),(0,o.jsx)("dt",{children:t("diag.tokens")}),(0,o.jsx)("dd",{children:c}),(0,o.jsx)("dt",{children:t("diag.scan")}),(0,o.jsx)("dd",{children:t("diag.scan.value",{batches:a.scans.batches,longest:a.scans.longestMs.toFixed(1)})})]}),(0,o.jsx)("div",{className:"glassui-actions",children:(0,o.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{u()},children:t(i==="done"?"diag.copied":"diag.copy")})}),i==="failed"?(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("p",{className:"glassui-note",children:t("diag.copy.failed")}),(0,o.jsx)("textarea",{className:"glassui-report",readOnly:!0,value:n,"aria-label":t("diag.title")})]}):null]})}function Rt(s){let e=Fs(s.controller),t=Gs(s.locale),a=Ks(),i=(0,x.useId)(),{settings:r,diagnostics:n}=e,l=(d,g)=>s.controller.update(d,g);(0,x.useEffect)(()=>{let d=setInterval(()=>s.controller.refreshDiagnostics(),Os);return()=>clearInterval(d)},[s.controller]);let c=oe.filter(d=>d!=="backdrop").reduce((d,g)=>d+n.surfaces[g],0),u=n.running?`${t("status.on")} \xB7 ${t("status.surfaces",{count:c})}`:n.idle==="forced-colors"?t("status.forced"):t("status.off");return(0,o.jsxs)("div",{className:"glassui-page","data-testid":"glassui-settings",children:[(0,o.jsxs)("header",{className:"glassui-hero",children:[(0,o.jsx)("div",{className:"glassui-hero__art","aria-hidden":"true",style:{backgroundImage:se(He(r.wallpaper)??"bay",a)},children:(0,o.jsx)("span",{className:"glassui-hero__pane"})}),(0,o.jsxs)("div",{className:"glassui-hero__text",children:[(0,o.jsx)("h2",{className:"glassui-hero__title",children:t("title")}),(0,o.jsx)("p",{className:"glassui-hero__subtitle",children:t("subtitle")}),(0,o.jsx)("span",{className:"glassui-status","data-on":n.running,children:u})]})]}),e.save==="local"||e.save==="error"?(0,o.jsx)("p",{className:"glassui-banner",role:"status",children:t(e.save==="local"?"save.local":"save.error")}):null,(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${i}-material`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${i}-material`,children:t("section.material")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(ie,{label:t("enable.label"),hint:t("enable.hint"),children:(0,o.jsx)(Ue,{checked:r.enabled,label:t("enable.label"),onChange:d=>l("enabled",d)})}),(0,o.jsxs)("div",{className:"glassui-slider",children:[(0,o.jsxs)("div",{className:"glassui-slider__head",children:[(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:`${i}-tint`,children:t("tint.label")}),(0,o.jsx)("span",{className:"glassui-slider__value",children:r.tint})]}),(0,o.jsx)("input",{id:`${i}-tint`,type:"range",min:0,max:100,step:1,value:r.tint,className:"glassui-range",style:{"--glassui-progress":`${r.tint}%`},onChange:d=>l("tint",Number(d.target.value))}),(0,o.jsxs)("div",{className:"glassui-slider__ends","aria-hidden":"true",children:[(0,o.jsx)("span",{children:t("tint.clear")}),(0,o.jsx)("span",{children:t("tint.tinted")})]})]})]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${i}-wallpaper`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${i}-wallpaper`,children:t("section.wallpaper")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(Ws,{value:r.wallpaper,scheme:a,t,onChange:d=>l("wallpaper",d)}),r.wallpaper==="auto"?(0,o.jsx)("p",{className:"glassui-note",children:t("wallpaper.auto.hint")}):null,r.wallpaper!=="auto"&&le(He(r.wallpaper)??"bay")?(0,o.jsx)("p",{className:"glassui-note",children:t("wallpaper.live.hint")}):null,r.wallpaper==="custom"?(0,o.jsx)(ie,{label:t("wallpaper.url.label"),htmlFor:`${i}-url`,children:(0,o.jsx)(kt,{id:`${i}-url`,value:r.wallpaperUrl,placeholder:t("wallpaper.url.placeholder"),invalid:r.wallpaperUrl!==""&&!re(r.wallpaperUrl),message:t("wallpaper.url.invalid"),validate:re,onCommit:d=>l("wallpaperUrl",d)})}):null]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${i}-layout`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${i}-layout`,children:t("section.layout")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(ie,{label:t("sidebar.label"),children:(0,o.jsx)(Tt,{label:t("sidebar.label"),value:r.sidebar,options:[{value:"floating",label:t("sidebar.floating")},{value:"docked",label:t("sidebar.docked")}],onChange:d=>l("sidebar",d)})}),(0,o.jsx)(ie,{label:t("code.label"),hint:t("code.hint"),children:(0,o.jsx)(Tt,{label:t("code.label"),value:r.codeBlocks,options:[{value:"glass",label:t("code.glass")},{value:"solid",label:t("code.solid")}],onChange:d=>l("codeBlocks",d)})}),(0,o.jsx)(ie,{label:t("refraction.label"),hint:s.refractionSupported?t("refraction.hint"):t("refraction.unavailable"),children:(0,o.jsx)(Ue,{checked:r.refraction&&s.refractionSupported,label:t("refraction.label"),disabled:!s.refractionSupported,onChange:d=>l("refraction",d)})}),(0,o.jsx)(ie,{label:t("highlights.label"),hint:t("highlights.hint"),children:(0,o.jsx)(Ue,{checked:r.highlights,label:t("highlights.label"),onChange:d=>l("highlights",d)})})]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${i}-compat`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${i}-compat`,children:t("section.compat")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsxs)("div",{className:"glassui-stack",children:[(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:`${i}-exclude`,children:t("exclude.label")}),(0,o.jsx)("span",{className:"glassui-row__hint",children:t("exclude.hint")}),(0,o.jsx)(kt,{id:`${i}-exclude`,value:r.exclude,placeholder:t("exclude.placeholder"),invalid:n.invalidExclude,message:t("exclude.invalid"),onCommit:d=>l("exclude",d)})]}),(0,o.jsxs)("div",{className:"glassui-stack",children:[(0,o.jsx)("span",{className:"glassui-row__label",children:t("diag.title")}),(0,o.jsx)(Bs,{state:e,t,version:s.version})]})]})]}),(0,o.jsx)("footer",{className:"glassui-footer",children:e.save==="saving"?t("save.saving"):t("footer",{version:s.version})})]})}var _t=`/* Settings page of dsh-glassui. Every color comes from DSH's theme tokens, so the
   page follows DSH's light and dark palettes and any theme another plugin applies. */

.glassui-page {
  container: glassui-settings / inline-size;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
  padding: 4px 0 32px;
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}

.glassui-hero {
  display: flex;
  align-items: center;
  gap: 20px;
}

.glassui-hero__art {
  position: relative;
  flex: none;
  width: 132px;
  height: 88px;
  border-radius: var(--dsw-radius-lg, 16px);
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 0 0.5px var(--dsw-alias-border-l2);
  overflow: hidden;
}

.glassui-hero__pane {
  position: absolute;
  inset: 18px 20px;
  border-radius: 12px;
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.35), rgb(255 255 255 / 0.1));
  -webkit-backdrop-filter: blur(6px) saturate(170%);
  backdrop-filter: blur(6px) saturate(170%);
  box-shadow:
    inset 1px 1.5px 0 -0.5px rgb(255 255 255 / 0.9),
    inset -1px -1px 0 -0.5px rgb(255 255 255 / 0.4),
    0 6px 16px -6px rgb(0 0 0 / 0.25);
}

.glassui-hero__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.glassui-hero__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.glassui-hero__subtitle {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}

.glassui-status {
  margin-top: 4px;
  padding: 1px 10px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 20px;
}

.glassui-status[data-on='true'] {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);
  color: var(--dsw-alias-label-primary);
}

.glassui-banner {
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--dsw-radius-md, 12px);
  background: var(--dsw-alias-state-warn-tertiary);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
}

.glassui-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.glassui-section__title {
  margin: 0 4px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}

.glassui-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--dsw-radius-xl, 20px);
  background: var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2));
  box-shadow: inset 0 0 0 0.5px var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4));
}

.glassui-card > * + * {
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}

.glassui-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 56px;
  padding: 10px 16px;
}

.glassui-row__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.glassui-row__label {
  font-weight: 500;
}

.glassui-row__hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

.glassui-row__control {
  display: flex;
  flex: none;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.glassui-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px 14px;
}

.glassui-note {
  margin: 0;
  padding: 0 16px 12px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

.glassui-card > .glassui-note {
  border-top: 0;
}

/* Switch: the geometry and tokens of DSH's own switch (ui-primitives Switch). */
.glassui-switch {
  position: relative;
  width: 36px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--dsw-alias-border-l3);
  cursor: pointer;
  transition: background-color var(--ds-transition-duration, 0.2s) var(--ds-ease-in-out, ease);
  corner-shape: round;
}

.glassui-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dsw-alias-switch-thumb);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  transition: transform var(--ds-transition-duration, 0.2s) var(--ds-ease-in-out, ease);
  corner-shape: round;
}

.glassui-switch[aria-checked='true'] {
  background: var(--dsw-alias-brand-primary);
}

.glassui-switch[aria-checked='true']::after {
  background: var(--dsw-alias-label-primary-foreground);
  transform: translateX(16px);
}

.glassui-switch:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.glassui-switch:focus-visible,
.glassui-segmented__option:focus-visible,
.glassui-wallpaper:focus-visible,
.glassui-button:focus-visible,
.glassui-range:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-link));
  outline-offset: 2px;
}

/* Slider */
.glassui-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px 14px;
}

.glassui-slider__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.glassui-slider__value {
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.glassui-slider__ends {
  display: flex;
  justify-content: space-between;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 16px;
}

.glassui-range {
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.glassui-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--dsw-alias-brand-primary) var(--glassui-progress, 50%),
    var(--dsw-alias-border-l3) var(--glassui-progress, 50%)
  );
}

.glassui-range::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: var(--dsw-alias-border-l3);
}

.glassui-range::-moz-range-progress {
  height: 4px;
  border-radius: 999px;
  background: var(--dsw-alias-brand-primary);
}

.glassui-range::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
  margin-top: -9px;
  border-radius: 50%;
  background: var(--dsw-static-neutral-00, #fff);
  box-shadow:
    0 0 0 0.5px rgb(0 0 0 / 0.12),
    0 2px 6px rgb(0 0 0 / 0.2);
  -webkit-appearance: none;
  appearance: none;
}

.glassui-range::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: var(--dsw-static-neutral-00, #fff);
  box-shadow:
    0 0 0 0.5px rgb(0 0 0 / 0.12),
    0 2px 6px rgb(0 0 0 / 0.2);
}

/* Segmented control */
.glassui-segmented {
  min-width: 0;
  max-width: 100%;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--glassui-segments), minmax(0, 1fr));
  padding: 2px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-module-platform);
  corner-shape: round;
}

.glassui-segmented__thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / var(--glassui-segments));
  border-radius: 999px;
  background: var(--dsw-alias-button-elevated-fill);
  box-shadow:
    0 0 0 0.5px var(--dsw-alias-border-l2),
    0 1px 3px rgb(0 0 0 / 0.1);
  transform: translateX(calc(var(--glassui-index) * 100%));
  transition: transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1);
  corner-shape: round;
}

.glassui-segmented__option {
  position: relative;
  min-width: 0;
  min-height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  overflow-wrap: anywhere;
  corner-shape: round;
}

.glassui-segmented__option[aria-checked='true'] {
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

/* Wallpaper picker */
.glassui-wallpapers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(84px, 100%), 1fr));
  gap: 12px;
  padding: 14px 16px;
}

.glassui-wallpaper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
}

.glassui-wallpaper__swatch {
  position: relative;
  width: 100%;
  aspect-ratio: 8 / 5;
  border-radius: var(--dsw-radius-md, 12px);
  background-color: var(--dsw-alias-bg-module-platform);
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 0.5px var(--dsw-alias-border-l3);
}

.glassui-wallpaper[data-choice='none'] .glassui-wallpaper__swatch {
  background-image: linear-gradient(
    135deg,
    transparent calc(50% - 0.5px),
    var(--dsw-alias-border-l4) 50%,
    transparent calc(50% + 0.5px)
  );
}

.glassui-wallpaper[data-choice='custom'] .glassui-wallpaper__swatch {
  background-image: repeating-linear-gradient(
    45deg,
    var(--dsw-alias-bg-module-platform) 0 6px,
    var(--dsw-alias-bg-layer-2) 6px 12px
  );
}

.glassui-wallpaper__badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  min-width: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.85);
  color: rgb(0 0 0 / 0.75);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
}

.glassui-wallpaper__badge[data-kind='live'] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
}

.glassui-wallpaper__badge[data-kind='live']::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34c759;
}

.glassui-wallpaper[aria-checked='true'] {
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.glassui-wallpaper[aria-checked='true'] .glassui-wallpaper__swatch {
  box-shadow:
    0 0 0 2px var(--dsw-alias-bg-layer-2),
    0 0 0 4px var(--dsw-alias-brand-primary);
}

/* Text fields */
.glassui-field {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.glassui-row:has(.glassui-field) .glassui-row__control {
  flex: 1;
}

.glassui-input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-sm, 8px);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12.5px;
}

.glassui-input:focus {
  outline: none;
  border-color: var(--dsw-alias-link);
}

.glassui-input[aria-invalid='true'] {
  border-color: var(--dsw-alias-state-error-primary);
}

.glassui-field__error {
  overflow-wrap: anywhere;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}

/* Diagnostics */
.glassui-diagnostics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.glassui-facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 16px;
  margin: 0;
  font-size: 13px;
  line-height: 20px;
}

.glassui-facts dt {
  color: var(--dsw-alias-label-tertiary);
}

.glassui-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.glassui-actions {
  display: flex;
  gap: 8px;
}

.glassui-button {
  height: 30px;
  padding: 0 14px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  corner-shape: round;
}

.glassui-button:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.glassui-report {
  box-sizing: border-box;
  width: 100%;
  height: 160px;
  padding: 8px 10px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-sm, 8px);
  background: var(--dsw-alias-markdown-code-block);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--ds-font-family-code, monospace);
  font-size: 11.5px;
  resize: vertical;
}

.glassui-footer {
  margin: 0 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

@container glassui-settings (max-width: 420px) {
  .glassui-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .glassui-row {
    flex-wrap: wrap;
  }

  .glassui-row__text {
    flex-basis: 100%;
  }

  .glassui-facts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glassui-switch,
  .glassui-switch::after,
  .glassui-segmented__thumb {
    transition: none;
  }
}
`;var $t=require("react/jsx-runtime"),Hs=Re,zs=[],Ee="__DSH_GLASSUI_DEBUG__",Vs=880;function js(){let s=globalThis[Ye];return typeof s=="object"&&s!==null&&"settings"in s?F(s.settings):{...j}}function Ys(){let s=document.createElement("style");return s.setAttribute("data-glassui-settings-style",""),s.textContent=_t,document.head.append(s),()=>s.remove()}function qs(s){if(typeof document>"u")return;let e=wt(window),t="0.1.0",a={},i=new Se(window,e,()=>a.controller?.refreshDiagnostics()),r=new ue(i,js());a.controller=r,s.effect(()=>{let n={version:t,settings:()=>r.getSnapshot().settings,diagnostics:()=>i.diagnostics()};return globalThis[Ee]=n,()=>{r.dispose(),i.dispose(),globalThis[Ee]===n&&Reflect.deleteProperty(globalThis,Ee)}},"dsh-glassui: engine"),s.inject(["configForms"],n=>{n.effect(()=>r.attach(n.configForms.get(Re)),"dsh-glassui: settings sync")}),s.inject(["slots","locale"],n=>{n.effect(()=>n.locale.register(Be,{en:xt,ja:St,zh:Et}),"dsh-glassui: copy"),n.effect(Ys,"dsh-glassui: settings styles");let l=n.locale.bind(Be),c=(d,g)=>l(d,g),u={subscribe:d=>n.locale.subscribe(d),revision:()=>n.locale.getSnapshot().revision,translate:c};n.slots.inject("settings.section",()=>n.slots.register({name:"settings.section",id:"glassui",order:Vs,label:()=>c("title")},()=>(0,$t.jsx)(Rt,{controller:r,locale:u,version:t,refractionSupported:e.refraction})))})}

return module.exports;}});
