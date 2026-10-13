/*! dsh-glassui 0.1.2 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */
window.__ModuleLoader__.load({id:"dsh-glassui",factory(require){const module={exports:{}};const exports=module.exports;
"use strict";var _e=Object.defineProperty;var Mt=Object.getOwnPropertyDescriptor;var Dt=Object.getOwnPropertyNames;var It=Object.prototype.hasOwnProperty;var Ot=(s,e)=>{for(var t in e)_e(s,t,{get:e[t],enumerable:!0})},Pt=(s,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of Dt(e))!It.call(s,a)&&a!==t&&_e(s,a,{get:()=>e[a],enumerable:!(i=Mt(e,a))||i.enumerable});return s};var Ft=s=>Pt(_e({},"__esModule",{value:!0}),s);var ei={};Ot(ei,{DEBUG_GLOBAL:()=>Re,apply:()=>Zs,inject:()=>qs,name:()=>Ys});module.exports=Ft(ei);var Ne="dsh-glassui",Je="__DSH_GLASSUI__",Gt=["bay","sunrise","meadow","graphite","lagoon","dusk","dune","tide","aurora","bloom","prism"],Ce=["auto",...Gt,"none","custom"],Kt=["floating","docked"],Wt=["glass","solid"],J=Object.freeze({enabled:!0,tint:35,wallpaper:"auto",wallpaperUrl:"",sidebar:"floating",codeBlocks:"glass",refraction:!0,highlights:!0,exclude:""}),Qe=2048,Ut=1e3,Bt=/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;function le(s){if(s.length===0||s.length>Qe||/["'()\\\s<>]/.test(s))return!1;if(Bt.test(s)||s.startsWith("/")&&!s.startsWith("//")||s.startsWith("./")||s.startsWith("../"))return!0;try{let e=new URL(s);return e.protocol==="https:"||e.protocol==="http:"}catch{return!1}}function $e(s,e,t){return typeof e=="string"&&s.includes(e)?e:t}function Le(s,e){return typeof s=="boolean"?s:e}function Xe(s,e,t){return typeof s=="string"&&s.length<=e?s.trim():t}function W(s){let e=typeof s=="object"&&s!==null?s:{},t=J,i=typeof e.tint=="number"&&Number.isFinite(e.tint)?Math.min(100,Math.max(0,Math.round(e.tint))):t.tint;return{enabled:Le(e.enabled,t.enabled),tint:i,wallpaper:$e(Ce,e.wallpaper,t.wallpaper),wallpaperUrl:Xe(e.wallpaperUrl,Qe,t.wallpaperUrl),sidebar:$e(Kt,e.sidebar,t.sidebar),codeBlocks:$e(Wt,e.codeBlocks,t.codeBlocks),refraction:Le(e.refraction,t.refraction),highlights:Le(e.highlights,t.highlights),exclude:Xe(e.exclude,Ut,t.exclude)}}function Ze(s,e){return Object.keys(J).every(t=>s[t]===e[t])}var Ht=300,he=class{engine;stored;pending=new Map;timers=new Map;form;detachForm;writing=!1;failed=!1;disposed=!1;save="loading";state;listeners=new Set;constructor(e,t={...J}){this.engine=e,this.stored=t,this.state={settings:t,save:this.save,diagnostics:e.diagnostics()},e.apply(t)}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));attach(e){if(this.disposed)return()=>{};this.detachForm?.(),this.form=e;let t=()=>{if(this.disposed||this.form!==e)return;let r=e.getSnapshot();r.status==="ready"&&(this.stored=W(r.value)),this.recompute(),this.flush()},i=e.subscribe(t);t();let a=()=>{i(),this.form===e&&(this.form=void 0,this.detachForm=void 0,this.save="local",this.recompute())};return this.detachForm=a,a}update(e,t){if(this.disposed)return;let i=W({...this.state.settings,[e]:t});this.pending.set(e,{value:i[e]}),this.failed=!1;let a=this.timers.get(e);a!==void 0&&clearTimeout(a),this.timers.set(e,setTimeout(()=>{this.timers.delete(e),this.flush()},Ht)),this.recompute()}refreshDiagnostics(){this.disposed||(this.state={...this.state,diagnostics:this.engine.diagnostics()},this.emit())}async flush(){if(!(this.writing||this.disposed)){this.writing=!0;try{for(;this.isActive();){let e=this.form,t=e?.getSnapshot();if(!e||t?.status!=="ready"||!t.writable)break;let i=[...this.pending].find(([c])=>!this.timers.has(c));if(!i)break;let[a,r]=i,n=!1;this.recompute();try{n=await e.set(a,r.value)}catch(c){this.isActive()&&console.warn("dsh-glassui: saving a setting failed",c)}if(!this.isActive())return;if(this.form!==e||this.pending.get(a)!==r)continue;this.pending.delete(a),this.failed||=!n;let o=e.getSnapshot();o.status==="ready"&&(this.stored=W(o.value))}}finally{this.writing=!1,this.recompute()}}}isActive(){return!this.disposed}recompute(){if(this.disposed)return;let e=this.form?.getSnapshot();e?e.status==="loading"?this.save="loading":e.status==="unavailable"||!e.writable?this.save="local":this.pending.size>0||this.writing?this.save="saving":this.save=this.failed?"error":"saved":this.pending.size>0&&(this.save="local");let t=W({...this.stored,...Object.fromEntries([...this.pending].map(([a,r])=>[a,r.value]))}),i=!Ze(t,this.state.settings);i&&this.engine.apply(t),!(!i&&this.save===this.state.save)&&(this.state={settings:t,save:this.save,diagnostics:this.engine.diagnostics()},this.emit())}emit(){for(let e of this.listeners)e()}dispose(){this.disposed=!0,this.detachForm?.(),this.form=void 0;for(let e of this.timers.values())clearTimeout(e);this.timers.clear(),this.pending.clear(),this.listeners.clear()}};var k=String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`,zt=new RegExp(String.raw`^rgba?\(\s*(${k})\s*,\s*(${k})\s*,\s*(${k})\s*(?:,\s*(${k})(%?)\s*)?\)$`,"i"),Vt=new RegExp(String.raw`^rgba?\(\s*(${k})\s+(${k})\s+(${k})\s*(?:/\s*(${k})(%?)\s*)?\)$`,"i"),jt=new RegExp(String.raw`^color\(\s*srgb\s+(${k})\s+(${k})\s+(${k})\s*(?:/\s*(${k})(%?)\s*)?\)$`,"i");function Q(s){return Math.min(255,Math.max(0,Math.round(s)))}function et(s,e){if(s===void 0)return 1;let t=Number(s)/(e==="%"?100:1);return Math.min(1,Math.max(0,t))}function Me(s){let e=s.trim(),t=zt.exec(e)??Vt.exec(e);if(t)return{r:Q(Number(t[1])),g:Q(Number(t[2])),b:Q(Number(t[3])),a:et(t[4],t[5])};let i=jt.exec(e);if(i)return{r:Q(Number(i[1])*255),g:Q(Number(i[2])*255),b:Q(Number(i[3])*255),a:et(i[4],i[5])}}function tt(s){let e=Math.round(s.a*1e3)/1e3;return e>=1?`rgb(${s.r} ${s.g} ${s.b})`:`rgb(${s.r} ${s.g} ${s.b} / ${e})`}function fe(s){return`${s.r},${s.g},${s.b},${Math.round(s.a*1e3)}`}var Yt=[1,-1,2,-2,3,-3],qt=["b","g","r"];function st(s,e){let t=new Set(e.map(fe));for(let[,a]of s)a&&t.add(fe(a));let i=new Map;for(let[a,r]of s){if(!r)continue;let n;e:for(let o of qt)for(let c of Yt){let u=r[o]+c;if(u<0||u>255)continue;let d={...r,[o]:u};if(!t.has(fe(d))){n=d;break e}}n&&(t.add(fe(n)),i.set(a,n))}return i}var L="data-glassui",U="data-glassui-sidebar",P="data-glassui-wallpaper",Z="data-glassui-highlights",ee="data-glassui-raw",g="data-glassui-surface",N="data-glassui-fill",m="data-glassui-flat",_="data-glassui-echo",D="data-glassui-paint",te="data-glassui-float",F="data-glassui-lens",B="data-glassui-ignore",$="data-glassui-excluded",C="data-glassui-material";var b="data-glassui-owned",H="--glassui-t",z="--glassui-wallpaper",se="--glassui-lx",ie="--glassui-ly",de=["sidebar","composer","panel","menu","smoke","code","backdrop"],it=[L,U,P,Z,ee,g,N,m,_,D,te,F,$,b].map(s=>`[${s}]`).join(",");var v={input:"--dsw-specific-input-major",sidebar:"--dsw-specific-sidebar-fill",toast:"--dsw-alias-toast-bg",tooltip:"--dsw-alias-tooltip-bg",layer1:"--dsw-alias-bg-layer-1",layer2:"--dsw-alias-bg-layer-2",layer3:"--dsw-alias-bg-layer-3",floating:"--dsw-alias-button-floating-fill",elevated:"--dsw-alias-button-elevated-fill",overlay:"--dsw-alias-bg-overlay",base:"--dsw-alias-bg-base",code:"--dsw-alias-markdown-code-block",codeBanner:"--dsw-alias-markdown-code-block-banner"},M=Object.keys(v),at=new Set(["code","codeBanner"]),ce=["--dsw-alias-markdown-inline-code","--dsw-alias-markdown-citation","--dsw-alias-markdown-tag","--dsw-alias-markdown-placeholder","--dsw-specific-bubble","--dsw-specific-selector","--dsw-specific-tip","--dsw-specific-login-input","--dsw-specific-sidebar-nav-item-active","--dsw-specific-sidebar-nav-item-hover","--dsw-alias-bg-module-platform","--dsw-alias-bg-multi-select","--dsw-alias-bg-document-preview","--dsw-alias-interactive-bg-hover-solid","--dsw-alias-button-primary-dimmed"],ae={panel:"--dsw-elevation-panel",prominent:"--dsw-elevation-prominent",soft:"--dsw-elevation-soft"},De="--dsw-elevation-stroke",V={panel:"rgb(1 0 61 / 0)",prominent:"rgb(1 0 62 / 0)",soft:"rgb(1 0 63 / 0)"},E={fill:"--dsw-menu-surface-fill",filter:"--dsw-menu-backdrop-filter",overlayFill:"--dsw-specific-menu",groupHeader:"--dsw-alias-menu-group-header-fill"},G="data-ds-dark-theme",Ie="data-platform",Oe="data-markdown-variant",oi=[...Object.values(v),...ce,...Object.values(ae),De,...Object.values(E)];var Xt={bay:{light:{bg:["#b9d4ff","#eef4ff"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,40,120,0.16)",ribbons:[["#9cc6ff","#cfe6ff"],["#5f9df7","#97ccff"],["#4cc0e8","#3d8ff2"],["#2f72e8","#6aaeff"],["#1d4fc4","#4b8cf0"]]},dark:{bg:["#040a1e","#0b1838"],glow:"rgba(80,140,255,0.35)",crest:"rgba(170,210,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#183a8c","#2c63c6"],["#1d55b8","#3a8ae0"],["#0f7fa6","#2266c8"],["#2a3fb0","#4b78e0"],["#101f66","#2647a8"]]}},sunrise:{light:{bg:["#ffd9bf","#fff1e8"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(120,30,60,0.14)",ribbons:[["#ffc49a","#ffe0c2"],["#ff9a8c","#ffc49a"],["#f084b8","#ff9e94"],["#b58cf0","#ef8cc4"],["#7e6ee6","#b48cf0"]]},dark:{bg:["#16070c","#24101e"],glow:"rgba(255,120,90,0.3)",crest:"rgba(255,200,170,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#8a3a1e","#c26434"],["#962c44","#c4563a"],["#82306e","#b0425a"],["#55348e","#8a3a7c"],["#2c2470","#5a3490"]]}},meadow:{light:{bg:["#d2f0dc","#f1faf3"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,80,50,0.14)",ribbons:[["#bfeac8","#e0f6e2"],["#86d8a6","#bdebc8"],["#4fc4a6","#86d89a"],["#2fa59a","#5ccaa0"],["#1f7f86","#3aa894"]]},dark:{bg:["#03120e","#08201a"],glow:"rgba(80,220,160,0.25)",crest:"rgba(170,255,210,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#185c3c","#2a8a56"],["#11704e","#2a9a66"],["#0c6a64","#1a8a6e"],["#0e5260","#127068"],["#08343e","#0e5056"]]}},graphite:{light:{bg:["#dcdfe5","#f4f5f7"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(0,0,0,0.12)",ribbons:[["#d2d6dd","#e8eaee"],["#b6bbc5","#d4d8de"],["#9aa0ac","#bcc1c9"],["#7e8492","#a2a8b2"],["#626876","#868c98"]]},dark:{bg:["#0c0d0f","#1a1b1f"],glow:"rgba(255,255,255,0.12)",crest:"rgba(255,255,255,0.22)",shade:"rgba(0,0,0,0.5)",ribbons:[["#3a3d44","#4e525a"],["#2e3138","#43474f"],["#25282e","#373a42"],["#1d1f24","#2c2f35"],["#141519","#22242a"]]}},lagoon:{light:{bg:["#bdeff0","#effbfb"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(0,90,100,0.15)",ribbons:[["#a6eae6","#d4f6f2"],["#62d6d2","#9fe9e2"],["#2fc0c8","#5fd8cf"],["#1a9fb6","#3cc2c4"],["#0d7a98","#1fa2b2"]]},dark:{bg:["#021317","#06252b"],glow:"rgba(60,220,220,0.25)",crest:"rgba(160,255,250,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0d5a5e","#178a86"],["#0b6e72","#16a0a0"],["#08707e","#0f8e96"],["#075866","#0b7682"],["#043a46","#08525e"]]}},dusk:{light:{bg:["#e4d7ff","#fbf1ff"],glow:"rgba(255,255,255,0.7)",crest:"rgba(255,255,255,0.7)",shade:"rgba(70,20,110,0.15)",ribbons:[["#d9c4ff","#f0e2ff"],["#b79cff","#dcc0ff"],["#e39cdc","#c3a0ff"],["#f08cb4","#d896e8"],["#8a6cf0","#cf86d8"]]},dark:{bg:["#0c0718","#1a0f2e"],glow:"rgba(190,120,255,0.28)",crest:"rgba(230,190,255,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#3a2a7a","#5a3c9c"],["#4c2a86","#7a3a96"],["#6a2c80","#9a3c78"],["#3c2470","#6a2e86"],["#1e1650","#3c2070"]]}},dune:{light:{bg:["#f6e6cf","#fdf7ee"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(110,60,10,0.14)",ribbons:[["#f2dcb8","#faecd6"],["#e9c590","#f4dbb2"],["#dea872","#ecc48e"],["#cf8c5c","#e2a876"],["#b46e48","#cf8c60"]]},dark:{bg:["#120c06","#22170c"],glow:"rgba(255,180,100,0.22)",crest:"rgba(255,220,170,0.26)",shade:"rgba(0,0,0,0.5)",ribbons:[["#5a3e22","#7a5630"],["#6a4426","#8c5c32"],["#74462a","#966036"],["#5e3622","#7c4a2c"],["#3a2216","#58321e"]]}},tide:{light:{bg:["#c6e2ff","#f2f8ff"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(10,50,130,0.16)",ribbons:[["#9ee6ff","#d0f4ff"],["#5fcff5","#9ee6ff"],["#3aa8f0","#5fd0f0"],["#2f7ce6","#4fb0f2"],["#2552c8","#3c88e8"]]},dark:{bg:["#020b1a","#071a33"],glow:"rgba(60,170,255,0.32)",crest:"rgba(150,220,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0f4a7a","#1d74a8"],["#0e5f8e","#1f8ac0"],["#0b6f9a","#1a5fb0"],["#173c94","#2c66c8"],["#0b1f5a","#183c94"]]}}},Jt=[[.14,.2,760],[.76,.16,820],[.5,.86,860],[.94,.7,640],[.26,.92,600]],rt=[[.5,.08,720],[.08,.58,700],[.92,.5,700],[.32,.98,620],[.72,.96,640]],Qt={prism:{light:{geometry:rt,bg:["#f6f3ff","#fdf8fb"],glow:"rgba(255,255,255,0.6)",blobs:[["#ff9ad5",.8],["#8fd3ff",.85],["#ffe27a",.7],["#a6f0c6",.75],["#c3a2ff",.75]]},dark:{geometry:rt,bg:["#07061a","#0d0a22"],glow:"rgba(160,120,255,0.16)",blobs:[["#ff3fa4",.55],["#2d9cff",.6],["#ffb800",.35],["#20d38a",.5],["#8b5cff",.55]]}},aurora:{light:{bg:["#e6efff","#f6f1ff"],glow:"rgba(255,255,255,0.55)",blobs:[["#5ec8ff",.9],["#a98bff",.8],["#4fe0b8",.75],["#7aa6ff",.8],["#ffb3dc",.6]]},dark:{bg:["#03061a","#080b26"],glow:"rgba(80,120,255,0.18)",blobs:[["#14c995",.7],["#2f55ff",.75],["#7d3cff",.65],["#00a6cc",.6],["#ff3d93",.38]]}},bloom:{light:{bg:["#fff0e6","#fff8f2"],glow:"rgba(255,255,255,0.55)",blobs:[["#ff9a6b",.85],["#ff86ba",.75],["#ffc94d",.7],["#b893ff",.65],["#ff7676",.5]]},dark:{bg:["#10060d","#1b0a16"],glow:"rgba(255,120,90,0.16)",blobs:[["#ff5a2a",.6],["#e0307f",.65],["#ffa600",.38],["#6f3cff",.6],["#ff3a3a",.38]]}}},Pe={bay:{style:"ribbons"},sunrise:{style:"ribbons"},meadow:{style:"ribbons"},graphite:{style:"ribbons"},lagoon:{style:"ribbons"},dusk:{style:"ribbons"},dune:{style:"ribbons"},tide:{style:"ribbons",groups:[{items:[0,1,2],motion:{duration:36,x:1.2,y:2.4,scale:1.02}},{items:[3,4],motion:{duration:26,x:-1.8,y:-2.2,scale:1}}]},aurora:{style:"blobs",groups:[{items:[0,3],motion:{duration:48,x:7,y:5,scale:1.12}},{items:[1,4],motion:{duration:60,x:-8,y:6,scale:.9}},{items:[2],motion:{duration:40,x:5,y:-7,scale:1.15}}]},prism:{style:"blobs",groups:[{items:[0,2],motion:{duration:56,x:6,y:7,scale:1.1}},{items:[1,3],motion:{duration:46,x:7,y:-6,scale:1.12}},{items:[4],motion:{duration:38,x:-8,y:-5,scale:.92}}]},bloom:{style:"blobs",groups:[{items:[0,3],motion:{duration:52,x:-6,y:6,scale:1.14}},{items:[1,4],motion:{duration:44,x:7,y:-5,scale:.9}},{items:[2],motion:{duration:64,x:-5,y:-6,scale:1.1}}]}},S=1600,A=1e3,nt=12;function x(s){return String(Math.round(s*10)/10)}function Zt(s){let e=A*(.26+s*.135),t=A*(.075+s*.012),i=.9+s*.28,a=2.1+s*.45,r=s*1.15+.4,n=[];for(let o=0;o<=nt;o++){let c=-S*.06+S*1.12*o/nt,u=c/S,d=e+t*Math.sin(i*u*Math.PI*2+r)+t*.38*Math.sin(a*u*Math.PI*2+r*1.7)-u*A*.1;n.push([c,d])}return n}function es(s){let e=o=>s[Math.max(0,Math.min(s.length-1,o))]??[0,0],[t,i]=e(0),a=`M${x(t)} ${x(i)}`;for(let o=0;o<s.length-1;o++){let[c,u]=e(o-1),[d,h]=e(o),[f,y]=e(o+1),[K,pe]=e(o+2),ge=d+(f-c)/6,Y=h+(y-u)/6,q=f-(K-d)/6,X=y-(pe-h)/6;a+=`C${x(ge)} ${x(Y)} ${x(q)} ${x(X)} ${x(f)} ${x(y)}`}let r=S*1.06,n=-S*.06;return`${a}L${x(r)} ${A+120}L${x(n)} ${A+120}Z`}function Fe(){return{defs:new Map,body:[]}}var me=.15;function be(s,e=0){let t=new Map;for(let{defs:a}of s)for(let[r,n]of a)t.set(r,n);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[-S*e,-A*e,S*(1+2*e),A*(1+2*e)].map(x).join(" ")}" preserveAspectRatio="xMidYMid slice"><defs>${[...t.values()].join("")}</defs>${s.flatMap(a=>a.body).join("")}</svg>`}function ot(s,e){let t=Fe();return t.defs.set("b",`<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient>`),t.defs.set("g",`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${S*.22}" cy="${A*.05}" r="${S*.7}"><stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${e}" stop-opacity="0"/></radialGradient>`),t.body.push(`<rect width="${S}" height="${A}" fill="url(#b)"/>`,`<rect width="${S}" height="${A}" fill="url(#g)"/>`),t}function ts(s,e){let[t,i]=s.ribbons[e]??["#000","#000"],a=Fe();return a.defs.set("s",'<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>'),a.defs.set("f",'<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>'),a.defs.set("c",'<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>'),a.defs.set(`r${e}`,`<linearGradient id="r${e}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${S}" y2="${A*.4}"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="${i}"/></linearGradient>`),a.defs.set(`p${e}`,`<path id="p${e}" d="${es(Zt(e))}"/>`),a.body.push(`<use href="#p${e}" fill="${s.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,`<use href="#p${e}" fill="url(#r${e})" fill-opacity="0.92" filter="url(#f)"/>`,`<use href="#p${e}" fill="none" stroke="${s.crest}" stroke-width="2.5" filter="url(#c)"/>`),a}function ss(s,e,t){let[i,a]=s.blobs[e]??["#000",0],[r,n,o]=(s.geometry??Jt)[e]??[.5,.5,400],c=(t?1-r:r)*S,u=n*A,d=Fe();return d.defs.set(`o${e}`,`<radialGradient id="o${e}"><stop offset="0" stop-color="${i}" stop-opacity="${a}"/><stop offset="0.45" stop-color="${i}" stop-opacity="${x(a*.55)}"/><stop offset="1" stop-color="${i}" stop-opacity="0"/></radialGradient>`),d.body.push(`<circle cx="${x(c)}" cy="${x(u)}" r="${o}" fill="url(#o${e})"/>`),d}function dt(s,e){if(Pe[s].style==="blobs"){let i=Qt[s][e];return[ot(i.bg,i.glow),...i.blobs.map((a,r)=>ss(i,r,s==="bloom"))]}let t=Xt[s][e];return[ot(t.bg,t.glow),...t.ribbons.map((i,a)=>ts(t,a))]}function ue(s){return Pe[s].groups!==void 0}function is(s,e){return be(dt(s,e))}function ct(s,e){let t=Pe[s].groups,i=dt(s,e);if(!t)return[{svg:be(i),motion:void 0}];let[a]=i,r=[{svg:be(a?[a]:[]),motion:void 0}];for(let n of t){let o=n.items.map(c=>i[c+1]).filter(c=>c!==void 0);r.push({svg:be(o,me),motion:n.motion})}return r}function Ge(s){return`data:image/svg+xml,${s.replace(/"/g,"'").replace(/\s+/g," ").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E")}`}function ve(s){return`url("${Ge(s)}")`}var lt=new Map;function re(s,e){let t=`${s}|${e}`,i=lt.get(t);return i===void 0&&(i=ve(is(s,e)),lt.set(t,i)),i}function ut(s,e,t){let i="<rect width='100%' height='100%' rx='18' ry='18' fill='none'",a=["<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>","<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",`<stop offset='0' stop-color='white' stop-opacity='${s}'/>`,`<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(s*20)/100}'/>`,"<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",`<stop offset='1' stop-color='white' stop-opacity='${e}'/>`,"</linearGradient>",`${i} stroke='black' stroke-opacity='${t}' stroke-width='1'/>`,`${i} stroke='url(#r)' stroke-width='3'/>`,"</svg>"].join("");return`url("${Ge(a)}")`}var w=`:root[${L}]`,O=`${w} body`,pt=`${w} body[${G}]`,I=`:not([${$}]):not([${$}] *)`,R=`${O} [${g}]${I}`,Ke=`${R}:not([${g}="backdrop"]):not([${m}])`;function p(s,e){let t=Object.entries(e).map(([i,a])=>`  ${i}: ${a};`).join(`
`);return`${s} {
${t}
}`}var as={[H]:.35,"--glassui-floor":0,"--glassui-tt":`max(var(${H}), var(--glassui-floor))`,"--glassui-blur":"calc(6px + var(--glassui-tt) * 22px)","--glassui-filter":"blur(var(--glassui-blur)) saturate(180%) brightness(1.04)","--glassui-fill-a":"calc(0.16 + var(--glassui-tt) * 0.62)","--glassui-dense-a":"calc(0.52 + var(--glassui-tt) * 0.42)","--glassui-smoke-a":"calc(0.5 + var(--glassui-tt) * 0.42)","--glassui-code-a":"calc(0.4 + var(--glassui-tt) * 0.4)","--glassui-canvas-a":"calc(0.4 + var(--glassui-tt) * 0.5)","--glassui-inset":"8px","--glassui-radius":"18px"},rs={"--glassui-glass-rgb":"255 255 255","--glassui-smoke-rgb":"30 30 32","--glassui-rim-hi":.9,"--glassui-rim-lo":.38,"--glassui-edge":"rgb(0 0 0 / 0.08)","--glassui-drop":"rgb(0 0 0 / 0.14)","--glassui-contact":"rgb(0 0 0 / 0.2)","--glassui-sheen":.2,"--glassui-light-a":.3,"--glassui-pane-rim":ut(.95,.5,.1),[E.fill]:"rgb(250 250 252 / calc(0.5 + var(--glassui-tt) * 0.42))",[E.overlayFill]:"rgb(250 250 252 / calc(0.86 + var(--glassui-tt) * 0.12))",[E.groupHeader]:"rgb(250 250 252 / calc(0.8 + var(--glassui-tt) * 0.18))"},ns={"--glassui-glass-rgb":"40 40 44","--glassui-smoke-rgb":"44 44 48","--glassui-rim-hi":.32,"--glassui-rim-lo":.12,"--glassui-edge":"rgb(0 0 0 / 0.5)","--glassui-drop":"rgb(0 0 0 / 0.42)","--glassui-contact":"rgb(0 0 0 / 0.5)","--glassui-sheen":.07,"--glassui-light-a":.16,"--glassui-pane-rim":ut(.4,.18,.5),[E.fill]:"rgb(44 44 48 / calc(0.46 + var(--glassui-tt) * 0.44))",[E.overlayFill]:"rgb(44 44 48 / calc(0.86 + var(--glassui-tt) * 0.12))",[E.groupHeader]:"rgb(44 44 48 / calc(0.8 + var(--glassui-tt) * 0.18))"},os={"--glassui-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","0 0 0 0.5px var(--glassui-edge)"].join(", "),"--glassui-contained-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","inset 0 0 0 0.5px var(--glassui-edge)"].join(", "),[E.filter]:"var(--glassui-filter)",...Object.fromEntries(M.map(s=>[`--glassui-src-${s}`,`var(${v[s]})`]))};function We(s,e,t){return`var(${De}), var(--glassui-rim), ${e}, ${t}, 0 0 0 0 ${s}`}var ls={[ae.panel]:We(V.panel,"0 2px 6px -2px rgb(0 0 0 / 0.06)","0 10px 28px -10px var(--glassui-drop)"),[ae.prominent]:We(V.prominent,"0 3px 10px -3px rgb(0 0 0 / 0.08)","0 18px 44px -14px var(--glassui-drop)"),[ae.soft]:We(V.soft,"0 4px 16px -6px rgb(0 0 0 / 0.06)","0 14px 36px -16px var(--glassui-drop)")},ds=Object.fromEntries(["panel","prominent","soft"].map(s=>[ae[s],["var(--glassui-contained-rim)","0 1px 2px -3px rgb(0 0 0 / 0.12)","0 16px 22px -33px var(--glassui-contact)",`0 0 0 0 ${V[s]}`].join(", ")])),cs="linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)",us=`radial-gradient(240px circle at var(${se}) var(${ie}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`,ps=[`@property ${se} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,`@property ${ie} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,"@property --glassui-light { syntax: '*'; inherits: false; }","@property --glassui-pane { syntax: '*'; inherits: false; }","@property --glassui-pane-size { syntax: '*'; inherits: false; }"].join(`
`);function gs(){let s=[p(`${R}[${g}="sidebar"], ${R}[${g}="composer"]`,{"--glassui-pct":"calc(var(--glassui-fill-a) * 100%)"}),p(`${R}[${g}="panel"], ${R}[${g}="menu"]`,{"--glassui-pct":"calc(var(--glassui-dense-a) * 100%)"}),p(`${R}[${g}="smoke"]`,{"--glassui-pct":"calc(var(--glassui-smoke-a) * 100%)"}),p(`${R}[${g}="code"]`,{"--glassui-pct":"calc(var(--glassui-code-a) * 100%)"}),p(`${R}[${g}="backdrop"], ${R}[${m}]`,{"--glassui-pct":"0%"}),p(Ke,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)"}),p(`${O} [${_}]`,{"background-color":"transparent"}),p(`${Ke}[${g}="code"]`,{"box-shadow":"var(--glassui-rim)"})],e=t=>`color-mix(in srgb, var(--glassui-src-${t}) var(--glassui-pct, 100%), transparent)`;for(let t of M)s.push(p(`${R}[${N}="${t}"]`,{[v[t]]:e(t)}));return s.push(p(`${R}[${g}="code"][${N}="code"]`,{[v.codeBanner]:"transparent"})),s.push(p(`${Ke}[${D}]`,{"--glassui-pane":"none","--glassui-pane-size":"100% 100%","background-image":`var(--glassui-light, none), var(--glassui-pane, none), ${cs}`,"background-size":"auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)","background-position":"center","background-repeat":"no-repeat"}),p(`${w}[${Z}] body [${g}][${D}]`,{"--glassui-light":us}),p(`${w}[${U}="floating"] body [${g}="sidebar"][${te}]:not([${m}])`,{"clip-path":"inset(var(--glassui-inset) round var(--glassui-radius))","--glassui-pane":"var(--glassui-pane-rim)","--glassui-pane-size":"calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))"})),s}function hs(){let s=`${O} [${C}]${I}`;return[p(`${s}:not([${C}="none"])`,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)","box-shadow":"var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)"}),p(`${s}[${C}="regular"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))"}),p(`${s}[${C}="dense"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))"}),p(`${s}[${C}="smoke"]`,{"background-color":"rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))"})]}function fs(){return[p(`${w}[${P}]`,{background:`var(${z}) center / cover no-repeat fixed`}),p(`${w}[${P}] body${I}`,{"background-color":"color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"})]}function bs(){return[`@media (prefers-contrast: more) {
${[p(w,{"--glassui-floor":.85}),p(O,{"--glassui-edge":"rgb(0 0 0 / 0.45)"}),p(pt,{"--glassui-edge":"rgb(255 255 255 / 0.35)"})].join(`
`)}
}`,`@media (prefers-reduced-transparency: reduce) {
${p(w,{"--glassui-floor":1})}
}`,`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${p(w,{"--glassui-floor":.9})}
}`].join(`
`)}function gt(){return`${["/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",ps,"@media screen and (forced-colors: none) {",p(w,as),p(`${O}${I}`,{...rs,...os}),p(`${pt}${I}`,ns),p(`${O}${I}, ${O} *${I}`,ls),p(`${R}[${F}]`,{...ds,"box-shadow":"var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"}),...gs(),...hs(),...fs(),bs(),"}"].join(`
`)}
`}var ms=new Set(["layer1","layer2","layer3","floating","elevated","overlay","base"]),vs=.5,ys=.25,xs=160;function ws(s,e){if(s!=="none"){for(let t of["prominent","panel","soft"])if(e[t]!==""&&s.includes(e[t]))return t}}function j(s,e,t,i=!1){return{kind:s,fill:e,paint:s!=="backdrop"&&t.backgroundImage==="none",float:i}}function ht(s,e){if(s.managed)return;let t=e.fills.get(s.background),i=ws(s.boxShadow,e.elevation),a=s.area>vs;if(s.backdropFilter!=="none"&&s.backdropFilter===e.menuFilter)return a?void 0:j("menu",void 0,s);switch(t){case"sidebar":return a?j("backdrop",t,s):j("sidebar",t,s,s.width>=xs&&s.boxShadow==="none"&&s.backgroundImage==="none");case"input":return j(a?"backdrop":"composer",t,s);case"toast":case"tooltip":return a?void 0:j("smoke",t,s);case"code":case"codeBanner":return a?void 0:{kind:"code",fill:t,paint:!1,float:!1};case void 0:return;default:break}if(ms.has(t)&&(i==="panel"||i==="prominent"))return j("panel",t,s);if(t==="base"&&i===void 0&&s.area>=ys)return j("backdrop",t,s)}var Es=[...Object.values(v),...Object.values(E)],ye=class{doc;sheet;entries=new Map;nextId=1;constructor(e,t){this.doc=e,this.sheet=t}sync(e,t){let i=new Set([...this.doc.querySelectorAll(`[${B}]${e?`, ${e}`:""}`)].filter(o=>this.doc.body.contains(o)&&!o.closest(`[${b}]`))),a=[];for(let o of this.entries.keys())i.has(o)||(o.removeAttribute($),this.entries.delete(o),a.push(o));for(let o of i){if(this.entries.has(o))continue;let c=this.nextId++;this.entries.set(o,{id:c,css:""}),o.setAttribute($,String(c)),a.push(o)}let r=[...this.entries].filter(([o,c])=>c.css===""||t.some(u=>u.contains(o))),n=this.doc.defaultView;if(r.length>0&&n){let o=this.doc.documentElement,c=o.getAttribute(L);o.removeAttribute(L);try{for(let[u,d]of r){let h=n.getComputedStyle(u),f=Es.map(y=>`  ${y}: ${h.getPropertyValue(y).trim()||"initial"};`);d.css=`:where(${w} [${$}="${d.id}"]) {
${f.join(`
`)}
}`}}finally{c!==null&&o.setAttribute(L,c)}}return this.sheet.setExclusions([...this.entries.values()].map(o=>o.css).join(`
`)),a}dispose(){for(let e of this.entries.keys())e.removeAttribute($);this.entries.clear(),this.sheet.setExclusions("")}};var ft=`[${g}][${D}]:not([${m}]):not([${g}="backdrop"])`,xe=class{doc;enabled=!1;frame=0;x=0;y=0;target=null;lit=new Set;constructor(e){this.doc=e}move=e=>{e.pointerType!=="mouse"&&e.pointerType!=="pen"||(this.x=e.clientX,this.y=e.clientY,this.target=e.target instanceof Element?e.target:null,this.schedule())};out=e=>{e.relatedTarget===null&&(this.target=null,this.schedule())};schedule(){let e=this.doc.defaultView;this.frame===0&&e&&(this.frame=e.requestAnimationFrame(this.paint))}paint=()=>{this.frame=0;let e=new Set;for(let t=this.target?.closest(ft);t;t=t.parentElement?.closest(ft))t instanceof HTMLElement&&e.add(t);for(let t of this.lit)e.has(t)||this.clear(t);for(let t of e){let i=t.getBoundingClientRect();t.style.setProperty(se,`${Math.round(this.x-i.left-t.clientLeft)}px`),t.style.setProperty(ie,`${Math.round(this.y-i.top-t.clientTop)}px`)}this.lit.clear();for(let t of e)this.lit.add(t)};clear(e){e.style.removeProperty(se),e.style.removeProperty(ie)}setEnabled(e){if(e===this.enabled)return;this.enabled=e;let t=this.doc.defaultView,i=this.doc.documentElement;if(e){i.setAttribute(Z,""),t?.addEventListener("pointermove",this.move,{passive:!0,capture:!0}),this.doc.addEventListener("pointerout",this.out,{passive:!0});return}t?.removeEventListener("pointermove",this.move,{capture:!0}),this.doc.removeEventListener("pointerout",this.out),this.frame!==0&&t?.cancelAnimationFrame(this.frame),this.frame=0,this.target=null;for(let a of this.lit)this.clear(a);this.lit.clear(),i.removeAttribute(Z)}dispose(){this.setEnabled(!1)}};function Ss(s){let e=[],t=0,i=0;for(let a=0;a<s.length;a++){let r=s[a];r==="("?t++:r===")"?t=Math.max(0,t-1):r===","&&t===0&&(e.push(s.slice(i,a)),i=a+1)}return e.push(s.slice(i)),e.map(a=>a.trim()).filter(a=>a.length>0)}function Ts(s){let e="",t=0;for(let i of s)i==="("?t++:i===")"?t=Math.max(0,t-1):t===0&&(e+=i);return e}var ks=/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)px/gi;function As(s){let e=0,t=0;if(s.trim()==="none")return{x:e,y:t};for(let i of Ss(s)){let a=Ts(i);if(/\binset\b/i.test(a))continue;let r=[...a.matchAll(ks)].map(h=>Number(h[1]));if(r.length<2)continue;let[n=0,o=0,c=0,u=0]=r,d=Math.max(0,c)*1.5+u;e=Math.max(e,d-n),t=Math.max(t,d-o)}return{x:e,y:t}}function bt(s){let e=As(s.boxShadow),t=0;s.outlineStyle!=="none"&&(t=Math.max(0,(parseFloat(s.outlineWidth)||0)+(parseFloat(s.outlineOffset)||0)));let i=a=>Math.max(0,Math.ceil(a-.001));return{x:i(Math.max(e.x,t)),y:i(Math.max(e.y,t))}}function mt(s,e){return Math.max(6,Math.min(Math.min(s,e)*.34,28))}function vt(s){return Math.round(s*1.7)}function yt({width:s,height:e,radius:t,bezel:i}){let a=new Uint8ClampedArray(s*e*4),r=s/2,n=e/2,o=Math.max(0,Math.min(t,r,n));for(let c=0;c<e;c++)for(let u=0;u<s;u++){let d=u+.5-r,h=c+.5-n,f=Math.abs(d)-(r-o),y=Math.abs(h)-(n-o),K=-(Math.hypot(Math.max(f,0),Math.max(y,0))+Math.min(Math.max(f,y),0)-o),pe=0,ge=0;if(K>0&&K<i){let q,X;if(f>0&&y>0){let qe=Math.hypot(f,y)||1;q=f/qe*Math.sign(d),X=y/qe*Math.sign(h)}else f>y?(q=Math.sign(d),X=0):(q=0,X=Math.sign(h));let Ye=Math.pow(1-K/i,2.4);pe=-q*Ye,ge=-X*Ye}let Y=(c*s+u)*4;a[Y]=128+pe*127,a[Y+1]=128+ge*127,a[Y+2]=128,a[Y+3]=255}return a}function xt(s,e){if(s.size===0)return"";let t=e?`[${G}]`:`:not([${G}])`,i=[...s].map(([a,r])=>`  ${v[a]}: ${tt(r)};`).join(`
`);return`${w} body${t}:not([${ee}]):not([${$}]) {
${i}
}`}function wt(s){return`${O} [${g}]${I}[${F}="${s}"]:not([${g}="backdrop"]):not([${m}]) {
  backdrop-filter: url(#glassui-lens-${s}) saturate(180%) brightness(1.04);
}`}var we=class{doc;element;nudges="";exclusions="";lenses=new Map;constructor(e){this.doc=e}setNudges(e){e!==this.nudges&&(this.nudges=e,this.flush())}setExclusions(e){e!==this.exclusions&&(this.exclusions=e,this.flush())}setLens(e,t){if(t===void 0){if(!this.lenses.delete(e))return}else{if(this.lenses.get(e)===t)return;this.lenses.set(e,t)}this.flush()}flush(){this.element?.isConnected||(this.element=this.doc.createElement("style"),this.element.setAttribute(b,"dynamic"),this.doc.head.append(this.element)),this.element.textContent=[this.nudges,this.exclusions,...this.lenses.values()].filter(Boolean).join(`
`)}dispose(){this.element?.remove(),this.element=void 0,this.nudges="",this.exclusions="",this.lenses.clear()}};var Et="http://www.w3.org/2000/svg",Rs=12,_s=.35,$s=160,Ls=24,Ns="rgb(128 128 128)",Ue={composer:0,smoke:1,menu:2,panel:3},Ee=class{doc;sheet;entries=new Map;maps=new Map;resize;defs;enabled=!1;blur=12;nextId=1;frame=0;constructor(e,t){this.doc=e,this.sheet=t;let i=e.defaultView;this.resize=i&&typeof i.ResizeObserver=="function"?new i.ResizeObserver(a=>{for(let r of a)this.resized(r.target)}):void 0}get active(){let e=0;for(let t of this.entries.values())t.live&&e++;return e}setEnabled(e){if(e!==this.enabled){this.enabled=e;for(let t of["focusin","focusout","transitionend","animationend"])e?this.doc.addEventListener(t,this.recheck,{capture:!0,passive:!0}):this.doc.removeEventListener(t,this.recheck,{capture:!0});e||(this.releaseAll(),this.frame!==0&&this.doc.defaultView?.cancelAnimationFrame(this.frame),this.frame=0)}}setBlur(e){if(e!==this.blur){this.blur=e;for(let t of this.defs?.querySelectorAll("feGaussianBlur")??[])t.setAttribute("stdDeviation",this.deviation())}}sync(e){let t=new Set(this.enabled?e.filter(i=>Ue[i.kind]!==void 0&&i.area>0&&i.area<=_s).sort((i,a)=>(Ue[i.kind]??9)-(Ue[a.kind]??9)||i.area-a.area).slice(0,Rs).map(i=>i.element):[]);for(let i of[...this.entries.keys()])(!t.has(i)||!i.isConnected)&&this.release(i);for(let i of t){if(this.entries.has(i)){this.verify(i);continue}let a={id:this.nextId++,key:"",live:!1,timer:void 0};this.entries.set(i,a),i.setAttribute(F,String(a.id)),this.resize?.observe(i),this.schedule(i,0)}}recheck=()=>{let e=this.doc.defaultView;this.frame!==0||!e||(this.frame=e.requestAnimationFrame(()=>{this.frame=0;for(let t of this.entries.keys())this.verify(t)}))};verify(e){let t=this.entries.get(e);!t||t.timer!==void 0||!e.isConnected||t.key!==this.geometryKey(e)&&this.resized(e)}deviation(){return(this.blur*.8).toFixed(1)}resized(e){let t=this.entries.get(e);!t||t.key===this.geometryKey(e)||(this.setLive(t,!1),this.schedule(e,$s))}setLive(e,t){e.live!==t&&(e.live=t,this.sheet.setLens(e.id,t?wt(e.id):void 0))}schedule(e,t){let i=this.entries.get(e);i&&(i.timer!==void 0&&clearTimeout(i.timer),i.timer=setTimeout(()=>{i.timer=void 0,this.build(e)},t))}geometryKey(e){let{width:t,height:i}=this.size(e),a=this.doc.defaultView;if(!a)return"";let r=a.getComputedStyle(e),n=Math.round(Math.min(parseFloat(r.borderTopLeftRadius)||0,t/2,i/2)),o=bt(r);return`${t}x${i}r${n}s${o.x},${o.y}`}size(e){if(e instanceof(this.doc.defaultView?.HTMLElement??HTMLElement))return{width:Math.round(e.offsetWidth),height:Math.round(e.offsetHeight)};let t=e.getBoundingClientRect();return{width:Math.round(t.width),height:Math.round(t.height)}}build(e){let t=this.entries.get(e);if(!t||!this.enabled)return;if(!e.isConnected){this.release(e);return}let i=this.geometryKey(e),a=/^(\d+)x(\d+)r(\d+)s(\d+),(\d+)$/.exec(i);t.key=i;let r=Number(a?.[1]??0),n=Number(a?.[2]??0),o=Number(a?.[3]??0),c={x:Number(a?.[4]??0),y:Number(a?.[5]??0)};if(!a||r<8||n<8||c.x!==0||c.y!==0){this.setLive(t,!1);return}let u=mt(r,n),d=this.map(`${r}x${n}r${o}`,{width:r,height:n,radius:o,bezel:u});if(d===void 0){this.setLive(t,!1);return}let h={x:String(-c.x),y:String(-c.y),width:String(r),height:String(n)},f=this.filter(t.id);for(let[y,K]of Object.entries(h))f.setAttribute(y,K);f.replaceChildren(this.node("feGaussianBlur",{in:"SourceGraphic",stdDeviation:this.deviation(),edgeMode:"duplicate",result:"blur"}),this.node("feFlood",{...h,"flood-color":Ns,result:"neutral"}),this.node("feImage",{...h,href:d,preserveAspectRatio:"none",result:"image"}),this.node("feMerge",{result:"map"},[this.node("feMergeNode",{in:"neutral"}),this.node("feMergeNode",{in:"image"})]),this.node("feDisplacementMap",{in:"blur",in2:"map",scale:String(vt(u)),xChannelSelector:"R",yChannelSelector:"G"})),this.setLive(t,!0)}map(e,t){let i=this.maps.get(e);if(i!==void 0)return i;let a=this.doc.createElement("canvas");a.width=t.width,a.height=t.height;let r=a.getContext("2d");if(!r)return;let n=r.createImageData(t.width,t.height);n.data.set(yt(t)),r.putImageData(n,0,0);let o=a.toDataURL("image/png");if(this.maps.set(e,o),this.maps.size>Ls){let c=this.maps.keys().next().value;c!==void 0&&this.maps.delete(c)}return o}filter(e){let t=this.doc.getElementById(`glassui-lens-${e}`);if(t instanceof(this.doc.defaultView?.SVGFilterElement??SVGFilterElement))return t;let i=this.node("filter",{id:`glassui-lens-${e}`,x:"0",y:"0",filterUnits:"userSpaceOnUse",primitiveUnits:"userSpaceOnUse","color-interpolation-filters":"sRGB"});return this.container().append(i),i}container(){if(this.defs?.isConnected)return this.defs;let e=this.doc.createElementNS(Et,"svg");return e.setAttribute(b,"defs"),e.setAttribute("aria-hidden","true"),e.setAttribute("focusable","false"),e.setAttribute("width","0"),e.setAttribute("height","0"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none",this.doc.body.append(e),this.defs=e,e}node(e,t,i=[]){let a=this.doc.createElementNS(Et,e);for(let[r,n]of Object.entries(t))a.setAttribute(r,n);return a.append(...i),a}release(e){let t=this.entries.get(e);t&&(t.timer!==void 0&&clearTimeout(t.timer),this.resize?.unobserve(e),this.setLive(t,!1),e.removeAttribute(F),this.doc.getElementById(`glassui-lens-${t.id}`)?.remove(),this.entries.delete(e))}releaseAll(){for(let e of[...this.entries.keys()])this.release(e)}dispose(){this.setEnabled(!1),this.releaseAll(),this.resize?.disconnect(),this.defs?.remove(),this.defs=void 0,this.maps.clear()}};var ne="rgba(0, 0, 0, 0)",Se=class{doc;host;cache=new Map;constructor(e){this.doc=e}container(){if(this.host?.isConnected)return this.host;let e=this.doc.createElement("div");return e.setAttribute(b,"probes"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict",this.doc.body.append(e),this.host=e,this.cache.clear(),e}probe(e,t){let i=this.cache.get(e);if(i?.isConnected)return i;let a=this.doc.createElement("div");return t(a),this.container().append(a),this.cache.set(e,a),a}style(e){let t=this.doc.defaultView;if(!t)throw new Error("dsh-glassui: probes need a document with a window");return t.getComputedStyle(e)}color(e){return this.style(this.probe(`bg:${e}`,t=>t.style.background=`var(${e})`)).backgroundColor}raw(){let e=this.doc.body;e.setAttribute(ee,"");try{let t=new Map(M.map(a=>[a,this.color(v[a])])),i=ce.map(a=>this.color(a)).filter(a=>a!==ne);return{watched:t,reserved:i}}finally{e.removeAttribute(ee)}}elevation(){let e=t=>this.style(this.probe(`sentinel:${t}`,i=>i.style.color=V[t])).color;return{panel:e("panel"),prominent:e("prominent"),soft:e("soft")}}menuFilter(){return this.style(this.probe("menu-filter",e=>e.style.setProperty("backdrop-filter",`var(${E.filter})`))).backdropFilter}tagged(e,t,i){let a=this.probe(`tagged:${e}:${t}:${i}`,r=>{r.setAttribute(g,e),r.setAttribute(N,t),i&&r.setAttribute(m,""),r.style.background=`var(${v[t]})`});return this.style(a).backgroundColor}dispose(){this.host?.remove(),this.host=void 0,this.cache.clear()}};var Cs=12;function Ms(s,e,t){switch(s.wallpaper){case"none":return;case"custom":return le(s.wallpaperUrl)?{name:"custom",image:`url("${s.wallpaperUrl}")`,preset:void 0}:void 0;case"auto":return t?void 0:{name:"bay",image:re("bay",e),preset:"bay"};default:return{name:s.wallpaper,image:re(s.wallpaper,e),preset:s.wallpaper}}}function Ds(s){let e=[[0,0],[.2,.1],[.5,.5],[.8,.9],[1,1]],t=1+2*me;return e.map(([i,a])=>({offset:i,transform:`translate(${Be(s.x*a/t)}%, ${Be(s.y*a/t)}%) scale(${Be(1+(s.scale-1)*a,4)})`}))}function Be(s,e=3){let t=10**e;return Math.round(s*t)/t}var He=class{doc;container;layers=[];key="";constructor(e){this.doc=e}show(e,t){let i=`${e}|${t.length}`;if(this.container?.isConnected&&i===this.key){t.forEach((o,c)=>this.layers[c]?.style.setProperty("background-image",o.image));return}this.hide(),this.key=i;let a=this.doc.createElement("div");a.setAttribute(b,"wallpaper"),a.setAttribute("aria-hidden","true"),a.style.cssText="position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;";let r=this.doc.createElement("div");r.style.cssText="position:absolute;left:50%;top:50%;width:max(100vw,160vh);height:max(100vh,62.5vw);transform:translate(-50%,-50%);",a.append(r);for(let o of t){let c=this.doc.createElement("div");c.style.cssText=`position:absolute;inset:${-me*100}%;background:center / 100% 100% no-repeat;will-change:transform;`,c.style.setProperty("background-image",o.image),r.append(c),this.layers.push(c),typeof c.animate=="function"&&c.animate(Ds(o.motion),{duration:o.motion.duration*1e3,iterations:Number.POSITIVE_INFINITY,direction:"alternate",easing:`steps(${o.motion.duration*Cs})`})}this.doc.documentElement.insertBefore(a,this.doc.body),this.container=a}hide(){for(let e of this.layers)for(let t of e.getAnimations())t.cancel();this.layers=[],this.container?.remove(),this.container=void 0,this.key=""}},Te=class{doc;live;cache=new Map;layerCache=new Map;current;constructor(e){this.doc=e,this.live=new He(e)}apply(e,t,i,a=!0){let r=`${e.wallpaper}|${e.wallpaperUrl}|${t}|${i}|${a}`;if(r===this.current)return;this.current=r,this.cache.has(r)||this.cache.set(r,Ms(e,t,i));let n=this.cache.get(r),o=this.doc.documentElement;if(!n){this.live.hide(),o.removeAttribute(P),o.style.removeProperty(z);return}let c=n.preset;if(a&&c!==void 0&&ue(c)){let u=this.layers(c,t);o.style.setProperty(z,u.base),this.live.show(c,u.moving)}else this.live.hide(),o.style.setProperty(z,n.image);o.setAttribute(P,n.name)}layers(e,t){let i=`${e}|${t}`,a=this.layerCache.get(i);if(!a){let[r,...n]=ct(e,t);a={base:r?ve(r.svg):"none",moving:n.flatMap(o=>o.motion?[{image:ve(o.svg),motion:o.motion}]:[])},this.layerCache.set(i,a)}return a}dispose(){this.live.hide();let e=this.doc.documentElement;e.removeAttribute(P),e.style.removeProperty(z),this.current=void 0}};var ke=new Set(["DIV","ASIDE","NAV","HEADER","FOOTER","SECTION","MAIN","FORM","DIALOG","MENU","UL","OL","ARTICLE","BUTTON","FIELDSET","DETAILS"]),Is=new Set(["SVG","PRE","CODE","TABLE","IFRAME","VIDEO","CANVAS","IMG","TEXTAREA","SELECT","SCRIPT","STYLE","TEMPLATE"]),Os="/* dsh-glassui:",Ps=8,Fs=new Set(["sidebar","composer","panel","smoke","code"]);function Gs(){return Object.fromEntries(de.map(s=>[s,0]))}function Ks(s,e){let t=e.trim();if(t==="")return"";try{return s.createDocumentFragment().querySelector(t),t}catch{return}}var Ae=class{win;doc;env;onChange;settings;running=!1;idle="disabled";probes;sheet;exclusions;lenses;highlights;wallpaper;ownSheet;signatures;expected=new Map;missing=[];ambiguous=[];tagged=new Map;echoes=new Set;roots=new Set;singles=new Set;invalidated=new Set;requeue=[];walkers=[];frame=0;paletteDirty=!1;exclusionsDirty=!1;exclude="";invalidExclude=!1;stats={batches:0,inspected:0,longestMs:0,totalMs:0};subtree;bodyWatch;rootWatch;headWatch;stopEnvironment;disposed=!1;constructor(e,t,i){this.win=e,this.doc=e.document,this.env=t,this.onChange=i,this.probes=new Se(this.doc),this.sheet=new we(this.doc),this.exclusions=new ye(this.doc,this.sheet),this.lenses=new Ee(this.doc,this.sheet),this.highlights=new xe(this.doc),this.wallpaper=new Te(this.doc),this.stopEnvironment=this.env.onChange(()=>{this.settings&&this.apply(this.settings),this.paletteChanged()})}get active(){return this.running}apply(e){if(this.disposed)return;let t=this.settings;if(this.settings=e,!e.enabled||this.env.forcedColors()){this.idle=e.enabled?"forced-colors":"disabled",this.stop();return}if(!this.running){this.start();return}let i=this.doc.documentElement;i.setAttribute(U,e.sidebar),t?.tint!==e.tint&&(i.style.setProperty(H,String(e.tint/100)),this.expected.clear(),this.lenses.setBlur(this.blurPx()),this.signatures&&(this.signatures.menuFilter=this.probes.menuFilter())),t?.exclude!==e.exclude&&this.updateExclude(!0),t?.codeBlocks!==e.codeBlocks&&this.updateCodeBlocks(),this.applyPresentation()}start(){let e=this.settings;if(!e||!this.doc.body)return;this.running=!0,this.idle=void 0,this.ensureStylesheet();let t=this.doc.documentElement;t.setAttribute(L,"on"),t.setAttribute(U,e.sidebar),t.style.setProperty(H,String(e.tint/100)),this.lenses.setBlur(this.blurPx()),this.updateExclude(!1),this.refreshExclusions(),this.refreshPalette(),this.applyPresentation(),this.subtree=new this.win.MutationObserver(i=>this.mutated(i)),this.subtree.observe(this.doc.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style",B,C,"contenteditable"],attributeOldValue:!0}),this.bodyWatch=new this.win.MutationObserver(()=>this.paletteChanged()),this.bodyWatch.observe(this.doc.body,{attributes:!0,attributeFilter:[G,"style","class"]}),this.rootWatch=new this.win.MutationObserver(()=>this.applyPresentation()),this.rootWatch.observe(t,{attributes:!0,attributeFilter:[Ie]}),this.headWatch=new this.win.MutationObserver(i=>{i.some(a=>!this.ownRecord(a))&&this.paletteChanged()}),this.headWatch.observe(this.doc.head,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["href","media","disabled"]}),this.win.addEventListener("resize",this.resized,{passive:!0}),this.doc.addEventListener("load",this.loaded,!0),this.doc.addEventListener("transitionend",this.settled,!0),this.doc.addEventListener("animationend",this.settled,!0),this.roots.add(this.doc.body),this.schedule()}stop(){let e=this.running;this.running=!1,this.frame!==0&&this.win.cancelAnimationFrame(this.frame),this.frame=0,this.subtree?.disconnect(),this.bodyWatch?.disconnect(),this.rootWatch?.disconnect(),this.headWatch?.disconnect(),this.subtree=this.bodyWatch=this.rootWatch=this.headWatch=void 0,this.doc.removeEventListener("load",this.loaded,!0),this.doc.removeEventListener("transitionend",this.settled,!0),this.doc.removeEventListener("animationend",this.settled,!0),this.win.removeEventListener("resize",this.resized),this.roots.clear(),this.singles.clear(),this.invalidated.clear(),this.exclusionsDirty=!1,this.walkers=[],this.requeue.length=0,this.lenses.dispose(),this.highlights.dispose(),this.wallpaper.dispose(),this.exclusions.dispose(),this.sheet.dispose(),this.probes.dispose(),this.ownSheet?.remove(),this.ownSheet=void 0;for(let i of[...this.tagged.keys()])this.untag(i);for(let i of this.echoes)i.removeAttribute(_);this.echoes.clear(),this.signatures=void 0,this.expected.clear();let t=this.doc.documentElement;t.removeAttribute(L),t.removeAttribute(U),t.style.removeProperty(H);for(let i of this.doc.querySelectorAll(it)){if(i.hasAttribute(b)){i.remove();continue}for(let a of[...i.getAttributeNames()])a.startsWith("data-glassui")&&a!==B&&a!==C&&i.removeAttribute(a)}e&&this.changed()}dispose(){this.disposed=!0,this.stopEnvironment?.(),this.stopEnvironment=void 0,this.stop(),this.notifyFrame!==0&&this.win.cancelAnimationFrame(this.notifyFrame),this.notifyFrame=0}diagnostics(){let e=Gs();for(let[t,i]of this.tagged)!i.flat&&t.isConnected&&e[i.kind]++;return{running:this.running,idle:this.running?void 0:this.idle,environment:{refraction:this.env.refraction,finePointer:this.env.finePointer(),reducedTransparency:this.env.reducedTransparency(),reducedMotion:this.env.reducedMotion()},missingTokens:[...this.missing],ambiguousTokens:[...this.ambiguous],surfaces:e,lenses:this.lenses.active,invalidExclude:this.invalidExclude,scans:{...this.stats}}}blurPx(){let e=(this.settings?.tint??35)/100;return 6+Math.max(e,this.env.reducedTransparency()?1:0,this.env.increasedContrast()?.85:0)*22}scheme(){return this.doc.body.hasAttribute(G)?"dark":"light"}applyPresentation(){let e=this.settings;if(!this.running||!e)return;this.lenses.setBlur(this.blurPx());let t=this.doc.documentElement.getAttribute(Ie)==="darwin";this.wallpaper.apply(e,this.scheme(),t,!this.env.reducedMotion()),this.highlights.setEnabled(e.highlights&&this.env.finePointer()&&!this.env.reducedMotion()&&!this.env.reducedTransparency()),this.lenses.setEnabled(e.refraction&&this.env.refraction&&!this.env.reducedTransparency()),this.syncLenses()}ensureStylesheet(){for(let t of this.doc.querySelectorAll("style"))if(t.textContent.startsWith(Os))return;let e=this.doc.createElement("style");e.setAttribute(b,"stylesheet"),e.textContent=gt(),this.doc.head.append(e),this.ownSheet=e}updateCodeBlocks(){if(this.settings?.codeBlocks!=="glass"){for(let[e,t]of[...this.tagged])t.kind==="code"&&this.untag(e);this.syncLenses(),this.changed()}this.paletteChanged()}codeGlass(){return this.settings?.codeBlocks==="glass"}watchedFills(){return this.codeGlass()?[...M]:M.filter(e=>!at.has(e))}updateExclude(e){let t=Ks(this.doc,this.settings?.exclude??"");this.invalidExclude=t===void 0;let i=t??"";if(i!==this.exclude&&(this.exclude=i,!!e)){if(this.refreshExclusions(),i!==""){for(let a of[...this.tagged.keys()])a.closest(i)&&this.untag(a);for(let a of this.echoes)a.closest(i)&&(a.removeAttribute(_),this.echoes.delete(a))}this.syncLenses(),this.changed(),this.roots.add(this.doc.body),this.schedule()}}refreshExclusions(){for(let e of this.exclusions.sync(this.exclude,[...this.invalidated]))this.invalidated.add(e),this.roots.add(e)}resized=()=>this.paletteChanged();paletteChanged(){this.running&&(this.paletteDirty=!0,this.invalidated.add(this.doc.body),this.roots.add(this.doc.body),this.schedule())}refreshPalette(){let e=this.probes.raw(),t=this.watchedFills(),i=[...e.reserved,...M.filter(u=>!t.includes(u)).map(u=>e.watched.get(u)??ne)],a=u=>u===ne?void 0:Me(u),r=st(t.map(u=>[u,a(e.watched.get(u)??ne)]),i.map(a).filter(u=>u!==void 0));this.sheet.setNudges(xt(r,this.scheme()==="dark"));let n=new Set([...ce,...M.filter(u=>!t.includes(u)).map(u=>v[u])].map(u=>this.probes.color(u))),o=new Map,c=new Map;this.missing=[];for(let u of t){if(e.watched.get(u)===ne){this.missing.push(u);continue}let d=this.probes.color(v[u]);c.set(d,[...c.get(d)??[],u])}this.ambiguous=[];for(let[u,d]of c){let[h]=d;d.length===1&&h!==void 0&&!n.has(u)?o.set(u,h):this.ambiguous.push(...d)}this.signatures={fills:o,elevation:this.probes.elevation(),menuFilter:this.probes.menuFilter()},this.expected.clear()}loaded=e=>{e.target instanceof this.win.HTMLLinkElement&&this.paletteChanged()};ownedNode(e){let t=e instanceof this.win.Element?e:e.parentElement;return t!==null&&t.closest(`[${b}]`)!==null}ownRecord(e){if(this.ownedNode(e.target))return!0;if(e.type!=="childList")return!1;let t=[...e.addedNodes,...e.removedNodes];return t.length>0&&t.every(i=>i instanceof this.win.Element&&i.hasAttribute(b))}settled=e=>{let t=e.target;this.running&&t instanceof this.win.Element&&ke.has(t.tagName)&&(this.singles.add(t),this.schedule())};mutated(e){let t=!1;for(let i of e)if(!this.ownRecord(i)){if(i.type==="attributes"){if(!(i.target instanceof this.win.Element)||i.attributeName==="style"&&this.onlyOwnStyleChanged(i))continue;this.exclusionsDirty=!0,this.invalidated.add(i.target),this.roots.add(i.target);continue}this.exclusionsDirty=!0;for(let a of i.addedNodes)a instanceof this.win.Element&&!a.hasAttribute(b)&&(this.invalidated.add(a),this.roots.add(a));i.removedNodes.length>0&&(t=!0)}t&&this.prune(),this.schedule()}onlyOwnStyleChanged(e){let t=i=>{let a=this.doc.createElement("div").style;a.cssText=i;for(let r of[...a])r.startsWith("--glassui-")&&a.removeProperty(r);return a.cssText};return t(e.oldValue??"")===t(e.target.getAttribute("style")??"")}reclassify(){if(this.invalidated.size===0)return!1;let e=[...this.invalidated];this.invalidated.clear();let t=new Set(this.echoes),i=[...this.tagged.keys(),...this.echoes].filter(n=>e.some(o=>o.contains(n))).sort((n,o)=>n.compareDocumentPosition(o)&this.win.Node.DOCUMENT_POSITION_FOLLOWING?-1:1);if(i.length===0)return!1;for(let n of i)this.tagged.has(n)&&this.untag(n),this.echoes.delete(n)&&n.removeAttribute(_);let a=i.filter(n=>n.isConnected&&this.admissible(n)).map(n=>this.inspect(n));for(let n of a)this.commit(n);let r=a.filter(({element:n})=>t.has(n)&&this.isEcho(n,this.win.getComputedStyle(n).backgroundColor));for(let{element:n}of r)this.untag(n),n.setAttribute(_,""),this.echoes.add(n);return this.stats.inspected+=a.length,!0}schedule(){this.running&&this.frame===0&&(this.frame=this.win.requestAnimationFrame(this.process))}process=()=>{if(this.frame=0,!this.running)return;let e=performance.now();(this.exclusionsDirty||this.paletteDirty)&&(this.exclusionsDirty=!1,this.refreshExclusions()),this.paletteDirty&&(this.paletteDirty=!1,this.refreshPalette(),this.applyPresentation());let t=this.reclassify();for(let n of this.roots)this.admissible(n)&&n.isConnected&&!this.walkers.some(o=>!o.started&&o.root.contains(n))&&(this.walkers=this.walkers.filter(o=>o.started||!n.contains(o.root)),this.walkers.push({root:n,walker:this.walker(n),started:!1}));this.roots.clear();let i=e+Ps,a=[];for(let n of this.singles)if(this.singles.delete(n),n.isConnected&&ke.has(n.tagName)&&this.admissible(n)&&a.push(this.inspect(n)),(a.length&63)===0&&performance.now()>i)break;e:for(;this.walkers.length>0&&performance.now()<=i;){let n=this.walkers[0];if(!n)break;if(!n.root.isConnected||!this.admissible(n.root)){this.walkers.shift();continue}n.started||(n.started=!0,ke.has(n.root.tagName)&&this.admissible(n.root)&&a.push(this.inspect(n.root)));for(let o=n.walker.nextNode();o;o=n.walker.nextNode())if(a.push(this.inspect(o)),(a.length&63)===0&&performance.now()>i)break e;this.walkers.shift()}for(let n of a)t=this.commit(n)||t;for(let n of this.requeue.splice(0))this.singles.add(n);t&&this.syncLenses();let r=performance.now()-e;this.stats.batches++,this.stats.inspected+=a.length,this.stats.totalMs+=r,this.stats.longestMs=Math.max(this.stats.longestMs,r),t&&this.changed(),(this.walkers.length>0||this.roots.size>0||this.singles.size>0)&&this.schedule()};admissible(e){return e.closest(`[${b}],[${B}],[contenteditable]`)?!1:this.exclude===""||!e.closest(this.exclude)}walker(e){let t=i=>{let a=i,r=a.tagName;if(this.codeGlass()&&a.hasAttribute(Oe)){this.singles.add(a);for(let n of a.querySelectorAll("div"))this.singles.add(n);return NodeFilter.FILTER_REJECT}return Is.has(r.toUpperCase())||a.hasAttribute(b)||a.hasAttribute(B)||a.hasAttribute("contenteditable")||a.hasAttribute(Oe)||this.exclude!==""&&a.matches(this.exclude)?NodeFilter.FILTER_REJECT:ke.has(r)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP};return this.doc.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:t})}inspect(e){let t=this.signatures,i=this.tagged.get(e);if(!t)return{element:e,verdict:void 0,area:0,untag:!1};let a=this.win.getComputedStyle(e);if(i)return(i.kind==="menu"?a.backdropFilter!=="none":i.fill!==void 0&&a.backgroundColor===this.expectedFor(i.kind,i.fill,i.flat))?{element:e,verdict:void 0,area:i.area,untag:!1}:(this.requeue.push(e),{element:e,verdict:void 0,area:0,untag:!0});let r=a.backgroundColor,n=a.backdropFilter;if(!t.fills.has(r)&&(n==="none"||n!==t.menuFilter))return{element:e,verdict:void 0,area:0,untag:!1,echo:this.echoes.has(e)||this.isEcho(e,r)};let o=e.getBoundingClientRect(),c=Math.max(1,this.win.innerWidth*this.win.innerHeight),u={background:r,backgroundImage:a.backgroundImage,boxShadow:a.boxShadow,backdropFilter:n,area:o.width*o.height/c,width:o.width,managed:e.hasAttribute(C)};return{element:e,verdict:ht(u,t),area:u.area,untag:!1}}isEcho(e,t){let i=Me(t);if(!i||i.a===0||i.a>=1)return!1;let a=e.parentElement?.closest(`[${g}]:not([${m}])`),r=a?this.tagged.get(a):void 0;return!r||r.kind==="backdrop"||r.kind==="menu"||r.fill===void 0?!1:t===this.expectedFor(r.kind,r.fill,!1)}expectedFor(e,t,i){let a=`${e}|${t}|${i}`,r=this.expected.get(a);return r===void 0&&(r=this.probes.tagged(e,t,i),this.expected.set(a,r)),r}commit(e){let{element:t,verdict:i}=e;if(e.untag)return this.untag(t),!0;if(e.echo&&!this.echoes.has(t))return t.setAttribute(_,""),this.echoes.add(t),!1;if(!i||this.tagged.has(t)||!t.isConnected)return!1;let a=!1;if(i.fill!==void 0&&Fs.has(i.kind)){let r=i.kind==="code"?`[${g}="code"]`:`[${N}="${i.fill}"]`,n=t.parentElement?.closest(`${r}:not([${m}])`);a=n!=null&&this.tagged.get(n)?.kind!=="backdrop"}return t.setAttribute(g,i.kind),i.fill!==void 0&&t.setAttribute(N,i.fill),a&&t.setAttribute(m,""),i.paint&&!a&&t.setAttribute(D,""),i.float&&!a&&t.setAttribute(te,""),this.tagged.set(t,{kind:i.kind,fill:i.fill,flat:a,area:e.area}),a&&this.requeue.push(t),!0}untag(e){for(let t of[g,N,m,D,te])e.removeAttribute(t);this.tagged.delete(e);for(let t of this.echoes)e.contains(t)&&(t.removeAttribute(_),this.echoes.delete(t))}prune(){for(let t of this.echoes)t.isConnected||(t.removeAttribute(_),this.echoes.delete(t));let e=!1;for(let t of this.tagged.keys())t.isConnected||(this.untag(t),e=!0);e&&(this.syncLenses(),this.changed())}syncLenses(){let e=[];for(let[t,i]of this.tagged)!i.flat&&t.isConnected&&e.push({element:t,kind:i.kind,area:i.area});this.lenses.sync(e)}notifyFrame=0;changed(){this.disposed||!this.onChange||this.notifyFrame!==0||(this.notifyFrame=this.win.requestAnimationFrame(()=>{this.notifyFrame=0,this.onChange?.()}))}};function St(s){let e=d=>typeof s.matchMedia=="function"?s.matchMedia(d):void 0,t=e("(hover: hover) and (pointer: fine)"),i=e("(prefers-reduced-motion: reduce)"),a=e("(prefers-reduced-transparency: reduce)"),r=e("(prefers-contrast: more)"),n=e("(forced-colors: active)"),o=s.navigator.userAgentData?.brands,c=o?o.some(d=>/Chromium/i.test(d.brand)):/(?:Chrome|Chromium)\/\d/.test(s.navigator.userAgent),u=typeof s.CSS<"u"&&typeof s.CSS.supports=="function"&&s.CSS.supports("backdrop-filter","url(#a)");return{refraction:c&&u,finePointer:()=>t?.matches??!1,reducedMotion:()=>i?.matches??!1,reducedTransparency:()=>a?.matches??!1,increasedContrast:()=>r?.matches??!1,forcedColors:()=>n?.matches??!1,onChange(d){let h=[t,i,a,r,n].filter(f=>f!==void 0);for(let f of h)f.addEventListener("change",d);return()=>{for(let f of h)f.removeEventListener("change",d)}}}}var ze="dsh-glassui",Tt={title:"Glass UI",subtitle:"Adjust glass, wallpaper and effects.","status.on":"On","status.off":"Off","status.forced":"Paused while high contrast is on","status.surfaces":"{count} glass surfaces","section.material":"Material","enable.label":"Glass material","enable.hint":"Turn off to see DSH\u2019s original look.","tint.label":"Transparency","tint.clear":"Clear","tint.tinted":"Tinted","section.wallpaper":"Wallpaper","wallpaper.auto":"Automatic","wallpaper.auto.hint":"Bay in a browser, none in the macOS app.","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"Live","wallpaper.live.hint":"Moves slowly. It holds still with Reduce Motion, and costs a little more power than a still wallpaper.","wallpaper.none":"None","wallpaper.custom":"Custom","wallpaper.url.label":"Image URL","wallpaper.url.placeholder":"https://\u2026 or /path/on/this/server.jpg","wallpaper.url.invalid":"Use an http(s) URL, a path on this server, or a base64 image data URL.","section.layout":"Layout and effects","sidebar.label":"Sidebar","sidebar.floating":"Floating","sidebar.docked":"Docked","code.label":"Code blocks","code.hint":"Glass is a denser tint that keeps code easy to read.","code.glass":"Glass","code.solid":"Solid","refraction.label":"Refraction","refraction.hint":"Bends the background along glass edges.","refraction.unavailable":"Needs a Chromium-based browser such as Chrome, Edge or the DSH desktop app.","highlights.label":"Pointer highlights","highlights.hint":"A soft light follows the pointer. Off on touch screens and with Reduce Motion.","section.compat":"Compatibility","exclude.label":"Leave these elements alone","exclude.hint":"CSS selectors, comma separated. Use this when another plugin looks wrong under glass.","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"This selector is not valid, so it is ignored.","diag.title":"Diagnostics","diag.surfaces":"Glass surfaces","diag.lenses":"Refracting now","diag.tokens":"DSH theme tokens","diag.tokens.ok":"All found","diag.tokens.missing":"Not in this DSH release: {list}","diag.tokens.ambiguous":"Indistinguishable: {list}","diag.scan":"Scanning","diag.scan.value":"{batches} passes, longest {longest} ms","diag.copy":"Copy diagnostics","diag.copied":"Copied","diag.copy.failed":"Copy failed. Select the text below instead.","kind.sidebar":"Sidebar","kind.composer":"Composer","kind.panel":"Panels","kind.menu":"Menus","kind.smoke":"Toasts and tooltips","kind.code":"Code blocks","kind.backdrop":"Backgrounds","save.local":"This connection cannot save settings, so changes last until the page reloads.","save.error":"Could not save the change. The previous value is back.","save.saving":"Saving\u2026",footer:"dsh-glassui {version}. Unofficial; not affiliated with DeepSeek."},kt={title:"Glass UI",subtitle:"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F\u3001\u58C1\u7D19\u3001\u8868\u793A\u52B9\u679C\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002","status.on":"\u30AA\u30F3","status.off":"\u30AA\u30D5","status.forced":"\u30CF\u30A4\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u306E\u305F\u3081\u4E00\u6642\u505C\u6B62\u4E2D","status.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762 {count} \u500B","section.material":"\u8CEA\u611F","enable.label":"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F","enable.hint":"\u30AA\u30D5\u306B\u3059\u308B\u3068 DSH \u672C\u6765\u306E\u898B\u305F\u76EE\u306B\u623B\u308A\u307E\u3059\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u30AF\u30EA\u30A2","tint.tinted":"\u30C6\u30A3\u30F3\u30C8","section.wallpaper":"\u58C1\u7D19","wallpaper.auto":"\u81EA\u52D5","wallpaper.auto.hint":"\u30D6\u30E9\u30A6\u30B6\u3067\u306F Bay\u3001macOS \u30A2\u30D7\u30EA\u3067\u306F\u58C1\u7D19\u306A\u3057\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52D5\u304F","wallpaper.live.hint":"\u3086\u3063\u304F\u308A\u52D5\u304D\u307E\u3059\u3002\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u304C\u30AA\u30F3\u306E\u3068\u304D\u306F\u6B62\u307E\u308A\u307E\u3059\u3002\u9759\u6B62\u3057\u305F\u58C1\u7D19\u3088\u308A\u5C11\u3057\u3060\u3051\u96FB\u529B\u3092\u4F7F\u3044\u307E\u3059\u3002","wallpaper.none":"\u306A\u3057","wallpaper.custom":"\u30AB\u30B9\u30BF\u30E0","wallpaper.url.label":"\u753B\u50CF\u306E URL","wallpaper.url.placeholder":"https://\u2026 \u307E\u305F\u306F /\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9.jpg","wallpaper.url.invalid":"http(s) \u306E URL\u3001\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9\u3001\u307E\u305F\u306F base64 \u306E\u753B\u50CF\u30C7\u30FC\u30BF URL \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002","section.layout":"\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u52B9\u679C","sidebar.label":"\u30B5\u30A4\u30C9\u30D0\u30FC","sidebar.floating":"\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0","sidebar.docked":"\u30C9\u30C3\u30AD\u30F3\u30B0","code.label":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","code.hint":"\u30AC\u30E9\u30B9\u306F\u30B3\u30FC\u30C9\u304C\u8AAD\u307F\u3084\u3059\u3044\u6FC3\u3055\u306B\u3057\u3066\u3042\u308A\u307E\u3059\u3002","code.glass":"\u30AC\u30E9\u30B9","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u5C48\u6298","refraction.hint":"\u30AC\u30E9\u30B9\u306E\u7E01\u3067\u80CC\u666F\u304C\u66F2\u304C\u3063\u3066\u898B\u3048\u307E\u3059\u3002","refraction.unavailable":"Chrome\u3001Edge\u3001DSH \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u306A\u3069 Chromium \u7CFB\u306E\u30D6\u30E9\u30A6\u30B6\u3067\u4F7F\u3048\u307E\u3059\u3002","highlights.label":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u30CF\u30A4\u30E9\u30A4\u30C8","highlights.hint":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u4F4D\u7F6E\u306B\u67D4\u3089\u304B\u3044\u5149\u304C\u5F53\u305F\u308A\u307E\u3059\u3002\u30BF\u30C3\u30C1\u753B\u9762\u3068\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u3067\u306F\u30AA\u30D5\u306B\u306A\u308A\u307E\u3059\u3002","section.compat":"\u4E92\u63DB\u6027","exclude.label":"\u5909\u66F4\u3057\u306A\u3044\u8981\u7D20","exclude.hint":"CSS \u30BB\u30EC\u30AF\u30BF\u30FC\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\u6307\u5B9A\u3057\u307E\u3059\u3002\u307B\u304B\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u304C\u5D29\u308C\u308B\u3068\u304D\u306B\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u30BB\u30EC\u30AF\u30BF\u30FC\u306E\u66F8\u304D\u65B9\u304C\u6B63\u3057\u304F\u306A\u3044\u305F\u3081\u3001\u7121\u8996\u3057\u3066\u3044\u307E\u3059\u3002","diag.title":"\u8A3A\u65AD\u60C5\u5831","diag.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762","diag.lenses":"\u5C48\u6298\u4E2D","diag.tokens":"DSH \u306E\u30C6\u30FC\u30DE\u30C8\u30FC\u30AF\u30F3","diag.tokens.ok":"\u3059\u3079\u3066\u898B\u3064\u304B\u308A\u307E\u3057\u305F","diag.tokens.missing":"\u3053\u306E\u7248\u306E DSH \u306B\u306A\u3044\u3082\u306E: {list}","diag.tokens.ambiguous":"\u533A\u5225\u3067\u304D\u306A\u3044\u3082\u306E: {list}","diag.scan":"\u8D70\u67FB","diag.scan.value":"{batches} \u56DE\u3001\u6700\u9577 {longest} ms","diag.copy":"\u8A3A\u65AD\u60C5\u5831\u3092\u30B3\u30D4\u30FC","diag.copied":"\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F","diag.copy.failed":"\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u4E0B\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u9078\u629E\u3057\u3066\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002","kind.sidebar":"\u30B5\u30A4\u30C9\u30D0\u30FC","kind.composer":"\u5165\u529B\u6B04","kind.panel":"\u30D1\u30CD\u30EB","kind.menu":"\u30E1\u30CB\u30E5\u30FC","kind.smoke":"\u30C8\u30FC\u30B9\u30C8\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7","kind.code":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","kind.backdrop":"\u80CC\u666F","save.local":"\u3053\u306E\u63A5\u7D9A\u3067\u306F\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u5909\u66F4\u306F\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u307E\u3067\u6709\u52B9\u3067\u3059\u3002","save.error":"\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u5143\u306E\u5024\u306B\u623B\u3057\u307E\u3057\u305F\u3002","save.saving":"\u4FDD\u5B58\u4E2D\u2026",footer:"dsh-glassui {version}\u3002\u975E\u516C\u5F0F\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u3067\u3001DeepSeek \u3068\u306F\u95A2\u4FC2\u3042\u308A\u307E\u305B\u3093\u3002"},At={title:"Glass UI",subtitle:"\u8BBE\u7F6E\u73BB\u7483\u6750\u8D28\u3001\u5899\u7EB8\u548C\u663E\u793A\u6548\u679C\u3002","status.on":"\u5DF2\u5F00\u542F","status.off":"\u5DF2\u5173\u95ED","status.forced":"\u9AD8\u5BF9\u6BD4\u5EA6\u6A21\u5F0F\u4E0B\u5DF2\u6682\u505C","status.surfaces":"{count} \u4E2A\u73BB\u7483\u754C\u9762","section.material":"\u6750\u8D28","enable.label":"\u73BB\u7483\u6750\u8D28","enable.hint":"\u5173\u95ED\u540E\u6062\u590D DSH \u539F\u672C\u7684\u5916\u89C2\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u901A\u900F","tint.tinted":"\u7740\u8272","section.wallpaper":"\u5899\u7EB8","wallpaper.auto":"\u81EA\u52A8","wallpaper.auto.hint":"\u6D4F\u89C8\u5668\u4E2D\u4F7F\u7528 Bay\uFF0CmacOS \u5E94\u7528\u4E2D\u4E0D\u4F7F\u7528\u5899\u7EB8\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52A8\u6001","wallpaper.live.hint":"\u7F13\u6162\u6D41\u52A8\u3002\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u4FDD\u6301\u9759\u6B62\uFF0C\u8017\u7535\u7565\u9AD8\u4E8E\u9759\u6001\u5899\u7EB8\u3002","wallpaper.none":"\u65E0","wallpaper.custom":"\u81EA\u5B9A\u4E49","wallpaper.url.label":"\u56FE\u7247\u5730\u5740","wallpaper.url.placeholder":"https://\u2026 \u6216 /\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84.jpg","wallpaper.url.invalid":"\u8BF7\u4F7F\u7528 http(s) \u5730\u5740\u3001\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84\u6216 base64 \u56FE\u7247\u6570\u636E\u5730\u5740\u3002","section.layout":"\u5E03\u5C40\u4E0E\u6548\u679C","sidebar.label":"\u4FA7\u680F","sidebar.floating":"\u60AC\u6D6E","sidebar.docked":"\u505C\u9760","code.label":"\u4EE3\u7801\u5757","code.hint":"\u73BB\u7483\u6548\u679C\u4F7F\u7528\u8F83\u6D53\u7684\u8272\u8C03\uFF0C\u4EE3\u7801\u4F9D\u7136\u6E05\u6670\u6613\u8BFB\u3002","code.glass":"\u73BB\u7483","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u6298\u5C04","refraction.hint":"\u73BB\u7483\u8FB9\u7F18\u5904\u7684\u80CC\u666F\u4F1A\u4EA7\u751F\u5F2F\u66F2\u3002","refraction.unavailable":"\u9700\u8981 Chrome\u3001Edge \u6216 DSH \u684C\u9762\u5E94\u7528\u7B49\u57FA\u4E8E Chromium \u7684\u6D4F\u89C8\u5668\u3002","highlights.label":"\u6307\u9488\u9AD8\u5149","highlights.hint":"\u67D4\u548C\u7684\u5149\u4F1A\u8DDF\u968F\u6307\u9488\u3002\u5728\u89E6\u6478\u5C4F\u4E0A\u4EE5\u53CA\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u5173\u95ED\u3002","section.compat":"\u517C\u5BB9\u6027","exclude.label":"\u4E0D\u5904\u7406\u7684\u5143\u7D20","exclude.hint":"\u4EE5\u9017\u53F7\u5206\u9694\u7684 CSS \u9009\u62E9\u5668\u3002\u5F53\u5176\u4ED6\u63D2\u4EF6\u5728\u73BB\u7483\u6548\u679C\u4E0B\u663E\u793A\u5F02\u5E38\u65F6\u4F7F\u7528\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u8BE5\u9009\u62E9\u5668\u65E0\u6548\uFF0C\u5DF2\u88AB\u5FFD\u7565\u3002","diag.title":"\u8BCA\u65AD\u4FE1\u606F","diag.surfaces":"\u73BB\u7483\u754C\u9762","diag.lenses":"\u6B63\u5728\u6298\u5C04","diag.tokens":"DSH \u4E3B\u9898\u4EE4\u724C","diag.tokens.ok":"\u5168\u90E8\u627E\u5230","diag.tokens.missing":"\u6B64\u7248\u672C DSH \u4E2D\u4E0D\u5B58\u5728\uFF1A{list}","diag.tokens.ambiguous":"\u65E0\u6CD5\u533A\u5206\uFF1A{list}","diag.scan":"\u626B\u63CF","diag.scan.value":"{batches} \u6B21\uFF0C\u6700\u957F {longest} \u6BEB\u79D2","diag.copy":"\u590D\u5236\u8BCA\u65AD\u4FE1\u606F","diag.copied":"\u5DF2\u590D\u5236","diag.copy.failed":"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u4E0B\u65B9\u6587\u672C\u8FDB\u884C\u590D\u5236\u3002","kind.sidebar":"\u4FA7\u680F","kind.composer":"\u8F93\u5165\u6846","kind.panel":"\u9762\u677F","kind.menu":"\u83DC\u5355","kind.smoke":"\u63D0\u793A\u4E0E\u5DE5\u5177\u63D0\u793A","kind.code":"\u4EE3\u7801\u5757","kind.backdrop":"\u80CC\u666F","save.local":"\u5F53\u524D\u8FDE\u63A5\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u66F4\u6539\u5C06\u5728\u9875\u9762\u91CD\u65B0\u52A0\u8F7D\u524D\u6709\u6548\u3002","save.error":"\u65E0\u6CD5\u4FDD\u5B58\u66F4\u6539\uFF0C\u5DF2\u6062\u590D\u539F\u6765\u7684\u503C\u3002","save.saving":"\u6B63\u5728\u4FDD\u5B58\u2026",footer:"dsh-glassui {version}\u3002\u975E\u5B98\u65B9\u63D2\u4EF6\uFF0C\u4E0E DeepSeek \u65E0\u5173\u3002"};var T=require("react");var l=require("react/jsx-runtime"),Ws=1e3;function Us(s){return(0,T.useSyncExternalStore)(s.subscribe,s.getSnapshot)}function Bs(s){return(0,T.useSyncExternalStore)(s.subscribe,s.revision),s.translate}function Hs(){let s=()=>document.body.hasAttribute("data-ds-dark-theme")?"dark":"light",[e,t]=(0,T.useState)(s);return(0,T.useEffect)(()=>{let i=new MutationObserver(()=>t(s()));return i.observe(document.body,{attributes:!0,attributeFilter:["data-ds-dark-theme"]}),()=>i.disconnect()},[]),e}function oe(s){return(0,l.jsxs)("div",{className:"glassui-row",children:[(0,l.jsxs)("div",{className:"glassui-row__text",children:[s.htmlFor?(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:s.htmlFor,children:s.label}):(0,l.jsx)("span",{className:"glassui-row__label",children:s.label}),s.hint?(0,l.jsx)("span",{className:"glassui-row__hint",children:s.hint}):null]}),(0,l.jsx)("div",{className:"glassui-row__control",children:s.children})]})}function Ve(s){return(0,l.jsx)("button",{type:"button",role:"switch",className:"glassui-switch","aria-checked":s.checked,"aria-label":s.label,disabled:s.disabled,onClick:()=>s.onChange(!s.checked)})}function $t(s){let e=[...s.currentTarget.querySelectorAll('[role="radio"]')],t=e.findIndex(a=>a===s.target);if(t<0)return;let i;switch(s.key){case"ArrowRight":case"ArrowDown":i=(t+1)%e.length;break;case"ArrowLeft":case"ArrowUp":i=(t+e.length-1)%e.length;break;case"Home":i=0;break;case"End":i=e.length-1;break;default:return}s.preventDefault(),e[i]?.focus(),e[i]?.click()}function Rt(s){let e=Math.max(0,s.options.findIndex(t=>t.value===s.value));return(0,l.jsxs)("div",{className:"glassui-segmented",role:"radiogroup","aria-label":s.label,onKeyDown:$t,style:{"--glassui-segments":s.options.length,"--glassui-index":e},children:[(0,l.jsx)("span",{className:"glassui-segmented__thumb","aria-hidden":"true"}),s.options.map(t=>(0,l.jsx)("button",{type:"button",role:"radio","aria-checked":t.value===s.value,tabIndex:t.value===s.value?0:-1,className:"glassui-segmented__option",onClick:()=>s.onChange(t.value),children:t.label},t.value))]})}function _t(s){let[e,t]=(0,T.useState)(s.value);(0,T.useEffect)(()=>t(s.value),[s.value]);let i=s.validate?e.trim()!==""&&!s.validate(e.trim()):!1,a=()=>{let r=e.trim();r===s.value||i||s.onCommit(r)};return(0,l.jsxs)("div",{className:"glassui-field",children:[(0,l.jsx)("input",{id:s.id,className:"glassui-input",value:e,placeholder:s.placeholder,spellCheck:!1,autoComplete:"off","aria-invalid":s.invalid||i,onChange:r=>t(r.target.value),onBlur:a,onKeyDown:r=>{r.key==="Enter"&&a()}}),s.invalid||i?(0,l.jsx)("span",{className:"glassui-field__error",role:"alert",children:s.message}):null]})}function je(s){if(s==="auto")return"bay";if(!(s==="none"||s==="custom"))return s}function zs(s){let{t:e}=s;return(0,l.jsx)("div",{className:"glassui-wallpapers",role:"radiogroup","aria-label":e("section.wallpaper"),onKeyDown:$t,children:Ce.map(t=>{let i=je(t),a=i?re(i,s.scheme):void 0,r=t!=="auto"&&i!==void 0&&ue(i),n=e(`wallpaper.${t}`);return(0,l.jsxs)("button",{type:"button",role:"radio","aria-checked":s.value===t,tabIndex:s.value===t?0:-1,"aria-label":r?`${n}, ${e("wallpaper.live")}`:n,className:"glassui-wallpaper","data-choice":t,onClick:()=>s.onChange(t),children:[(0,l.jsxs)("span",{className:"glassui-wallpaper__swatch","aria-hidden":"true",style:a?{backgroundImage:a}:void 0,children:[t==="auto"?(0,l.jsx)("span",{className:"glassui-wallpaper__badge",children:"A"}):null,r?(0,l.jsx)("span",{className:"glassui-wallpaper__badge","data-kind":"live",children:e("wallpaper.live")}):null]}),(0,l.jsx)("span",{className:"glassui-wallpaper__name",children:n})]},t)})})}function Vs(s){let{state:e,t}=s,{diagnostics:i}=e,[a,r]=(0,T.useState)("idle"),n=JSON.stringify({version:s.version,settings:{...e.settings,wallpaperUrl:e.settings.wallpaperUrl?"[configured]":""},diagnostics:i,userAgent:navigator.userAgent},null,2),o=de.filter(d=>i.surfaces[d]>0).map(d=>`${t(`kind.${d}`)} ${i.surfaces[d]}`).join(" \xB7 "),c=i.missingTokens.length===0&&i.ambiguousTokens.length===0?t("diag.tokens.ok"):[i.missingTokens.length>0?t("diag.tokens.missing",{list:i.missingTokens.join(", ")}):"",i.ambiguousTokens.length>0?t("diag.tokens.ambiguous",{list:i.ambiguousTokens.join(", ")}):""].filter(Boolean).join(" "),u=async()=>{try{await navigator.clipboard.writeText(n),r("done")}catch{r("failed")}};return(0,l.jsxs)("div",{className:"glassui-diagnostics",children:[(0,l.jsxs)("dl",{className:"glassui-facts",children:[(0,l.jsx)("dt",{children:t("diag.surfaces")}),(0,l.jsx)("dd",{children:o||"\u2014"}),(0,l.jsx)("dt",{children:t("diag.lenses")}),(0,l.jsx)("dd",{children:i.lenses}),(0,l.jsx)("dt",{children:t("diag.tokens")}),(0,l.jsx)("dd",{children:c}),(0,l.jsx)("dt",{children:t("diag.scan")}),(0,l.jsx)("dd",{children:t("diag.scan.value",{batches:i.scans.batches,longest:i.scans.longestMs.toFixed(1)})})]}),(0,l.jsx)("div",{className:"glassui-actions",children:(0,l.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{u()},children:t(a==="done"?"diag.copied":"diag.copy")})}),a==="failed"?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("p",{className:"glassui-note",children:t("diag.copy.failed")}),(0,l.jsx)("textarea",{className:"glassui-report",readOnly:!0,value:n,"aria-label":t("diag.title")})]}):null]})}function Lt(s){let e=Us(s.controller),t=Bs(s.locale),i=Hs(),a=(0,T.useId)(),{settings:r,diagnostics:n}=e,o=(d,h)=>s.controller.update(d,h);(0,T.useEffect)(()=>{let d=setInterval(()=>s.controller.refreshDiagnostics(),Ws);return()=>clearInterval(d)},[s.controller]);let c=de.filter(d=>d!=="backdrop").reduce((d,h)=>d+n.surfaces[h],0),u=n.running?`${t("status.on")} \xB7 ${t("status.surfaces",{count:c})}`:n.idle==="forced-colors"?t("status.forced"):t("status.off");return(0,l.jsxs)("div",{className:"glassui-page","data-testid":"glassui-settings",children:[(0,l.jsxs)("header",{className:"glassui-hero",children:[(0,l.jsx)("div",{className:"glassui-hero__art","aria-hidden":"true",style:{backgroundImage:re(je(r.wallpaper)??"bay",i)},children:(0,l.jsx)("span",{className:"glassui-hero__pane"})}),(0,l.jsxs)("div",{className:"glassui-hero__text",children:[(0,l.jsx)("h2",{className:"glassui-hero__title",children:t("title")}),(0,l.jsx)("p",{className:"glassui-hero__subtitle",children:t("subtitle")}),(0,l.jsx)("span",{className:"glassui-status","data-on":n.running,children:u})]})]}),e.save==="local"||e.save==="error"?(0,l.jsx)("p",{className:"glassui-banner",role:"status",children:t(e.save==="local"?"save.local":"save.error")}):null,(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${a}-material`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${a}-material`,children:t("section.material")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(oe,{label:t("enable.label"),hint:t("enable.hint"),children:(0,l.jsx)(Ve,{checked:r.enabled,label:t("enable.label"),onChange:d=>o("enabled",d)})}),(0,l.jsxs)("div",{className:"glassui-slider",children:[(0,l.jsxs)("div",{className:"glassui-slider__head",children:[(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:`${a}-tint`,children:t("tint.label")}),(0,l.jsx)("span",{className:"glassui-slider__value",children:r.tint})]}),(0,l.jsx)("input",{id:`${a}-tint`,type:"range",min:0,max:100,step:1,value:r.tint,className:"glassui-range",style:{"--glassui-progress":`${r.tint}%`},onChange:d=>o("tint",Number(d.target.value))}),(0,l.jsxs)("div",{className:"glassui-slider__ends","aria-hidden":"true",children:[(0,l.jsx)("span",{children:t("tint.clear")}),(0,l.jsx)("span",{children:t("tint.tinted")})]})]})]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${a}-wallpaper`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${a}-wallpaper`,children:t("section.wallpaper")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(zs,{value:r.wallpaper,scheme:i,t,onChange:d=>o("wallpaper",d)}),r.wallpaper==="auto"?(0,l.jsx)("p",{className:"glassui-note",children:t("wallpaper.auto.hint")}):null,r.wallpaper!=="auto"&&ue(je(r.wallpaper)??"bay")?(0,l.jsx)("p",{className:"glassui-note",children:t("wallpaper.live.hint")}):null,r.wallpaper==="custom"?(0,l.jsx)(oe,{label:t("wallpaper.url.label"),htmlFor:`${a}-url`,children:(0,l.jsx)(_t,{id:`${a}-url`,value:r.wallpaperUrl,placeholder:t("wallpaper.url.placeholder"),invalid:r.wallpaperUrl!==""&&!le(r.wallpaperUrl),message:t("wallpaper.url.invalid"),validate:le,onCommit:d=>o("wallpaperUrl",d)})}):null]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${a}-layout`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${a}-layout`,children:t("section.layout")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(oe,{label:t("sidebar.label"),children:(0,l.jsx)(Rt,{label:t("sidebar.label"),value:r.sidebar,options:[{value:"floating",label:t("sidebar.floating")},{value:"docked",label:t("sidebar.docked")}],onChange:d=>o("sidebar",d)})}),(0,l.jsx)(oe,{label:t("code.label"),hint:t("code.hint"),children:(0,l.jsx)(Rt,{label:t("code.label"),value:r.codeBlocks,options:[{value:"glass",label:t("code.glass")},{value:"solid",label:t("code.solid")}],onChange:d=>o("codeBlocks",d)})}),(0,l.jsx)(oe,{label:t("refraction.label"),hint:s.refractionSupported?t("refraction.hint"):t("refraction.unavailable"),children:(0,l.jsx)(Ve,{checked:r.refraction&&s.refractionSupported,label:t("refraction.label"),disabled:!s.refractionSupported,onChange:d=>o("refraction",d)})}),(0,l.jsx)(oe,{label:t("highlights.label"),hint:t("highlights.hint"),children:(0,l.jsx)(Ve,{checked:r.highlights,label:t("highlights.label"),onChange:d=>o("highlights",d)})})]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${a}-compat`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${a}-compat`,children:t("section.compat")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsxs)("div",{className:"glassui-stack",children:[(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:`${a}-exclude`,children:t("exclude.label")}),(0,l.jsx)("span",{className:"glassui-row__hint",children:t("exclude.hint")}),(0,l.jsx)(_t,{id:`${a}-exclude`,value:r.exclude,placeholder:t("exclude.placeholder"),invalid:n.invalidExclude,message:t("exclude.invalid"),onCommit:d=>o("exclude",d)})]}),(0,l.jsxs)("div",{className:"glassui-stack",children:[(0,l.jsx)("span",{className:"glassui-row__label",children:t("diag.title")}),(0,l.jsx)(Vs,{state:e,t,version:s.version})]})]})]}),(0,l.jsx)("footer",{className:"glassui-footer",children:e.save==="saving"?t("save.saving"):t("footer",{version:s.version})})]})}var Nt=`/* Settings page of dsh-glassui. Every color comes from DSH's theme tokens, so the
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
`;var Ct=require("react/jsx-runtime"),Ys=Ne,qs=[],Re="__DSH_GLASSUI_DEBUG__",Xs=880;function Js(){let s=globalThis[Je];return typeof s=="object"&&s!==null&&"settings"in s?W(s.settings):{...J}}function Qs(){let s=document.createElement("style");return s.setAttribute("data-glassui-settings-style",""),s.textContent=Nt,document.head.append(s),()=>s.remove()}function Zs(s){if(typeof document>"u")return;let e=St(window),t="0.1.2",i={},a=new Ae(window,e,()=>i.controller?.refreshDiagnostics()),r=new he(a,Js());i.controller=r,s.effect(()=>{let n={version:t,settings:()=>r.getSnapshot().settings,diagnostics:()=>a.diagnostics()};return globalThis[Re]=n,()=>{r.dispose(),a.dispose(),globalThis[Re]===n&&Reflect.deleteProperty(globalThis,Re)}},"dsh-glassui: engine"),s.inject(["configForms"],n=>{n.effect(()=>r.attach(n.configForms.get(Ne)),"dsh-glassui: settings sync")}),s.inject(["slots","locale"],n=>{n.effect(()=>n.locale.register(ze,{en:Tt,ja:kt,zh:At}),"dsh-glassui: copy"),n.effect(Qs,"dsh-glassui: settings styles");let o=n.locale.bind(ze),c=(d,h)=>o(d,h),u={subscribe:d=>n.locale.subscribe(d),revision:()=>n.locale.getSnapshot().revision,translate:c};n.slots.inject("settings.section",()=>n.slots.register({name:"settings.section",id:"glassui",order:Xs,label:()=>c("title")},()=>(0,Ct.jsx)(Lt,{controller:r,locale:u,version:t,refractionSupported:e.refraction})))})}

return module.exports;}});
