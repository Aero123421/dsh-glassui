/*! dsh-glassui 0.2.2 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */
window.__ModuleLoader__.load({id:"dsh-glassui",factory(require){const module={exports:{}};const exports=module.exports;
"use strict";var Ie=Object.defineProperty;var Ft=Object.getOwnPropertyDescriptor;var Kt=Object.getOwnPropertyNames;var Gt=Object.prototype.hasOwnProperty;var Ut=(a,e)=>{for(var t in e)Ie(a,t,{get:e[t],enumerable:!0})},Wt=(a,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Kt(e))!Gt.call(a,i)&&i!==t&&Ie(a,i,{get:()=>e[i],enumerable:!(s=Ft(e,i))||s.enumerable});return a};var Bt=a=>Wt(Ie({},"__esModule",{value:!0}),a);var la={};Ut(la,{DEBUG_GLOBAL:()=>Ne,apply:()=>oa,inject:()=>aa,name:()=>sa});module.exports=Bt(la);var Oe="dsh-glassui",at="__DSH_GLASSUI__",zt=["bay","sunrise","meadow","graphite","lagoon","dusk","dune","tide","aurora","bloom","prism"],Pe=["auto",...zt,"none","custom"],Ht=["floating","docked"],Vt=["glass","solid"],te=Object.freeze({enabled:!0,tint:35,wallpaper:"auto",wallpaperUrl:"",sidebar:"floating",codeBlocks:"glass",inlineCodeOpacity:72,refraction:!0,highlights:!0,exclude:""}),it=2048,jt=1e3,qt=/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;function ue(a){if(a.length===0||a.length>it||/["'()\\\s<>]/.test(a))return!1;if(qt.test(a)||a.startsWith("/")&&!a.startsWith("//")||a.startsWith("./")||a.startsWith("../"))return!0;try{let e=new URL(a);return e.protocol==="https:"||e.protocol==="http:"}catch{return!1}}function De(a,e,t){return typeof e=="string"&&a.includes(e)?e:t}function Me(a,e){return typeof a=="boolean"?a:e}function st(a,e,t){return typeof a=="string"&&a.length<=e?a.trim():t}function z(a){let e=typeof a=="object"&&a!==null?a:{},t=te,s=typeof e.tint=="number"&&Number.isFinite(e.tint)?Math.min(100,Math.max(0,Math.round(e.tint))):t.tint;return{enabled:Me(e.enabled,t.enabled),tint:s,wallpaper:De(Pe,e.wallpaper,t.wallpaper),wallpaperUrl:st(e.wallpaperUrl,it,t.wallpaperUrl),sidebar:De(Ht,e.sidebar,t.sidebar),codeBlocks:De(Vt,e.codeBlocks,t.codeBlocks),inlineCodeOpacity:typeof e.inlineCodeOpacity=="number"&&Number.isFinite(e.inlineCodeOpacity)?Math.min(100,Math.max(0,Math.round(e.inlineCodeOpacity))):t.inlineCodeOpacity,refraction:Me(e.refraction,t.refraction),highlights:Me(e.highlights,t.highlights),exclude:st(e.exclude,jt,t.exclude)}}function nt(a,e){return Object.keys(te).every(t=>a[t]===e[t])}var Yt="dsh-glassui:update",me=class{constructor(e,t,s,i){if(i===void 0)try{i=globalThis.sessionStorage}catch{}this.connection=e,this.settleSettings=t,this.settings=s,this.storage=i,this.listeners=new Set,this.state={status:"blocked",reason:"manager-unavailable"},this.generation=0,this.closed=!1,this.timer=null,this.profileKey=void 0,this.requestId=void 0}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));storageKey(){return this.profileKey?`${Yt}:${this.profileKey}`:void 0}selectProfile(e){let t=typeof e=="string"&&/^[a-f0-9]{64}$/.test(e)?e:void 0;if(t!==this.profileKey&&(this.profileKey=t,this.requestId=void 0,t))try{this.requestId=this.storage?.getItem(this.storageKey())||void 0}catch{}}publish(e){if(!this.closed){e.profileKey&&this.selectProfile(e.profileKey),this.state=e;for(let t of this.listeners)t()}}attach(e){return this.connection=e,this.load(),()=>{this.connection===e&&(this.connection=void 0,this.generation++,this.publish({...this.state,status:"blocked",reason:"manager-unavailable"}))}}async call(e,t={}){if(!this.connection)return{status:"blocked",reason:"manager-unavailable"};let s=await this.connection.rpc.call("/api",`dsh-glassui/update-${e}`,t);if(!s.ok){let i=new Error(s.error.code);throw i.rejected=!0,i}return s.value}async load(){if(this.closed)return;let e=++this.generation;clearTimeout(this.timer);try{let t=await this.call("status");if(this.closed||e!==this.generation)return;this.selectProfile(t.profileKey),t.requestId&&(this.requestId=t.requestId);let s=this.requestId?await this.call("reconcile",{requestId:this.requestId,profileKey:this.profileKey}):t;if(this.closed||e!==this.generation)return;if(s.requestId){this.requestId=s.requestId;try{this.storage?.setItem(this.storageKey(),s.requestId)}catch{}}this.publish(s),["preparing","installing"].includes(s.status)&&(this.timer=setTimeout(()=>{this.load()},800))}catch{e===this.generation&&this.publish({...this.state,status:this.requestId?"unknown":"blocked",reason:"network"})}}async check(){if(this.closed||["settling","checking","preparing","installing","starting","unknown"].includes(this.state.status))return;let e=++this.generation;this.publish({...this.state,status:"checking"});try{let t=await this.call("check");e===this.generation&&this.publish(t)}catch{e===this.generation&&this.publish({...this.state,status:"blocked",reason:"network"})}}async begin(){if(this.closed||!this.profileKey||this.state.status!=="available")return;let e=this.state.candidate,t=++this.generation;this.publish({...this.state,status:"settling"});let s;try{s=await this.settleSettings()}catch{!this.closed&&t===this.generation&&this.publish({...this.state,status:"failed",reason:"settings"});return}if(this.closed||t!==this.generation){s();return}this.requestId=crypto.randomUUID();try{this.storage?.setItem(this.storageKey(),this.requestId)}catch{}this.publish({...this.state,status:"starting"});try{let i=await this.call("begin",{candidateId:e.id,requestId:this.requestId,settings:this.settings(),profileKey:this.profileKey});if(this.closed||t!==this.generation)return;if(typeof i.requestId!="string")throw new Error("invalid request");this.requestId=i.requestId;try{this.storage?.setItem(this.storageKey(),i.requestId)}catch{}t===this.generation&&(this.publish({...this.state,...i}),await this.load())}catch(i){if(this.closed||t!==this.generation)return;if(i.rejected){this.requestId=void 0;try{this.storage?.removeItem(this.storageKey())}catch{}}t===this.generation&&this.publish({...this.state,status:i.rejected?"failed":"unknown",reason:i.message.endsWith("/busy")?"busy":i.message.endsWith("/profile")?"profile":i.message.endsWith("/settings")?"settings":"network"})}finally{s()}}dispose(){this.closed=!0,this.generation++,clearTimeout(this.timer),this.listeners.clear()}};var Xt=300,ve=class{engine;stored;pending=new Map;timers=new Map;form;detachForm;writing=!1;writeTask;updateLock=!1;failed=!1;disposed=!1;save="loading";state;listeners=new Set;constructor(e,t={...te}){this.engine=e,this.stored=t,this.state={settings:t,save:this.save,updating:this.updateLock,diagnostics:e.diagnostics()},e.apply(t)}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));attach(e){if(this.disposed)return()=>{};this.detachForm?.(),this.form=e;let t=()=>{if(this.disposed||this.form!==e)return;let r=e.getSnapshot();r.status==="ready"&&(this.stored=z(r.value)),this.recompute(),this.flush()},s=e.subscribe(t);t();let i=()=>{s(),this.form===e&&(this.form=void 0,this.detachForm=void 0,this.save="local",this.recompute())};return this.detachForm=i,i}update(e,t){if(this.disposed||this.updateLock)return;let s=z({...this.state.settings,[e]:t});this.pending.set(e,{value:s[e]}),this.failed=!1;let i=this.timers.get(e);i!==void 0&&clearTimeout(i),this.timers.set(e,setTimeout(()=>{this.timers.delete(e),this.flush()},Xt)),this.recompute()}refreshDiagnostics(){this.disposed||(this.state={...this.state,diagnostics:this.engine.diagnostics()},this.emit())}async settleForUpdate(){if(this.disposed||this.updateLock)throw new Error("settings");this.updateLock=!0,this.recompute();let e=()=>{this.updateLock=!1,this.recompute()};try{for(let t of this.timers.values())clearTimeout(t);if(this.timers.clear(),await this.flush(),!this.isActive()||this.failed||this.pending.size>0||this.save!=="saved")throw new Error("settings");return e}catch(t){throw e(),t}}flush(){return this.writeTask??=Promise.resolve().then(()=>this.writeReady()).finally(()=>{this.writeTask=void 0}),this.writeTask}async writeReady(){if(!(this.writing||this.disposed)){this.writing=!0;try{for(;this.isActive();){let e=this.form,t=e?.getSnapshot();if(!e||t?.status!=="ready"||!t.writable)break;let s=[...this.pending].find(([d])=>!this.timers.has(d));if(!s)break;let[i,r]=s,n=!1;this.recompute();try{n=await e.set(i,r.value)}catch(d){this.isActive()&&console.warn("dsh-glassui: saving a setting failed",d)}if(!this.isActive())return;if(this.form!==e||this.pending.get(i)!==r)continue;this.pending.delete(i),this.failed||=!n;let o=e.getSnapshot();o.status==="ready"&&(this.stored=z(o.value))}}finally{this.writing=!1,this.recompute()}}}isActive(){return!this.disposed}recompute(){if(this.disposed)return;let e=this.form?.getSnapshot();e?e.status==="loading"?this.save="loading":e.status==="unavailable"||!e.writable?this.save="local":this.pending.size>0||this.writing?this.save="saving":this.save=this.failed?"error":"saved":this.pending.size>0&&(this.save="local");let t=z({...this.stored,...Object.fromEntries([...this.pending].map(([i,r])=>[i,r.value]))}),s=!nt(t,this.state.settings);s&&this.engine.apply(t),!(!s&&this.save===this.state.save&&this.updateLock===this.state.updating)&&(this.state={settings:t,save:this.save,updating:this.updateLock,diagnostics:this.engine.diagnostics()},this.emit())}emit(){for(let e of this.listeners)e()}dispose(){this.disposed=!0,this.detachForm?.(),this.form=void 0;for(let e of this.timers.values())clearTimeout(e);this.timers.clear(),this.pending.clear(),this.listeners.clear()}};var E=String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`,Jt=new RegExp(String.raw`^rgba?\(\s*(${E})\s*,\s*(${E})\s*,\s*(${E})\s*(?:,\s*(${E})(%?)\s*)?\)$`,"i"),Qt=new RegExp(String.raw`^rgba?\(\s*(${E})\s+(${E})\s+(${E})\s*(?:/\s*(${E})(%?)\s*)?\)$`,"i"),Zt=new RegExp(String.raw`^color\(\s*srgb\s+(${E})\s+(${E})\s+(${E})\s*(?:/\s*(${E})(%?)\s*)?\)$`,"i");function se(a){return Math.min(255,Math.max(0,Math.round(a)))}function rt(a,e){if(a===void 0)return 1;let t=Number(a)/(e==="%"?100:1);return Math.min(1,Math.max(0,t))}function Fe(a){let e=a.trim(),t=Jt.exec(e)??Qt.exec(e);if(t)return{r:se(Number(t[1])),g:se(Number(t[2])),b:se(Number(t[3])),a:rt(t[4],t[5])};let s=Zt.exec(e);if(s)return{r:se(Number(s[1])*255),g:se(Number(s[2])*255),b:se(Number(s[3])*255),a:rt(s[4],s[5])}}function ot(a){let e=Math.round(a.a*1e3)/1e3;return e>=1?`rgb(${a.r} ${a.g} ${a.b})`:`rgb(${a.r} ${a.g} ${a.b} / ${e})`}function ye(a){return`${a.r},${a.g},${a.b},${Math.round(a.a*1e3)}`}var es=[1,-1,2,-2,3,-3],ts=["b","g","r"];function lt(a,e){let t=new Set(e.map(ye));for(let[,i]of a)i&&t.add(ye(i));let s=new Map;for(let[i,r]of a){if(!r)continue;let n;e:for(let o of ts)for(let d of es){let c=r[o]+d;if(c<0||c>255)continue;let u={...r,[o]:c};if(!t.has(ye(u))){n=u;break e}}n&&(t.add(ye(n)),s.set(i,n))}return s}var L="data-glassui",H="data-glassui-sidebar",O="data-glassui-wallpaper",P="data-glassui-static-wallpaper",ae="data-glassui-highlights",ie="data-glassui-raw",g="data-glassui-surface",N="data-glassui-fill",y="data-glassui-flat",A="data-glassui-echo",F="data-glassui-paint",ne="data-glassui-float",U="data-glassui-lens",I="data-glassui-ignore",$="data-glassui-excluded",D="data-glassui-material";var b="data-glassui-owned",V="--glassui-t",W="--glassui-inline-opacity",j="--glassui-wallpaper",q="--glassui-lx",Y="--glassui-ly",pe=["sidebar","composer","panel","menu","smoke","code","backdrop"],dt=[L,H,O,P,ae,ie,g,N,y,A,F,ne,U,$,b].map(a=>`[${a}]`).join(",");var w={input:"--dsw-specific-input-major",sidebar:"--dsw-specific-sidebar-fill",toast:"--dsw-alias-toast-bg",tooltip:"--dsw-alias-tooltip-bg",layer1:"--dsw-alias-bg-layer-1",layer2:"--dsw-alias-bg-layer-2",layer3:"--dsw-alias-bg-layer-3",floating:"--dsw-alias-button-floating-fill",elevated:"--dsw-alias-button-elevated-fill",overlay:"--dsw-alias-bg-overlay",base:"--dsw-alias-bg-base",code:"--dsw-alias-markdown-code-block",codeBanner:"--dsw-alias-markdown-code-block-banner"},M=Object.keys(w),ct=new Set(["code","codeBanner"]),re="--dsw-alias-markdown-inline-code",he=[re,"--dsw-alias-markdown-citation","--dsw-alias-markdown-tag","--dsw-alias-markdown-placeholder","--dsw-specific-bubble","--dsw-specific-selector","--dsw-specific-tip","--dsw-specific-login-input","--dsw-specific-sidebar-nav-item-active","--dsw-specific-sidebar-nav-item-hover","--dsw-alias-bg-module-platform","--dsw-alias-bg-multi-select","--dsw-alias-bg-document-preview","--dsw-alias-interactive-bg-hover-solid","--dsw-alias-button-primary-dimmed"],oe={panel:"--dsw-elevation-panel",prominent:"--dsw-elevation-prominent",soft:"--dsw-elevation-soft"},Ke="--dsw-elevation-stroke",X={panel:"rgb(1 0 61 / 0)",prominent:"rgb(1 0 62 / 0)",soft:"rgb(1 0 63 / 0)"},k={fill:"--dsw-menu-surface-fill",filter:"--dsw-menu-backdrop-filter",overlayFill:"--dsw-specific-menu",groupHeader:"--dsw-alias-menu-group-header-fill"},B="data-ds-dark-theme",Ge="data-platform",Ue="data-markdown-variant",ba=[...Object.values(w),...he,...Object.values(oe),Ke,...Object.values(k)];var ss={bay:{light:{bg:["#b9d4ff","#eef4ff"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,40,120,0.16)",ribbons:[["#9cc6ff","#cfe6ff"],["#5f9df7","#97ccff"],["#4cc0e8","#3d8ff2"],["#2f72e8","#6aaeff"],["#1d4fc4","#4b8cf0"]]},dark:{bg:["#040a1e","#0b1838"],glow:"rgba(80,140,255,0.35)",crest:"rgba(170,210,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#183a8c","#2c63c6"],["#1d55b8","#3a8ae0"],["#0f7fa6","#2266c8"],["#2a3fb0","#4b78e0"],["#101f66","#2647a8"]]}},sunrise:{light:{bg:["#ffd9bf","#fff1e8"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(120,30,60,0.14)",ribbons:[["#ffc49a","#ffe0c2"],["#ff9a8c","#ffc49a"],["#f084b8","#ff9e94"],["#b58cf0","#ef8cc4"],["#7e6ee6","#b48cf0"]]},dark:{bg:["#16070c","#24101e"],glow:"rgba(255,120,90,0.3)",crest:"rgba(255,200,170,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#8a3a1e","#c26434"],["#962c44","#c4563a"],["#82306e","#b0425a"],["#55348e","#8a3a7c"],["#2c2470","#5a3490"]]}},meadow:{light:{bg:["#d2f0dc","#f1faf3"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,80,50,0.14)",ribbons:[["#bfeac8","#e0f6e2"],["#86d8a6","#bdebc8"],["#4fc4a6","#86d89a"],["#2fa59a","#5ccaa0"],["#1f7f86","#3aa894"]]},dark:{bg:["#03120e","#08201a"],glow:"rgba(80,220,160,0.25)",crest:"rgba(170,255,210,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#185c3c","#2a8a56"],["#11704e","#2a9a66"],["#0c6a64","#1a8a6e"],["#0e5260","#127068"],["#08343e","#0e5056"]]}},graphite:{light:{bg:["#dcdfe5","#f4f5f7"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(0,0,0,0.12)",ribbons:[["#d2d6dd","#e8eaee"],["#b6bbc5","#d4d8de"],["#9aa0ac","#bcc1c9"],["#7e8492","#a2a8b2"],["#626876","#868c98"]]},dark:{bg:["#0c0d0f","#1a1b1f"],glow:"rgba(255,255,255,0.12)",crest:"rgba(255,255,255,0.22)",shade:"rgba(0,0,0,0.5)",ribbons:[["#3a3d44","#4e525a"],["#2e3138","#43474f"],["#25282e","#373a42"],["#1d1f24","#2c2f35"],["#141519","#22242a"]]}},lagoon:{light:{bg:["#bdeff0","#effbfb"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(0,90,100,0.15)",ribbons:[["#a6eae6","#d4f6f2"],["#62d6d2","#9fe9e2"],["#2fc0c8","#5fd8cf"],["#1a9fb6","#3cc2c4"],["#0d7a98","#1fa2b2"]]},dark:{bg:["#021317","#06252b"],glow:"rgba(60,220,220,0.25)",crest:"rgba(160,255,250,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0d5a5e","#178a86"],["#0b6e72","#16a0a0"],["#08707e","#0f8e96"],["#075866","#0b7682"],["#043a46","#08525e"]]}},dusk:{light:{bg:["#e4d7ff","#fbf1ff"],glow:"rgba(255,255,255,0.7)",crest:"rgba(255,255,255,0.7)",shade:"rgba(70,20,110,0.15)",ribbons:[["#d9c4ff","#f0e2ff"],["#b79cff","#dcc0ff"],["#e39cdc","#c3a0ff"],["#f08cb4","#d896e8"],["#8a6cf0","#cf86d8"]]},dark:{bg:["#0c0718","#1a0f2e"],glow:"rgba(190,120,255,0.28)",crest:"rgba(230,190,255,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#3a2a7a","#5a3c9c"],["#4c2a86","#7a3a96"],["#6a2c80","#9a3c78"],["#3c2470","#6a2e86"],["#1e1650","#3c2070"]]}},dune:{light:{bg:["#f6e6cf","#fdf7ee"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(110,60,10,0.14)",ribbons:[["#f2dcb8","#faecd6"],["#e9c590","#f4dbb2"],["#dea872","#ecc48e"],["#cf8c5c","#e2a876"],["#b46e48","#cf8c60"]]},dark:{bg:["#120c06","#22170c"],glow:"rgba(255,180,100,0.22)",crest:"rgba(255,220,170,0.26)",shade:"rgba(0,0,0,0.5)",ribbons:[["#5a3e22","#7a5630"],["#6a4426","#8c5c32"],["#74462a","#966036"],["#5e3622","#7c4a2c"],["#3a2216","#58321e"]]}},tide:{light:{bg:["#c6e2ff","#f2f8ff"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(10,50,130,0.16)",ribbons:[["#9ee6ff","#d0f4ff"],["#5fcff5","#9ee6ff"],["#3aa8f0","#5fd0f0"],["#2f7ce6","#4fb0f2"],["#2552c8","#3c88e8"]]},dark:{bg:["#020b1a","#071a33"],glow:"rgba(60,170,255,0.32)",crest:"rgba(150,220,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0f4a7a","#1d74a8"],["#0e5f8e","#1f8ac0"],["#0b6f9a","#1a5fb0"],["#173c94","#2c66c8"],["#0b1f5a","#183c94"]]}}},as=[[.14,.2,760],[.76,.16,820],[.5,.86,860],[.94,.7,640],[.26,.92,600]],ut=[[.5,.08,720],[.08,.58,700],[.92,.5,700],[.32,.98,620],[.72,.96,640]],is={prism:{light:{geometry:ut,bg:["#f6f3ff","#fdf8fb"],glow:"rgba(255,255,255,0.6)",blobs:[["#ff9ad5",.8],["#8fd3ff",.85],["#ffe27a",.7],["#a6f0c6",.75],["#c3a2ff",.75]]},dark:{geometry:ut,bg:["#07061a","#0d0a22"],glow:"rgba(160,120,255,0.16)",blobs:[["#ff3fa4",.55],["#2d9cff",.6],["#ffb800",.35],["#20d38a",.5],["#8b5cff",.55]]}},aurora:{light:{bg:["#e6efff","#f6f1ff"],glow:"rgba(255,255,255,0.55)",blobs:[["#5ec8ff",.9],["#a98bff",.8],["#4fe0b8",.75],["#7aa6ff",.8],["#ffb3dc",.6]]},dark:{bg:["#03061a","#080b26"],glow:"rgba(80,120,255,0.18)",blobs:[["#14c995",.7],["#2f55ff",.75],["#7d3cff",.65],["#00a6cc",.6],["#ff3d93",.38]]}},bloom:{light:{bg:["#fff0e6","#fff8f2"],glow:"rgba(255,255,255,0.55)",blobs:[["#ff9a6b",.85],["#ff86ba",.75],["#ffc94d",.7],["#b893ff",.65],["#ff7676",.5]]},dark:{bg:["#10060d","#1b0a16"],glow:"rgba(255,120,90,0.16)",blobs:[["#ff5a2a",.6],["#e0307f",.65],["#ffa600",.38],["#6f3cff",.6],["#ff3a3a",.38]]}}},We={bay:{style:"ribbons"},sunrise:{style:"ribbons"},meadow:{style:"ribbons"},graphite:{style:"ribbons"},lagoon:{style:"ribbons"},dusk:{style:"ribbons"},dune:{style:"ribbons"},tide:{style:"ribbons",groups:[{items:[0,1,2],motion:{duration:36,x:1.2,y:2.4,scale:1.02}},{items:[3,4],motion:{duration:26,x:-1.8,y:-2.2,scale:1}}]},aurora:{style:"blobs",groups:[{items:[0,3],motion:{duration:48,x:7,y:5,scale:1.12}},{items:[1,4],motion:{duration:60,x:-8,y:6,scale:.9}},{items:[2],motion:{duration:40,x:5,y:-7,scale:1.15}}]},prism:{style:"blobs",groups:[{items:[0,2],motion:{duration:56,x:6,y:7,scale:1.1}},{items:[1,3],motion:{duration:46,x:7,y:-6,scale:1.12}},{items:[4],motion:{duration:38,x:-8,y:-5,scale:.92}}]},bloom:{style:"blobs",groups:[{items:[0,3],motion:{duration:52,x:-6,y:6,scale:1.14}},{items:[1,4],motion:{duration:44,x:7,y:-5,scale:.9}},{items:[2],motion:{duration:64,x:-5,y:-6,scale:1.1}}]}},T=1600,R=1e3,pt=12;function S(a){return String(Math.round(a*10)/10)}function ns(a){let e=R*(.26+a*.135),t=R*(.075+a*.012),s=.9+a*.28,i=2.1+a*.45,r=a*1.15+.4,n=[];for(let o=0;o<=pt;o++){let d=-T*.06+T*1.12*o/pt,c=d/T,u=e+t*Math.sin(s*c*Math.PI*2+r)+t*.38*Math.sin(i*c*Math.PI*2+r*1.7)-c*R*.1;n.push([d,u])}return n}function rs(a){let e=o=>a[Math.max(0,Math.min(a.length-1,o))]??[0,0],[t,s]=e(0),i=`M${S(t)} ${S(s)}`;for(let o=0;o<a.length-1;o++){let[d,c]=e(o-1),[u,f]=e(o),[p,v]=e(o+1),[C,fe]=e(o+2),be=u+(p-d)/6,Q=f+(v-c)/6,Z=p-(C-u)/6,ee=v-(fe-f)/6;i+=`C${S(be)} ${S(Q)} ${S(Z)} ${S(ee)} ${S(p)} ${S(v)}`}let r=T*1.06,n=-T*.06;return`${i}L${S(r)} ${R+120}L${S(n)} ${R+120}Z`}function Be(){return{defs:new Map,body:[]}}var xe=.15;function we(a,e=0){let t=new Map;for(let{defs:i}of a)for(let[r,n]of i)t.set(r,n);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[-T*e,-R*e,T*(1+2*e),R*(1+2*e)].map(S).join(" ")}" preserveAspectRatio="xMidYMid slice"><defs>${[...t.values()].join("")}</defs>${a.flatMap(i=>i.body).join("")}</svg>`}function ht(a,e){let t=Be();return t.defs.set("b",`<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a[0]}"/><stop offset="1" stop-color="${a[1]}"/></linearGradient>`),t.defs.set("g",`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${T*.22}" cy="${R*.05}" r="${T*.7}"><stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${e}" stop-opacity="0"/></radialGradient>`),t.body.push(`<rect width="${T}" height="${R}" fill="url(#b)"/>`,`<rect width="${T}" height="${R}" fill="url(#g)"/>`),t}function os(a,e){let[t,s]=a.ribbons[e]??["#000","#000"],i=Be();return i.defs.set("s",'<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>'),i.defs.set("f",'<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>'),i.defs.set("c",'<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>'),i.defs.set(`r${e}`,`<linearGradient id="r${e}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${T}" y2="${R*.4}"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="${s}"/></linearGradient>`),i.defs.set(`p${e}`,`<path id="p${e}" d="${rs(ns(e))}"/>`),i.body.push(`<use href="#p${e}" fill="${a.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,`<use href="#p${e}" fill="url(#r${e})" fill-opacity="0.92" filter="url(#f)"/>`,`<use href="#p${e}" fill="none" stroke="${a.crest}" stroke-width="2.5" filter="url(#c)"/>`),i}function ls(a,e,t){let[s,i]=a.blobs[e]??["#000",0],[r,n,o]=(a.geometry??as)[e]??[.5,.5,400],d=(t?1-r:r)*T,c=n*R,u=Be();return u.defs.set(`o${e}`,`<radialGradient id="o${e}"><stop offset="0" stop-color="${s}" stop-opacity="${i}"/><stop offset="0.45" stop-color="${s}" stop-opacity="${S(i*.55)}"/><stop offset="1" stop-color="${s}" stop-opacity="0"/></radialGradient>`),u.body.push(`<circle cx="${S(d)}" cy="${S(c)}" r="${o}" fill="url(#o${e})"/>`),u}function ft(a,e){if(We[a].style==="blobs"){let s=is[a][e];return[ht(s.bg,s.glow),...s.blobs.map((i,r)=>ls(s,r,a==="bloom"))]}let t=ss[a][e];return[ht(t.bg,t.glow),...t.ribbons.map((s,i)=>os(t,i))]}function ge(a){return We[a].groups!==void 0}function ds(a,e){return we(ft(a,e))}function bt(a,e){let t=We[a].groups,s=ft(a,e);if(!t)return[{svg:we(s),motion:void 0}];let[i]=s,r=[{svg:we(i?[i]:[]),motion:void 0}];for(let n of t){let o=n.items.map(d=>s[d+1]).filter(d=>d!==void 0);r.push({svg:we(o,xe),motion:n.motion})}return r}function ze(a){return`data:image/svg+xml,${a.replace(/"/g,"'").replace(/\s+/g," ").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E")}`}function Se(a){return`url("${ze(a)}")`}var gt=new Map;function le(a,e){let t=`${a}|${e}`,s=gt.get(t);return s===void 0&&(s=Se(ds(a,e)),gt.set(t,s)),s}function mt(a,e,t){let s="<rect width='100%' height='100%' rx='18' ry='18' fill='none'",i=["<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>","<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",`<stop offset='0' stop-color='white' stop-opacity='${a}'/>`,`<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(a*20)/100}'/>`,"<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",`<stop offset='1' stop-color='white' stop-opacity='${e}'/>`,"</linearGradient>",`${s} stroke='black' stroke-opacity='${t}' stroke-width='1'/>`,`${s} stroke='url(#r)' stroke-width='3'/>`,"</svg>"].join("");return`url("${ze(i)}")`}var x=`:root[${L}]`,G=`${x} body`,vt=`${x} body[${B}]`,K=`:not([${$}]):not([${$}] *)`,_=`${G} [${g}]${K}`,He=`${_}:not([${g}="backdrop"]):not([${y}])`;function h(a,e){let t=Object.entries(e).map(([s,i])=>`  ${s}: ${i};`).join(`
`);return`${a} {
${t}
}`}var cs={[V]:.35,[W]:.72,"--glassui-floor":0,"--glassui-tt":`max(var(${V}), var(--glassui-floor))`,"--glassui-blur":"calc(6px + var(--glassui-tt) * 22px)","--glassui-filter":"blur(var(--glassui-blur)) saturate(180%) brightness(1.04)","--glassui-fill-a":"calc(0.16 + var(--glassui-tt) * 0.62)","--glassui-dense-a":"calc(0.52 + var(--glassui-tt) * 0.42)","--glassui-smoke-a":"calc(0.5 + var(--glassui-tt) * 0.42)","--glassui-code-a":"calc(0.4 + var(--glassui-tt) * 0.4)","--glassui-canvas-a":"calc(0.4 + var(--glassui-tt) * 0.5)","--glassui-inset":"8px","--glassui-radius":"18px"},us={"--glassui-glass-rgb":"255 255 255","--glassui-smoke-rgb":"30 30 32","--glassui-rim-hi":.9,"--glassui-rim-lo":.38,"--glassui-edge":"rgb(0 0 0 / 0.08)","--glassui-drop":"rgb(0 0 0 / 0.14)","--glassui-contact":"rgb(0 0 0 / 0.2)","--glassui-sheen":.2,"--glassui-light-a":.3,"--glassui-pane-rim":mt(.95,.5,.1),[re]:`rgb(245 246 248 / max(var(${W}), var(--glassui-floor)))`,[k.fill]:"rgb(250 250 252 / calc(0.5 + var(--glassui-tt) * 0.42))",[k.overlayFill]:"rgb(250 250 252 / calc(0.86 + var(--glassui-tt) * 0.12))",[k.groupHeader]:"rgb(250 250 252 / calc(0.8 + var(--glassui-tt) * 0.18))"},ps={"--glassui-glass-rgb":"40 40 44","--glassui-smoke-rgb":"44 44 48","--glassui-rim-hi":.32,"--glassui-rim-lo":.12,"--glassui-edge":"rgb(0 0 0 / 0.5)","--glassui-drop":"rgb(0 0 0 / 0.42)","--glassui-contact":"rgb(0 0 0 / 0.5)","--glassui-sheen":.07,"--glassui-light-a":.16,"--glassui-pane-rim":mt(.4,.18,.5),[re]:`rgb(48 48 54 / max(var(${W}), var(--glassui-floor)))`,[k.fill]:"rgb(44 44 48 / calc(0.46 + var(--glassui-tt) * 0.44))",[k.overlayFill]:"rgb(44 44 48 / calc(0.86 + var(--glassui-tt) * 0.12))",[k.groupHeader]:"rgb(44 44 48 / calc(0.8 + var(--glassui-tt) * 0.18))"},hs={"--glassui-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","0 0 0 0.5px var(--glassui-edge)"].join(", "),"--glassui-contained-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","inset 0 0 0 0.5px var(--glassui-edge)"].join(", "),[k.filter]:"var(--glassui-filter)",...Object.fromEntries(M.map(a=>[`--glassui-src-${a}`,`var(${w[a]})`]))};function Ve(a,e,t){return`var(${Ke}), var(--glassui-rim), ${e}, ${t}, 0 0 0 0 ${a}`}var gs={[oe.panel]:Ve(X.panel,"0 2px 6px -2px rgb(0 0 0 / 0.06)","0 10px 28px -10px var(--glassui-drop)"),[oe.prominent]:Ve(X.prominent,"0 3px 10px -3px rgb(0 0 0 / 0.08)","0 18px 44px -14px var(--glassui-drop)"),[oe.soft]:Ve(X.soft,"0 4px 16px -6px rgb(0 0 0 / 0.06)","0 14px 36px -16px var(--glassui-drop)")},fs=Object.fromEntries(["panel","prominent","soft"].map(a=>[oe[a],["var(--glassui-contained-rim)","0 1px 2px -3px rgb(0 0 0 / 0.12)","0 16px 22px -33px var(--glassui-contact)",`0 0 0 0 ${X[a]}`].join(", ")])),bs="linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)",ms=`radial-gradient(240px circle at var(${q}) var(${Y}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`,vs=[`@property ${q} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,`@property ${Y} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,"@property --glassui-light { syntax: '*'; inherits: false; }","@property --glassui-pane { syntax: '*'; inherits: false; }","@property --glassui-pane-size { syntax: '*'; inherits: false; }"].join(`
`);function ys(){let a=[h(`${_}[${g}="sidebar"], ${_}[${g}="composer"]`,{"--glassui-pct":"calc(var(--glassui-fill-a) * 100%)"}),h(`${_}[${g}="panel"], ${_}[${g}="menu"]`,{"--glassui-pct":"calc(var(--glassui-dense-a) * 100%)"}),h(`${_}[${g}="smoke"]`,{"--glassui-pct":"calc(var(--glassui-smoke-a) * 100%)"}),h(`${_}[${g}="code"]`,{"--glassui-pct":"calc(var(--glassui-code-a) * 100%)"}),h(`${_}[${g}="backdrop"], ${_}[${y}]`,{"--glassui-pct":"0%"}),h(He,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)"}),h(`${G} [${A}]`,{"background-color":"transparent"}),h(`${He}[${g}="code"]`,{"box-shadow":"var(--glassui-rim)"})],e=t=>`color-mix(in srgb, var(--glassui-src-${t}) var(--glassui-pct, 100%), transparent)`;for(let t of M)a.push(h(`${_}[${N}="${t}"]`,{[w[t]]:e(t)}));return a.push(h(`${_}[${g}="code"][${N}="code"]`,{[w.codeBanner]:"transparent"})),a.push(h(`${He}[${F}]`,{"--glassui-pane":"none","--glassui-pane-size":"100% 100%","background-image":`var(--glassui-light, none), var(--glassui-pane, none), ${bs}`,"background-size":"auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)","background-position":"center","background-repeat":"no-repeat"}),h(`${x}[${ae}] body [${g}][${F}]`,{"--glassui-light":ms}),h(`${x}[${H}="floating"] body [${g}="sidebar"][${ne}]:not([${y}])`,{"clip-path":"inset(var(--glassui-inset) round var(--glassui-radius))","--glassui-pane":"var(--glassui-pane-rim)","--glassui-pane-size":"calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))"})),a}function ws(){let a=`${G} [${D}]${K}`;return[h(`${a}:not([${D}="none"])`,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)","box-shadow":"var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)"}),h(`${a}[${D}="regular"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))"}),h(`${a}[${D}="dense"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))"}),h(`${a}[${D}="smoke"]`,{"background-color":"rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))"})]}function xs(){return[h(`${x}[${O}]`,{background:`var(${j}) center / cover no-repeat fixed`}),h(`${x}[${O}][${P}]`,{"background-image":"linear-gradient(transparent, transparent)"}),h(`${x}[${P}] > [${b}="static-wallpaper"]`,{position:"fixed",inset:0,"z-index":-1,"pointer-events":"none",contain:"strict",transform:"translateZ(0)","background-position":"center","background-size":"cover","background-repeat":"no-repeat"}),h(`${x}[${O}] body${K}`,{"background-color":"color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"})]}function Ss(){return[`@media (prefers-contrast: more) {
${[h(x,{"--glassui-floor":.85}),h(G,{"--glassui-edge":"rgb(0 0 0 / 0.45)"}),h(vt,{"--glassui-edge":"rgb(255 255 255 / 0.35)"})].join(`
`)}
}`,`@media (prefers-reduced-transparency: reduce) {
${h(x,{"--glassui-floor":1})}
}`,`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${h(x,{"--glassui-floor":.9})}
}`].join(`
`)}function yt(){return`${["/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",vs,"@media screen and (forced-colors: none) {",h(x,cs),h(`${G}${K}`,{...us,...hs}),h(`${vt}${K}`,ps),h(`${G}${K}, ${G} *${K}`,gs),h(`${_}[${U}]`,{...fs,"box-shadow":"var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"}),...ys(),...ws(),...xs(),Ss(),"}"].join(`
`)}
`}var ks=new Set(["layer1","layer2","layer3","floating","elevated","overlay","base"]),Ts=.5,Es=.25,Rs=160;function _s(a,e){if(a!=="none"){for(let t of["prominent","panel","soft"])if(e[t]!==""&&a.includes(e[t]))return t}}function J(a,e,t,s=!1){return{kind:a,fill:e,paint:a!=="backdrop"&&t.backgroundImage==="none",float:s}}function wt(a,e){if(a.managed)return;let t=e.fills.get(a.background),s=_s(a.boxShadow,e.elevation),i=a.area>Ts;if(a.backdropFilter!=="none"&&a.backdropFilter===e.menuFilter)return i?void 0:J("menu",void 0,a);switch(t){case"sidebar":return i?J("backdrop",t,a):J("sidebar",t,a,a.width>=Rs&&a.boxShadow==="none"&&a.backgroundImage==="none");case"input":return J(i?"backdrop":"composer",t,a);case"toast":case"tooltip":return i?void 0:J("smoke",t,a);case"code":case"codeBanner":return i?void 0:{kind:"code",fill:t,paint:!1,float:!1};case void 0:return;default:break}if(ks.has(t)&&(s==="panel"||s==="prominent"))return J("panel",t,a);if(t==="base"&&s===void 0&&a.area>=Es)return J("backdrop",t,a)}var As=[...Object.values(w),...Object.values(k),re],ke=class{doc;sheet;entries=new Map;nextId=1;initialized=!1;constructor(e,t){this.doc=e,this.sheet=t}sync(e,t){let s=e!==""||!this.initialized?[...this.doc.querySelectorAll(`[${I}]${e?`, ${e}`:""}`)]:[...[...this.entries.keys()].filter(d=>d.hasAttribute(I)),...t.flatMap(d=>[...d.hasAttribute(I)?[d]:[],...d.children.length>0?[...d.querySelectorAll(`[${I}]`)]:[]])];this.initialized=!0;let i=new Set(s.filter(d=>this.doc.body.contains(d)&&!d.closest(`[${b}]`))),r=[];for(let d of this.entries.keys())i.has(d)||(d.removeAttribute($),this.entries.delete(d),r.push(d));for(let d of i){if(this.entries.has(d))continue;let c=this.nextId++;this.entries.set(d,{id:c,css:""}),d.setAttribute($,String(c)),r.push(d)}let n=[...this.entries].filter(([d,c])=>c.css===""||t.some(u=>u.contains(d))),o=this.doc.defaultView;if(n.length>0&&o){let d=this.doc.documentElement,c=d.getAttribute(L);d.removeAttribute(L);try{for(let[u,f]of n){let p=o.getComputedStyle(u),v=As.map(C=>`  ${C}: ${p.getPropertyValue(C).trim()||"initial"};`);f.css=`:where(${x} [${$}="${f.id}"]) {
${v.join(`
`)}
}`}}finally{c!==null&&d.setAttribute(L,c)}}return this.sheet.setExclusions([...this.entries.values()].map(d=>d.css).join(`
`)),r}dispose(){for(let e of this.entries.keys())e.removeAttribute($);this.entries.clear(),this.initialized=!1,this.sheet.setExclusions("")}};var xt=`[${g}][${F}]:not([${y}]):not([${g}="backdrop"])`,Te=class{doc;enabled=!1;frame=0;x=0;y=0;target=null;lit=new Set;constructor(e){this.doc=e}move=e=>{e.pointerType!=="mouse"&&e.pointerType!=="pen"||(this.x=e.clientX,this.y=e.clientY,this.target=e.target instanceof Element?e.target:null,this.schedule())};out=e=>{e.relatedTarget===null&&(this.target=null,this.schedule())};schedule(){let e=this.doc.defaultView;this.frame===0&&e&&(this.frame=e.requestAnimationFrame(this.paint))}paint=()=>{this.frame=0;let e=new Set;for(let s=this.target?.closest(xt);s;s=s.parentElement?.closest(xt))s instanceof HTMLElement&&e.add(s);let t=[...e].map(s=>{let i=s.getBoundingClientRect();return{element:s,x:`${Math.round(this.x-i.left-s.clientLeft)}px`,y:`${Math.round(this.y-i.top-s.clientTop)}px`}});for(let s of this.lit)e.has(s)||this.clear(s);for(let{element:s,x:i,y:r}of t)s.style.getPropertyValue(q)!==i&&s.style.setProperty(q,i),s.style.getPropertyValue(Y)!==r&&s.style.setProperty(Y,r);this.lit.clear();for(let s of e)this.lit.add(s)};clear(e){e.style.removeProperty(q),e.style.removeProperty(Y)}setEnabled(e){if(e===this.enabled)return;this.enabled=e;let t=this.doc.defaultView,s=this.doc.documentElement;if(e){s.setAttribute(ae,""),t?.addEventListener("pointermove",this.move,{passive:!0,capture:!0}),this.doc.addEventListener("pointerout",this.out,{passive:!0});return}t?.removeEventListener("pointermove",this.move,{capture:!0}),this.doc.removeEventListener("pointerout",this.out),this.frame!==0&&t?.cancelAnimationFrame(this.frame),this.frame=0,this.target=null;for(let i of this.lit)this.clear(i);this.lit.clear(),s.removeAttribute(ae)}dispose(){this.setEnabled(!1)}};function $s(a){let e=[],t=0,s=0;for(let i=0;i<a.length;i++){let r=a[i];r==="("?t++:r===")"?t=Math.max(0,t-1):r===","&&t===0&&(e.push(a.slice(s,i)),s=i+1)}return e.push(a.slice(s)),e.map(i=>i.trim()).filter(i=>i.length>0)}function Cs(a){let e="",t=0;for(let s of a)s==="("?t++:s===")"?t=Math.max(0,t-1):t===0&&(e+=s);return e}var Ls=/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)px/gi;function Ns(a){let e=0,t=0;if(a.trim()==="none")return{x:e,y:t};for(let s of $s(a)){let i=Cs(s);if(/\binset\b/i.test(i))continue;let r=[...i.matchAll(Ls)].map(f=>Number(f[1]));if(r.length<2)continue;let[n=0,o=0,d=0,c=0]=r,u=Math.max(0,d)*1.5+c;e=Math.max(e,u-n),t=Math.max(t,u-o)}return{x:e,y:t}}function St(a){let e=Ns(a.boxShadow),t=0;a.outlineStyle!=="none"&&(t=Math.max(0,(parseFloat(a.outlineWidth)||0)+(parseFloat(a.outlineOffset)||0)));let s=i=>Math.max(0,Math.ceil(i-.001));return{x:s(Math.max(e.x,t)),y:s(Math.max(e.y,t))}}function kt(a,e){return Math.max(6,Math.min(Math.min(a,e)*.34,28))}function Tt(a){return Math.round(a*1.7)}function Et({width:a,height:e,radius:t,bezel:s}){let i=new Uint8ClampedArray(a*e*4),r=a/2,n=e/2,o=Math.max(0,Math.min(t,r,n));for(let d=0;d<e;d++)for(let c=0;c<a;c++){let u=c+.5-r,f=d+.5-n,p=Math.abs(u)-(r-o),v=Math.abs(f)-(n-o),C=-(Math.hypot(Math.max(p,0),Math.max(v,0))+Math.min(Math.max(p,v),0)-o),fe=0,be=0;if(C>0&&C<s){let Z,ee;if(p>0&&v>0){let tt=Math.hypot(p,v)||1;Z=p/tt*Math.sign(u),ee=v/tt*Math.sign(f)}else p>v?(Z=Math.sign(u),ee=0):(Z=0,ee=Math.sign(f));let et=Math.pow(1-C/s,2.4);fe=-Z*et,be=-ee*et}let Q=(d*a+c)*4;i[Q]=128+fe*127,i[Q+1]=128+be*127,i[Q+2]=128,i[Q+3]=255}return i}function Rt(a,e){if(a.size===0)return"";let t=e?`[${B}]`:`:not([${B}])`,s=[...a].map(([i,r])=>`  ${w[i]}: ${ot(r)};`).join(`
`);return`${x} body${t}:not([${ie}]):not([${$}]) {
${s}
}`}function _t(a){return`${G} [${g}]${K}[${U}="${a}"]:not([${g}="backdrop"]):not([${y}]) {
  backdrop-filter: url(#glassui-lens-${a}) saturate(180%) brightness(1.04);
}`}var Ee=class{doc;element;nudges="";exclusions="";lenses=new Map;constructor(e){this.doc=e}setNudges(e){e!==this.nudges&&(this.nudges=e,this.flush())}setExclusions(e){e!==this.exclusions&&(this.exclusions=e,this.flush())}setLens(e,t){if(t===void 0){if(!this.lenses.delete(e))return}else{if(this.lenses.get(e)===t)return;this.lenses.set(e,t)}this.flush()}flush(){this.element?.isConnected||(this.element=this.doc.createElement("style"),this.element.setAttribute(b,"dynamic"),this.doc.head.append(this.element)),this.element.textContent=[this.nudges,this.exclusions,...this.lenses.values()].filter(Boolean).join(`
`)}dispose(){this.element?.remove(),this.element=void 0,this.nudges="",this.exclusions="",this.lenses.clear()}};var At="http://www.w3.org/2000/svg",Is=12,Ds=.35,Ms=160,Os=24,Ps="rgb(128 128 128)",je={composer:0,smoke:1,menu:2,panel:3},Re=class{doc;sheet;entries=new Map;maps=new Map;resize;defs;enabled=!1;blur=12;nextId=1;frame=0;constructor(e,t){this.doc=e,this.sheet=t;let s=e.defaultView;this.resize=s&&typeof s.ResizeObserver=="function"?new s.ResizeObserver(i=>{for(let r of i)this.resized(r.target)}):void 0}get active(){let e=0;for(let t of this.entries.values())t.live&&e++;return e}setEnabled(e){if(e!==this.enabled){this.enabled=e;for(let t of["focusin","focusout","transitionend","animationend"])e?this.doc.addEventListener(t,this.recheck,{capture:!0,passive:!0}):this.doc.removeEventListener(t,this.recheck,{capture:!0});e||(this.releaseAll(),this.frame!==0&&this.doc.defaultView?.cancelAnimationFrame(this.frame),this.frame=0)}}setBlur(e){if(e!==this.blur){this.blur=e;for(let t of this.defs?.querySelectorAll("feGaussianBlur")??[])t.setAttribute("stdDeviation",this.deviation())}}sync(e){let t=new Set(this.enabled?e.filter(s=>je[s.kind]!==void 0&&s.area>0&&s.area<=Ds).sort((s,i)=>(je[s.kind]??9)-(je[i.kind]??9)||s.area-i.area).slice(0,Is).map(s=>s.element):[]);for(let s of[...this.entries.keys()])(!t.has(s)||!s.isConnected)&&this.release(s);for(let s of t){if(this.entries.has(s)){this.verify(s);continue}let i={id:this.nextId++,key:"",live:!1,timer:void 0};this.entries.set(s,i),s.setAttribute(U,String(i.id)),this.resize?.observe(s),this.schedule(s,0)}}recheck=()=>{let e=this.doc.defaultView;this.frame!==0||!e||(this.frame=e.requestAnimationFrame(()=>{this.frame=0;for(let t of this.entries.keys())this.verify(t)}))};verify(e){let t=this.entries.get(e);!t||t.timer!==void 0||!e.isConnected||t.key!==this.geometryKey(e)&&this.resized(e)}deviation(){return(this.blur*.8).toFixed(1)}resized(e){let t=this.entries.get(e);!t||t.key===this.geometryKey(e)||(this.setLive(t,!1),this.schedule(e,Ms))}setLive(e,t){e.live!==t&&(e.live=t,this.sheet.setLens(e.id,t?_t(e.id):void 0))}schedule(e,t){let s=this.entries.get(e);s&&(s.timer!==void 0&&clearTimeout(s.timer),s.timer=setTimeout(()=>{s.timer=void 0,this.build(e)},t))}geometryKey(e){let{width:t,height:s}=this.size(e),i=this.doc.defaultView;if(!i)return"";let r=i.getComputedStyle(e),n=Math.round(Math.min(parseFloat(r.borderTopLeftRadius)||0,t/2,s/2)),o=St(r);return`${t}x${s}r${n}s${o.x},${o.y}`}size(e){if(e instanceof(this.doc.defaultView?.HTMLElement??HTMLElement))return{width:Math.round(e.offsetWidth),height:Math.round(e.offsetHeight)};let t=e.getBoundingClientRect();return{width:Math.round(t.width),height:Math.round(t.height)}}build(e){let t=this.entries.get(e);if(!t||!this.enabled)return;if(!e.isConnected){this.release(e);return}let s=this.geometryKey(e),i=/^(\d+)x(\d+)r(\d+)s(\d+),(\d+)$/.exec(s);t.key=s;let r=Number(i?.[1]??0),n=Number(i?.[2]??0),o=Number(i?.[3]??0),d={x:Number(i?.[4]??0),y:Number(i?.[5]??0)};if(!i||r<8||n<8||d.x!==0||d.y!==0){this.setLive(t,!1);return}let c=kt(r,n),u=this.map(`${r}x${n}r${o}`,{width:r,height:n,radius:o,bezel:c});if(u===void 0){this.setLive(t,!1);return}let f={x:String(-d.x),y:String(-d.y),width:String(r),height:String(n)},p=this.filter(t.id);for(let[v,C]of Object.entries(f))p.setAttribute(v,C);p.replaceChildren(this.node("feGaussianBlur",{in:"SourceGraphic",stdDeviation:this.deviation(),edgeMode:"duplicate",result:"blur"}),this.node("feFlood",{...f,"flood-color":Ps,result:"neutral"}),this.node("feImage",{...f,href:u,preserveAspectRatio:"none",result:"image"}),this.node("feMerge",{result:"map"},[this.node("feMergeNode",{in:"neutral"}),this.node("feMergeNode",{in:"image"})]),this.node("feDisplacementMap",{in:"blur",in2:"map",scale:String(Tt(c)),xChannelSelector:"R",yChannelSelector:"G"})),this.setLive(t,!0)}map(e,t){let s=this.maps.get(e);if(s!==void 0)return s;let i=this.doc.createElement("canvas");i.width=t.width,i.height=t.height;let r=i.getContext("2d");if(!r)return;let n=r.createImageData(t.width,t.height);n.data.set(Et(t)),r.putImageData(n,0,0);let o=i.toDataURL("image/png");if(this.maps.set(e,o),this.maps.size>Os){let d=this.maps.keys().next().value;d!==void 0&&this.maps.delete(d)}return o}filter(e){let t=this.doc.getElementById(`glassui-lens-${e}`);if(t instanceof(this.doc.defaultView?.SVGFilterElement??SVGFilterElement))return t;let s=this.node("filter",{id:`glassui-lens-${e}`,x:"0",y:"0",filterUnits:"userSpaceOnUse",primitiveUnits:"userSpaceOnUse","color-interpolation-filters":"sRGB"});return this.container().append(s),s}container(){if(this.defs?.isConnected)return this.defs;let e=this.doc.createElementNS(At,"svg");return e.setAttribute(b,"defs"),e.setAttribute("aria-hidden","true"),e.setAttribute("focusable","false"),e.setAttribute("width","0"),e.setAttribute("height","0"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none",this.doc.body.append(e),this.defs=e,e}node(e,t,s=[]){let i=this.doc.createElementNS(At,e);for(let[r,n]of Object.entries(t))i.setAttribute(r,n);return i.append(...s),i}release(e){let t=this.entries.get(e);t&&(t.timer!==void 0&&clearTimeout(t.timer),this.resize?.unobserve(e),this.setLive(t,!1),e.removeAttribute(U),this.doc.getElementById(`glassui-lens-${t.id}`)?.remove(),this.entries.delete(e))}releaseAll(){for(let e of[...this.entries.keys()])this.release(e)}dispose(){this.setEnabled(!1),this.releaseAll(),this.resize?.disconnect(),this.defs?.remove(),this.defs=void 0,this.maps.clear()}};var de="rgba(0, 0, 0, 0)",_e=class{doc;host;cache=new Map;constructor(e){this.doc=e}container(){if(this.host?.isConnected)return this.host;let e=this.doc.createElement("div");return e.setAttribute(b,"probes"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict",this.doc.body.append(e),this.host=e,this.cache.clear(),e}probe(e,t){let s=this.cache.get(e);if(s?.isConnected)return s;let i=this.doc.createElement("div");return t(i),this.container().append(i),this.cache.set(e,i),i}style(e){let t=this.doc.defaultView;if(!t)throw new Error("dsh-glassui: probes need a document with a window");return t.getComputedStyle(e)}color(e){return this.style(this.probe(`bg:${e}`,t=>t.style.background=`var(${e})`)).backgroundColor}raw(){let e=this.doc.body;e.setAttribute(ie,"");try{let t=new Map(M.map(i=>[i,this.color(w[i])])),s=he.map(i=>this.color(i)).filter(i=>i!==de);return{watched:t,reserved:s}}finally{e.removeAttribute(ie)}}elevation(){let e=t=>this.style(this.probe(`sentinel:${t}`,s=>s.style.color=X[t])).color;return{panel:e("panel"),prominent:e("prominent"),soft:e("soft")}}menuFilter(){return this.style(this.probe("menu-filter",e=>e.style.setProperty("backdrop-filter",`var(${k.filter})`))).backdropFilter}tagged(e,t,s){let i=this.probe(`tagged:${e}:${t}:${s}`,r=>{r.setAttribute(g,e),r.setAttribute(N,t),s&&r.setAttribute(y,""),r.style.background=`var(${w[t]})`});return this.style(i).backgroundColor}dispose(){this.host?.remove(),this.host=void 0,this.cache.clear()}};var Fs=12;function Ks(a,e,t){switch(a.wallpaper){case"none":return;case"custom":return ue(a.wallpaperUrl)?{name:"custom",image:`url("${a.wallpaperUrl}")`,preset:void 0}:void 0;case"auto":return t?void 0:{name:"bay",image:le("bay",e),preset:"bay"};default:return{name:a.wallpaper,image:le(a.wallpaper,e),preset:a.wallpaper}}}function Gs(a){let e=[[0,0],[.2,.1],[.5,.5],[.8,.9],[1,1]],t=1+2*xe;return e.map(([s,i])=>({offset:s,transform:`translate(${qe(a.x*i/t)}%, ${qe(a.y*i/t)}%) scale(${qe(1+(a.scale-1)*i,4)})`}))}function qe(a,e=3){let t=10**e;return Math.round(a*t)/t}var Ye=class{doc;container;layers=[];key="";constructor(e){this.doc=e}show(e,t){let s=`${e}|${t.length}`;if(this.container?.isConnected&&s===this.key){t.forEach((o,d)=>this.layers[d]?.style.setProperty("background-image",o.image));return}this.hide(),this.key=s;let i=this.doc.createElement("div");i.setAttribute(b,"wallpaper"),i.setAttribute("aria-hidden","true"),i.style.cssText="position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;";let r=this.doc.createElement("div");r.style.cssText="position:absolute;left:50%;top:50%;width:max(100vw,160vh);height:max(100vh,62.5vw);transform:translate(-50%,-50%);",i.append(r);for(let o of t){let d=this.doc.createElement("div");d.style.cssText=`position:absolute;inset:${-xe*100}%;background:center / 100% 100% no-repeat;will-change:transform;`,d.style.setProperty("background-image",o.image),r.append(d),this.layers.push(d),typeof d.animate=="function"&&d.animate(Gs(o.motion),{duration:o.motion.duration*1e3,iterations:Number.POSITIVE_INFINITY,direction:"alternate",easing:`steps(${o.motion.duration*Fs})`})}this.doc.documentElement.insertBefore(i,this.doc.body),this.container=i}hide(){for(let e of this.layers)for(let t of e.getAnimations())t.cancel();this.layers=[],this.container?.remove(),this.container=void 0,this.key=""}},Xe=class{doc;element;image="";appliedImage="";observer;constructor(e){this.doc=e}show(e){this.image=e;let t=this.doc.defaultView;!this.observer&&t&&(this.observer=new t.MutationObserver(()=>this.sync()),this.observer.observe(this.doc.documentElement,{attributes:!0,attributeFilter:["style"]})),this.sync()}sync(){let e=this.doc.documentElement;if(["background-image","background-color","background-size","background-position","background-repeat","background-attachment"].some(s=>e.style.getPropertyValue(s)!=="")){this.element?.remove(),this.element=void 0,this.appliedImage="",e.removeAttribute(P);return}this.element?.isConnected||(this.element=this.doc.createElement("div"),this.element.setAttribute(b,"static-wallpaper"),this.element.setAttribute("aria-hidden","true"),e.insertBefore(this.element,this.doc.body),this.appliedImage=""),this.image!==this.appliedImage&&(this.element.style.backgroundImage=this.image,this.appliedImage=this.image),e.hasAttribute(P)||e.setAttribute(P,"")}hide(){this.observer?.disconnect(),this.observer=void 0,this.element?.remove(),this.element=void 0,this.image="",this.appliedImage="",this.doc.documentElement.removeAttribute(P)}},Ae=class{doc;live;still;cache=new Map;layerCache=new Map;current;constructor(e){this.doc=e,this.live=new Ye(e),this.still=new Xe(e)}apply(e,t,s,i=!0){let r=`${e.wallpaper}|${e.wallpaperUrl}|${t}|${s}|${i}`;if(r===this.current)return;if(this.current=r,!this.cache.has(r)&&(this.cache.set(r,Ks(e,t,s)),this.cache.size>24)){let c=this.cache.keys().next().value;c!==void 0&&this.cache.delete(c)}let n=this.cache.get(r),o=this.doc.documentElement;if(!n){this.live.hide(),this.still.hide(),o.removeAttribute(O),o.style.removeProperty(j);return}let d=n.preset;if(i&&d!==void 0&&ge(d)){this.still.hide();let c=this.layers(d,t);o.style.setProperty(j,c.base),this.live.show(d,c.moving)}else this.live.hide(),o.style.setProperty(j,n.image),d!==void 0?this.still.show(n.image):this.still.hide();o.setAttribute(O,n.name)}layers(e,t){let s=`${e}|${t}`,i=this.layerCache.get(s);if(!i){let[r,...n]=bt(e,t);i={base:r?Se(r.svg):"none",moving:n.flatMap(o=>o.motion?[{image:Se(o.svg),motion:o.motion}]:[])},this.layerCache.set(s,i)}return i}dispose(){this.live.hide(),this.still.hide();let e=this.doc.documentElement;e.removeAttribute(O),e.style.removeProperty(j),this.current=void 0,this.cache.clear(),this.layerCache.clear()}};var $e=new Set(["DIV","ASIDE","NAV","HEADER","FOOTER","SECTION","MAIN","FORM","DIALOG","MENU","UL","OL","ARTICLE","BUTTON","FIELDSET","DETAILS"]),Us=new Set(["SVG","PRE","CODE","TABLE","IFRAME","VIDEO","CANVAS","IMG","TEXTAREA","SELECT","SCRIPT","STYLE","TEMPLATE"]),Ws="/* dsh-glassui:",Bs=8,zs=new Set(["sidebar","composer","panel","smoke","code"]);function Hs(){return Object.fromEntries(pe.map(a=>[a,0]))}function Vs(a,e){let t=e.trim();if(t==="")return"";try{return a.createDocumentFragment().querySelector(t),t}catch{return}}var Ce=class{win;doc;env;onChange;settings;running=!1;idle="disabled";probes;sheet;exclusions;lenses;highlights;wallpaper;ownSheet;menuFilterDirty=!1;signatures;expected=new Map;missing=[];ambiguous=[];tagged=new Map;echoes=new Set;roots=new Set;singles=new Set;invalidated=new Set;requeue=[];walkers=[];frame=0;paletteDirty=!1;exclusionsDirty=!1;exclude="";invalidExclude=!1;stats={batches:0,inspected:0,longestMs:0,totalMs:0};subtree;bodyWatch;rootWatch;headWatch;stopEnvironment;disposed=!1;constructor(e,t,s){this.win=e,this.doc=e.document,this.env=t,this.onChange=s,this.probes=new _e(this.doc),this.sheet=new Ee(this.doc),this.exclusions=new ke(this.doc,this.sheet),this.lenses=new Re(this.doc,this.sheet),this.highlights=new Te(this.doc),this.wallpaper=new Ae(this.doc),this.stopEnvironment=this.env.onChange(()=>{this.settings&&(this.apply(this.settings),this.applyPresentation()),this.paletteChanged()})}get active(){return this.running}apply(e){if(this.disposed)return;let t=this.settings;if(this.settings=e,!e.enabled||this.env.forcedColors()){this.idle=e.enabled?"forced-colors":"disabled",this.stop();return}if(!this.running){this.start();return}let s=this.doc.documentElement;t?.sidebar!==e.sidebar&&s.setAttribute(H,e.sidebar),t?.inlineCodeOpacity!==e.inlineCodeOpacity&&s.style.setProperty(W,String(e.inlineCodeOpacity/100)),t?.tint!==e.tint&&(s.style.setProperty(V,String(e.tint/100)),this.expected.clear(),this.lenses.setBlur(this.blurPx()),this.menuFilterDirty=!0),t?.exclude!==e.exclude&&this.updateExclude(!0),t?.codeBlocks!==e.codeBlocks&&this.updateCodeBlocks(),(t?.sidebar!==e.sidebar||t.refraction!==e.refraction||t.highlights!==e.highlights||t.wallpaper!==e.wallpaper||t.wallpaperUrl!==e.wallpaperUrl)&&this.applyPresentation()}start(){let e=this.settings;if(!e||!this.doc.body)return;this.running=!0,this.idle=void 0,this.ensureStylesheet();let t=this.doc.documentElement;t.setAttribute(L,"on"),t.setAttribute(H,e.sidebar),t.style.setProperty(V,String(e.tint/100)),t.style.setProperty(W,String(e.inlineCodeOpacity/100)),this.lenses.setBlur(this.blurPx()),this.updateExclude(!1),this.refreshExclusions(),this.refreshPalette(),this.applyPresentation(),this.subtree=new this.win.MutationObserver(s=>this.mutated(s)),this.subtree.observe(this.doc.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style",I,D,"contenteditable"],attributeOldValue:!0}),this.bodyWatch=new this.win.MutationObserver(()=>this.paletteChanged()),this.bodyWatch.observe(this.doc.body,{attributes:!0,attributeFilter:[B,"style","class"]}),this.rootWatch=new this.win.MutationObserver(()=>this.applyPresentation()),this.rootWatch.observe(t,{attributes:!0,attributeFilter:[Ge]}),this.headWatch=new this.win.MutationObserver(s=>{s.some(i=>!this.ownRecord(i))&&this.paletteChanged()}),this.headWatch.observe(this.doc.head,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["href","media","disabled"]}),this.win.addEventListener("resize",this.resized,{passive:!0}),this.doc.addEventListener("load",this.loaded,!0),this.doc.addEventListener("transitionend",this.settled,!0),this.doc.addEventListener("animationend",this.settled,!0),this.roots.add(this.doc.body),this.schedule()}stop(){let e=this.running;this.running=!1,this.frame!==0&&this.win.cancelAnimationFrame(this.frame),this.frame=0,this.subtree?.disconnect(),this.bodyWatch?.disconnect(),this.rootWatch?.disconnect(),this.headWatch?.disconnect(),this.subtree=this.bodyWatch=this.rootWatch=this.headWatch=void 0,this.doc.removeEventListener("load",this.loaded,!0),this.doc.removeEventListener("transitionend",this.settled,!0),this.doc.removeEventListener("animationend",this.settled,!0),this.win.removeEventListener("resize",this.resized),this.roots.clear(),this.singles.clear(),this.invalidated.clear(),this.exclusionsDirty=!1,this.walkers=[],this.requeue.length=0,this.lenses.dispose(),this.highlights.dispose(),this.wallpaper.dispose(),this.exclusions.dispose(),this.sheet.dispose(),this.probes.dispose(),this.ownSheet?.remove(),this.ownSheet=void 0;for(let s of[...this.tagged.keys()])this.untag(s);for(let s of this.echoes)s.removeAttribute(A);this.echoes.clear(),this.signatures=void 0,this.expected.clear();let t=this.doc.documentElement;t.removeAttribute(L),t.removeAttribute(H),t.style.removeProperty(V),t.style.removeProperty(W);for(let s of this.doc.querySelectorAll(dt)){if(s.hasAttribute(b)){s.remove();continue}for(let i of[...s.getAttributeNames()])i.startsWith("data-glassui")&&i!==I&&i!==D&&s.removeAttribute(i)}e&&this.changed()}dispose(){this.disposed=!0,this.stopEnvironment?.(),this.stopEnvironment=void 0,this.stop(),this.notifyFrame!==0&&this.win.cancelAnimationFrame(this.notifyFrame),this.notifyFrame=0}diagnostics(){let e=Hs();for(let[t,s]of this.tagged)!s.flat&&t.isConnected&&e[s.kind]++;return{running:this.running,idle:this.running?void 0:this.idle,environment:{refraction:this.env.refraction,finePointer:this.env.finePointer(),reducedTransparency:this.env.reducedTransparency(),reducedMotion:this.env.reducedMotion()},missingTokens:[...this.missing],ambiguousTokens:[...this.ambiguous],surfaces:e,lenses:this.lenses.active,invalidExclude:this.invalidExclude,scans:{...this.stats}}}blurPx(){let e=(this.settings?.tint??35)/100;return 6+Math.max(e,this.env.reducedTransparency()?1:0,this.env.increasedContrast()?.85:0)*22}scheme(){return this.doc.body.hasAttribute(B)?"dark":"light"}applyPresentation(){let e=this.settings;if(!this.running||!e)return;this.lenses.setBlur(this.blurPx());let t=this.doc.documentElement.getAttribute(Ge)==="darwin";this.wallpaper.apply(e,this.scheme(),t,!this.env.reducedMotion()),this.highlights.setEnabled(e.highlights&&this.env.finePointer()&&!this.env.reducedMotion()&&!this.env.reducedTransparency()),this.lenses.setEnabled(e.refraction&&this.env.refraction&&!this.env.reducedTransparency()),this.syncLenses()}ensureStylesheet(){for(let t of this.doc.querySelectorAll("style"))if(t.textContent.startsWith(Ws))return;let e=this.doc.createElement("style");e.setAttribute(b,"stylesheet"),e.textContent=yt(),this.doc.head.append(e),this.ownSheet=e}updateCodeBlocks(){if(this.settings?.codeBlocks!=="glass"){for(let[e,t]of[...this.tagged])t.kind==="code"&&this.untag(e);this.syncLenses(),this.changed()}this.paletteChanged()}codeGlass(){return this.settings?.codeBlocks==="glass"}watchedFills(){return this.codeGlass()?[...M]:M.filter(e=>!ct.has(e))}updateExclude(e){let t=Vs(this.doc,this.settings?.exclude??"");this.invalidExclude=t===void 0;let s=t??"";if(s!==this.exclude&&(this.exclude=s,!!e)){if(this.refreshExclusions(),s!==""){for(let i of[...this.tagged.keys()])i.closest(s)&&this.untag(i);for(let i of this.echoes)i.closest(s)&&(i.removeAttribute(A),this.echoes.delete(i))}this.syncLenses(),this.changed(),this.roots.add(this.doc.body),this.schedule()}}refreshExclusions(){for(let e of this.exclusions.sync(this.exclude,[...this.invalidated]))this.invalidated.add(e),this.roots.add(e)}resized=()=>this.paletteChanged();paletteChanged(){this.running&&(this.paletteDirty=!0,this.invalidated.add(this.doc.body),this.roots.add(this.doc.body),this.schedule())}refreshPalette(){let e=this.probes.raw(),t=this.watchedFills(),s=[...e.reserved,...M.filter(c=>!t.includes(c)).map(c=>e.watched.get(c)??de)],i=c=>c===de?void 0:Fe(c),r=lt(t.map(c=>[c,i(e.watched.get(c)??de)]),s.map(i).filter(c=>c!==void 0));this.sheet.setNudges(Rt(r,this.scheme()==="dark"));let n=new Set([...he,...M.filter(c=>!t.includes(c)).map(c=>w[c])].map(c=>this.probes.color(c))),o=new Map,d=new Map;this.missing=[];for(let c of t){if(e.watched.get(c)===de){this.missing.push(c);continue}let u=this.probes.color(w[c]);d.set(u,[...d.get(u)??[],c])}this.ambiguous=[];for(let[c,u]of d){let[f]=u;u.length===1&&f!==void 0&&!n.has(c)?o.set(c,f):this.ambiguous.push(...u)}this.menuFilterDirty=!1,this.signatures={fills:o,elevation:this.probes.elevation(),menuFilter:this.probes.menuFilter()},this.expected.clear()}loaded=e=>{e.target instanceof this.win.HTMLLinkElement&&this.paletteChanged()};ownedNode(e){let t=e instanceof this.win.Element?e:e.parentElement;return t!==null&&t.closest(`[${b}]`)!==null}ownRecord(e){if(this.ownedNode(e.target))return!0;if(e.type!=="childList")return!1;let t=[...e.addedNodes,...e.removedNodes];return t.length>0&&t.every(s=>s instanceof this.win.Element&&s.hasAttribute(b))}settled=e=>{let t=e.target;this.running&&t instanceof this.win.Element&&$e.has(t.tagName)&&(this.singles.add(t),this.schedule())};mutated(e){let t=!1;for(let s of e)if(!this.ownRecord(s)){if(s.type==="attributes"){if(!(s.target instanceof this.win.Element)||s.attributeName==="style"&&this.onlyOwnStyleChanged(s))continue;this.exclusionsDirty=!0,this.invalidated.add(s.target),this.roots.add(s.target);continue}this.exclusionsDirty=!0;for(let i of s.addedNodes)i instanceof this.win.Element&&!i.hasAttribute(b)&&(this.invalidated.add(i),this.roots.add(i));s.removedNodes.length>0&&(t=!0)}t&&this.prune(),(this.exclusionsDirty||this.roots.size>0||this.singles.size>0)&&this.schedule()}oldStyle;newStyle;docStyle(){return this.win.document.createElement("div").style}onlyOwnStyleChanged(e){this.oldStyle??=this.docStyle(),this.newStyle??=this.docStyle();let t=(s,i)=>{i.cssText=s;for(let r of[...i])r.startsWith("--glassui-")&&i.removeProperty(r);return i.cssText};return t(e.oldValue??"",this.oldStyle)===t(e.target.getAttribute("style")??"",this.newStyle)}reclassify(){if(this.invalidated.size===0)return!1;let e=[...this.invalidated];this.invalidated.clear();let t=new Set(this.echoes),s=[...this.tagged.keys(),...this.echoes].filter(n=>e.some(o=>o.contains(n))).sort((n,o)=>n.compareDocumentPosition(o)&this.win.Node.DOCUMENT_POSITION_FOLLOWING?-1:1);if(s.length===0)return!1;for(let n of s)this.tagged.has(n)&&this.untag(n),this.echoes.delete(n)&&n.removeAttribute(A);let i=s.filter(n=>n.isConnected&&this.admissible(n)).map(n=>this.inspect(n));for(let n of i)this.commit(n);let r=i.filter(({element:n})=>t.has(n)&&this.isEcho(n,this.win.getComputedStyle(n).backgroundColor));for(let{element:n}of r)this.untag(n),n.setAttribute(A,""),this.echoes.add(n);return this.stats.inspected+=i.length,!0}schedule(){this.running&&this.frame===0&&(this.frame=this.win.requestAnimationFrame(this.process))}process=()=>{if(this.frame=0,!this.running)return;let e=performance.now();(this.exclusionsDirty||this.paletteDirty)&&(this.exclusionsDirty=!1,this.refreshExclusions()),this.paletteDirty&&(this.paletteDirty=!1,this.refreshPalette(),this.applyPresentation());let t=this.reclassify();for(let n of this.roots)this.admissible(n)&&n.isConnected&&!this.walkers.some(o=>!o.started&&o.root.contains(n))&&(this.walkers=this.walkers.filter(o=>o.started||!n.contains(o.root)),this.walkers.push({root:n,walker:this.walker(n),started:!1}));this.roots.clear();let s=e+Bs,i=[];for(let n of this.singles)if(this.singles.delete(n),n.isConnected&&$e.has(n.tagName)&&this.admissible(n)&&i.push(this.inspect(n)),(i.length&63)===0&&performance.now()>s)break;e:for(;this.walkers.length>0&&performance.now()<=s;){let n=this.walkers[0];if(!n)break;if(!n.root.isConnected||!this.admissible(n.root)){this.walkers.shift();continue}n.started||(n.started=!0,$e.has(n.root.tagName)&&this.admissible(n.root)&&i.push(this.inspect(n.root)));for(let o=n.walker.nextNode();o;o=n.walker.nextNode())if(i.push(this.inspect(o)),(i.length&63)===0&&performance.now()>s)break e;this.walkers.shift()}for(let n of i)t=this.commit(n)||t;for(let n of this.requeue.splice(0))this.singles.add(n);t&&this.syncLenses();let r=performance.now()-e;this.stats.batches++,this.stats.inspected+=i.length,this.stats.totalMs+=r,this.stats.longestMs=Math.max(this.stats.longestMs,r),t&&this.changed(),(this.walkers.length>0||this.roots.size>0||this.singles.size>0)&&this.schedule()};admissible(e){return e.closest(`[${b}],[${I}],[contenteditable]`)?!1:this.exclude===""||!e.closest(this.exclude)}walker(e){let t=s=>{let i=s,r=i.tagName;if(this.codeGlass()&&i.hasAttribute(Ue)){this.singles.add(i);for(let n of i.querySelectorAll("div"))this.singles.add(n);return NodeFilter.FILTER_REJECT}return Us.has(r.toUpperCase())||i.hasAttribute(b)||i.hasAttribute(I)||i.hasAttribute("contenteditable")||i.hasAttribute(Ue)||this.exclude!==""&&i.matches(this.exclude)?NodeFilter.FILTER_REJECT:$e.has(r)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP};return this.doc.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:t})}inspect(e){let t=this.signatures,s=this.tagged.get(e);if(!t)return{element:e,verdict:void 0,area:0,untag:!1};let i=this.win.getComputedStyle(e);if(s)return(s.kind==="menu"?i.backdropFilter!=="none":s.fill!==void 0&&i.backgroundColor===this.expectedFor(s.kind,s.fill,s.flat))?{element:e,verdict:void 0,area:s.area,untag:!1}:(this.requeue.push(e),{element:e,verdict:void 0,area:0,untag:!0});let r=i.backgroundColor,n=i.backdropFilter;if(this.menuFilterDirty&&n!=="none"&&!t.fills.has(r)&&(t.menuFilter=this.probes.menuFilter(),this.menuFilterDirty=!1),!t.fills.has(r)&&(n==="none"||n!==t.menuFilter))return{element:e,verdict:void 0,area:0,untag:!1,echo:this.echoes.has(e)||this.isEcho(e,r)};let o=e.getBoundingClientRect(),d=Math.max(1,this.win.innerWidth*this.win.innerHeight),c={background:r,backgroundImage:i.backgroundImage,boxShadow:i.boxShadow,backdropFilter:n,area:o.width*o.height/d,width:o.width,managed:e.hasAttribute(D)};return{element:e,verdict:wt(c,t),area:c.area,untag:!1}}isEcho(e,t){let s=Fe(t);if(!s||s.a===0||s.a>=1)return!1;let i=e.parentElement?.closest(`[${g}]:not([${y}])`),r=i?this.tagged.get(i):void 0;return!r||r.kind==="backdrop"||r.kind==="menu"||r.fill===void 0?!1:t===this.expectedFor(r.kind,r.fill,!1)}expectedFor(e,t,s){let i=`${e}|${t}|${s}`,r=this.expected.get(i);return r===void 0&&(r=this.probes.tagged(e,t,s),this.expected.set(i,r)),r}commit(e){let{element:t,verdict:s}=e;if(e.untag)return this.untag(t),!0;if(e.echo&&!this.echoes.has(t))return t.setAttribute(A,""),this.echoes.add(t),!1;if(!s||this.tagged.has(t)||!t.isConnected)return!1;let i=!1;if(s.fill!==void 0&&zs.has(s.kind)){let r=s.kind==="code"?`[${g}="code"]`:`[${N}="${s.fill}"]`,n=t.parentElement?.closest(`${r}:not([${y}])`);i=n!=null&&this.tagged.get(n)?.kind!=="backdrop"}return t.setAttribute(g,s.kind),s.fill!==void 0&&t.setAttribute(N,s.fill),i&&t.setAttribute(y,""),s.paint&&!i&&t.setAttribute(F,""),s.float&&!i&&t.setAttribute(ne,""),this.tagged.set(t,{kind:s.kind,fill:s.fill,flat:i,area:e.area}),i&&this.requeue.push(t),!0}untag(e){for(let t of[g,N,y,F,ne])e.removeAttribute(t);this.tagged.delete(e);for(let t of this.echoes)e.contains(t)&&(t.removeAttribute(A),this.echoes.delete(t))}prune(){for(let t of this.echoes)t.isConnected||(t.removeAttribute(A),this.echoes.delete(t));let e=!1;for(let t of this.tagged.keys())t.isConnected||(this.untag(t),e=!0);e&&(this.syncLenses(),this.changed())}syncLenses(){let e=[];for(let[t,s]of this.tagged)!s.flat&&t.isConnected&&e.push({element:t,kind:s.kind,area:s.area});this.lenses.sync(e)}notifyFrame=0;changed(){this.disposed||!this.onChange||this.notifyFrame!==0||(this.notifyFrame=this.win.requestAnimationFrame(()=>{this.notifyFrame=0,this.onChange?.()}))}};function $t(a){let e=u=>typeof a.matchMedia=="function"?a.matchMedia(u):void 0,t=e("(hover: hover) and (pointer: fine)"),s=e("(prefers-reduced-motion: reduce)"),i=e("(prefers-reduced-transparency: reduce)"),r=e("(prefers-contrast: more)"),n=e("(forced-colors: active)"),o=a.navigator.userAgentData?.brands,d=o?o.some(u=>/Chromium/i.test(u.brand)):/(?:Chrome|Chromium)\/\d/.test(a.navigator.userAgent),c=typeof a.CSS<"u"&&typeof a.CSS.supports=="function"&&a.CSS.supports("backdrop-filter","url(#a)");return{refraction:d&&c,finePointer:()=>t?.matches??!1,reducedMotion:()=>s?.matches??!1,reducedTransparency:()=>i?.matches??!1,increasedContrast:()=>r?.matches??!1,forcedColors:()=>n?.matches??!1,onChange(u){let f=[t,s,i,r,n].filter(p=>p!==void 0);for(let p of f)p.addEventListener("change",u);return()=>{for(let p of f)p.removeEventListener("change",u)}}}}var Je="dsh-glassui",Le={"inline.label":"Inline-code opacity","inline.readable":"Readable","inline.hint":"Independent of code blocks and Transparency. Recommended: 60\u201385. Contrast preferences may raise opacity.","inline.preview":"Inline-code preview","inline.example":"Try these in your message:",updateReason_profile:"The connected profile changed. Check again.",updateReason_storage:"Could not write the update files to the profile.",updateReason_interrupted:"The download was interrupted before installation. Check again.",updateTitle:"Glass UI plugin",updateIdle:"Updates have not been checked yet.",updateChecking:"Checking for updates\u2026",updateCurrent:"No newer stable release.",updateAvailable:"A plugin update is available. Wallpaper, effects and exclusions are kept.",updateBlocked:"The update could not be checked or is unavailable.",updatePreparing:"Downloading and verifying the release\u2026",updateInstalling:"Installing the plugin\u2026",updateRestart:"Installed. Restart DSH when your current work is finished to apply the update.",updateApplied:"The updated plugin version is running.",updateFailed:"Update failed. Review the stage below and check again.",updateCancelled:"The installer confirmed cancellation.",updateOverridden:"Saved settings prevent the update from applying.",updateUnknown:"The installation result is unknown. Reconcile the operation before starting another update.",updateCheck:"Check plugin update",updateInstall:"Update plugin",updateReconcile:"Check installation result",updateManual:"Releases / manual update",updateChecked:"Last checked",updateStage:"Installer stage","updateReason_manager-unavailable":"Automatic updates are unavailable here. Use the Releases page.","updateReason_read-only":"This plugin cannot be changed here.",updateReason_source:"This installation source requires a manual update. Its version pin will be preserved.",updateReason_incompatible:"The release does not support this DSH version.","updateReason_compatibility-unknown":"The release compatibility could not be confirmed.",updateReason_busy:"Another update or settings change is in progress. Finish it before retrying.",updateReason_network:"Could not contact the release service. Try again later.",updateReason_metadata:"Release metadata is invalid. Use the release link to review it.",updateReason_asset:"The required release assets are missing or ambiguous.",updateReason_channel:"This update accepts stable releases only.",updateReason_checksum:"Release checksum verification failed.",updateReason_redirect:"The release redirected to an unapproved host.",updateReason_size:"The release exceeded its download size limit.","updateReason_stale-candidate":"The release or installation changed. Check again.","updateReason_release-unavailable":"The release service returned no accessible release.",updateReason_reinstall:"The installed copy was removed, and the new version did not finish installing. Install this release again from the Releases page.",updateSettling:"Saving pending settings\u2026",updateReason_settings:"Settings could not be saved or changed elsewhere. Resolve the save error and try again.",updateRunning:"Running version",updateInstalledVersion:"Installed version",title:"Glass UI",subtitle:"Adjust glass, wallpaper and effects.","status.on":"On","status.off":"Off","status.forced":"Paused while high contrast is on","status.surfaces":"{count} glass surfaces","section.material":"Material","enable.label":"Glass material","enable.hint":"Turn off to see DSH\u2019s original look.","tint.label":"Transparency","tint.clear":"Clear","tint.tinted":"Tinted","section.wallpaper":"Wallpaper","wallpaper.auto":"Automatic","wallpaper.auto.hint":"Bay in a browser, none in the macOS app.","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"Live","wallpaper.live.hint":"Moves slowly. It holds still with Reduce Motion, and costs a little more power than a still wallpaper.","wallpaper.none":"None","wallpaper.custom":"Custom","wallpaper.url.label":"Image URL","wallpaper.url.placeholder":"https://\u2026 or /path/on/this/server.jpg","wallpaper.url.invalid":"Use an http(s) URL, a path on this server, or a base64 image data URL.","section.layout":"Layout and effects","sidebar.label":"Sidebar","sidebar.floating":"Floating","sidebar.docked":"Docked","code.label":"Code blocks","code.hint":"Glass is a denser tint that keeps code easy to read.","code.glass":"Glass","code.solid":"Solid","refraction.label":"Refraction","refraction.hint":"Bends the background along glass edges.","refraction.unavailable":"Needs a Chromium-based browser such as Chrome, Edge or the DSH desktop app.","highlights.label":"Pointer highlights","highlights.hint":"A soft light follows the pointer. Off on touch screens and with Reduce Motion.","section.compat":"Compatibility","exclude.label":"Leave these elements alone","exclude.hint":"CSS selectors, comma separated. Use this when another plugin looks wrong under glass.","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"This selector is not valid, so it is ignored.","diag.title":"Diagnostics","diag.surfaces":"Glass surfaces","diag.lenses":"Refracting now","diag.tokens":"DSH theme tokens","diag.tokens.ok":"All found","diag.tokens.missing":"Not in this DSH release: {list}","diag.tokens.ambiguous":"Indistinguishable: {list}","diag.scan":"Scanning","diag.scan.value":"{batches} passes, longest {longest} ms","diag.copy":"Copy diagnostics","diag.copied":"Copied","diag.copy.failed":"Copy failed. Select the text below instead.","kind.sidebar":"Sidebar","kind.composer":"Composer","kind.panel":"Panels","kind.menu":"Menus","kind.smoke":"Toasts and tooltips","kind.code":"Code blocks","kind.backdrop":"Backgrounds","save.local":"This connection cannot save settings, so changes last until the page reloads.","save.error":"Could not save the change. The previous value is back.","save.saving":"Saving\u2026",footer:"dsh-glassui {version}. Unofficial; not affiliated with DeepSeek."},Ct={"inline.label":"\u30A4\u30F3\u30E9\u30A4\u30F3\u30B3\u30FC\u30C9\u306E\u4E0D\u900F\u660E\u5EA6","inline.readable":"\u8AAD\u307F\u3084\u3059\u3044","inline.hint":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u3084\u900F\u660E\u5EA6\u3068\u306F\u5225\u306E\u8A2D\u5B9A\u3067\u3059\u3002\u63A8\u5968\u306F60\u301C85\u3002\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u8A2D\u5B9A\u306B\u3088\u3063\u3066\u4E0D\u900F\u660E\u5EA6\u304C\u9AD8\u304F\u306A\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002","inline.preview":"\u30A4\u30F3\u30E9\u30A4\u30F3\u30B3\u30FC\u30C9\u306E\u30D7\u30EC\u30D3\u30E5\u30FC","inline.example":"\u6587\u7AE0\u306E\u4E2D\u3067\u4F7F\u3046\u4F8B\uFF1A",updateReason_profile:"\u63A5\u7D9A\u5148\u306E\u8A2D\u5B9A\u74B0\u5883\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_storage:"profile\u5185\u306B\u66F4\u65B0\u7528\u30D5\u30A1\u30A4\u30EB\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_interrupted:"\u5C0E\u5165\u524D\u306E\u53D6\u5F97\u51E6\u7406\u304C\u4E2D\u65AD\u3055\u308C\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateTitle:"Glass UI\u30D7\u30E9\u30B0\u30A4\u30F3",updateIdle:"\u66F4\u65B0\u306F\u307E\u3060\u78BA\u8A8D\u3057\u3066\u3044\u307E\u305B\u3093\u3002",updateChecking:"\u66F4\u65B0\u3092\u78BA\u8A8D\u4E2D\u2026",updateCurrent:"\u65B0\u3057\u3044\u6B63\u5F0F\u7248\u306F\u3042\u308A\u307E\u305B\u3093\u3002",updateAvailable:"\u66F4\u65B0\u304C\u3042\u308A\u307E\u3059\u3002\u58C1\u7D19\u30FB\u52B9\u679C\u30FB\u9664\u5916\u8A2D\u5B9A\u306F\u7DAD\u6301\u3057\u307E\u3059\u3002",updateBlocked:"\u66F4\u65B0\u3092\u78BA\u8A8D\u3067\u304D\u306A\u3044\u304B\u3001\u3053\u306E\u74B0\u5883\u3067\u306F\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3002",updatePreparing:"\u914D\u5E03\u7269\u3092\u53D6\u5F97\u30FB\u691C\u8A3C\u4E2D\u2026",updateInstalling:"\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u4E2D\u2026",updateRestart:"\u5C0E\u5165\u3057\u307E\u3057\u305F\u3002\u73FE\u5728\u306E\u4F5C\u696D\u3092\u7D42\u3048\u3066\u304B\u3089DSH\u3092\u518D\u8D77\u52D5\u3057\u3066\u9069\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateApplied:"\u66F4\u65B0\u3057\u305F\u30D7\u30E9\u30B0\u30A4\u30F3\u304C\u52D5\u4F5C\u3057\u3066\u3044\u307E\u3059\u3002",updateFailed:"\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u5931\u6557\u6BB5\u968E\u3092\u78BA\u8A8D\u3057\u3066\u518D\u5EA6\u66F4\u65B0\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateCancelled:"\u30A4\u30F3\u30B9\u30C8\u30FC\u30E9\u30FC\u304C\u53D6\u6D88\u3092\u78BA\u8A8D\u3057\u307E\u3057\u305F\u3002",updateOverridden:"\u4FDD\u5B58\u8A2D\u5B9A\u306B\u3088\u308A\u66F4\u65B0\u3092\u9069\u7528\u3067\u304D\u307E\u305B\u3093\u3002",updateUnknown:"\u5C0E\u5165\u7D50\u679C\u306F\u4E0D\u660E\u3067\u3059\u3002\u518D\u9001\u305B\u305A\u3001\u7D50\u679C\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateCheck:"\u66F4\u65B0\u3092\u78BA\u8A8D",updateInstall:"\u66F4\u65B0\u3059\u308B",updateReconcile:"\u5C0E\u5165\u7D50\u679C\u3092\u78BA\u8A8D",updateManual:"\u914D\u5E03\u7248\u30FB\u624B\u52D5\u66F4\u65B0",updateChecked:"\u78BA\u8A8D\u6642\u523B",updateStage:"\u5C0E\u5165\u6BB5\u968E","updateReason_manager-unavailable":"\u3053\u306E\u74B0\u5883\u3067\u306F\u81EA\u52D5\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3002\u914D\u5E03\u30DA\u30FC\u30B8\u304B\u3089\u66F4\u65B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_read-only":"\u3053\u306E\u74B0\u5883\u3067\u306F\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u5909\u66F4\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_source:"\u3053\u306E\u5C0E\u5165\u5143\u306F\u624B\u52D5\u66F4\u65B0\u304C\u5FC5\u8981\u3067\u3059\u3002\u7248\u56FA\u5B9A\u306F\u7DAD\u6301\u3057\u307E\u3059\u3002",updateReason_incompatible:"\u3053\u306E\u914D\u5E03\u7248\u306F\u5B9F\u884C\u4E2D\u306EDSH\u7248\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093\u3002","updateReason_compatibility-unknown":"\u914D\u5E03\u7248\u306EDSH\u4E92\u63DB\u6027\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_busy:"\u5225\u306E\u66F4\u65B0\u307E\u305F\u306F\u8A2D\u5B9A\u5909\u66F4\u304C\u9032\u884C\u4E2D\u3067\u3059\u3002\u5B8C\u4E86\u3057\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_network:"\u914D\u5E03\u30B5\u30FC\u30D3\u30B9\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u6642\u9593\u3092\u7F6E\u3044\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_metadata:"\u914D\u5E03\u60C5\u5831\u304C\u4E0D\u6B63\u3067\u3059\u3002\u914D\u5E03\u30DA\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_asset:"\u5FC5\u8981\u306A\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u304C\u306A\u3044\u304B\u3001\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002",updateReason_channel:"\u3053\u306E\u66F4\u65B0\u6A5F\u80FD\u306F\u6B63\u5F0F\u7248\u306E\u307F\u6271\u3044\u307E\u3059\u3002",updateReason_checksum:"\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u306E\u30C1\u30A7\u30C3\u30AF\u30B5\u30E0\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",updateReason_redirect:"\u914D\u5E03\u53D6\u5F97\u5148\u304C\u8A31\u53EF\u3057\u3066\u3044\u306A\u3044\u30DB\u30B9\u30C8\u306B\u8EE2\u9001\u3055\u308C\u307E\u3057\u305F\u3002",updateReason_size:"\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u304C\u53D6\u5F97\u30B5\u30A4\u30BA\u4E0A\u9650\u3092\u8D85\u3048\u307E\u3057\u305F\u3002","updateReason_stale-candidate":"\u914D\u5E03\u60C5\u5831\u307E\u305F\u306F\u5C0E\u5165\u72B6\u614B\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_release-unavailable":"\u53D6\u5F97\u3067\u304D\u308B\u914D\u5E03\u7248\u304C\u3042\u308A\u307E\u305B\u3093\u3002",updateReason_reinstall:"\u5C0E\u5165\u6E08\u307F\u306E\u7248\u306F\u524A\u9664\u3055\u308C\u307E\u3057\u305F\u304C\u3001\u65B0\u3057\u3044\u7248\u306E\u5C0E\u5165\u306F\u5B8C\u4E86\u3057\u3066\u3044\u307E\u305B\u3093\u3002Releases \u30DA\u30FC\u30B8\u304B\u3089\u5165\u308C\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateSettling:"\u4FDD\u5B58\u5F85\u3061\u306E\u8A2D\u5B9A\u3092\u4FDD\u5B58\u4E2D\u2026",updateReason_settings:"\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u304B\u3001\u5225\u306E\u753B\u9762\u3067\u8A2D\u5B9A\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u4FDD\u5B58\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateRunning:"\u5B9F\u884C\u7248",updateInstalledVersion:"\u5C0E\u5165\u7248",title:"Glass UI",subtitle:"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F\u3001\u58C1\u7D19\u3001\u8868\u793A\u52B9\u679C\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002","status.on":"\u30AA\u30F3","status.off":"\u30AA\u30D5","status.forced":"\u30CF\u30A4\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u306E\u305F\u3081\u4E00\u6642\u505C\u6B62\u4E2D","status.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762 {count} \u500B","section.material":"\u8CEA\u611F","enable.label":"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F","enable.hint":"\u30AA\u30D5\u306B\u3059\u308B\u3068 DSH \u672C\u6765\u306E\u898B\u305F\u76EE\u306B\u623B\u308A\u307E\u3059\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u30AF\u30EA\u30A2","tint.tinted":"\u30C6\u30A3\u30F3\u30C8","section.wallpaper":"\u58C1\u7D19","wallpaper.auto":"\u81EA\u52D5","wallpaper.auto.hint":"\u30D6\u30E9\u30A6\u30B6\u3067\u306F Bay\u3001macOS \u30A2\u30D7\u30EA\u3067\u306F\u58C1\u7D19\u306A\u3057\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52D5\u304F","wallpaper.live.hint":"\u3086\u3063\u304F\u308A\u52D5\u304D\u307E\u3059\u3002\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u304C\u30AA\u30F3\u306E\u3068\u304D\u306F\u6B62\u307E\u308A\u307E\u3059\u3002\u9759\u6B62\u3057\u305F\u58C1\u7D19\u3088\u308A\u5C11\u3057\u3060\u3051\u96FB\u529B\u3092\u4F7F\u3044\u307E\u3059\u3002","wallpaper.none":"\u306A\u3057","wallpaper.custom":"\u30AB\u30B9\u30BF\u30E0","wallpaper.url.label":"\u753B\u50CF\u306E URL","wallpaper.url.placeholder":"https://\u2026 \u307E\u305F\u306F /\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9.jpg","wallpaper.url.invalid":"http(s) \u306E URL\u3001\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9\u3001\u307E\u305F\u306F base64 \u306E\u753B\u50CF\u30C7\u30FC\u30BF URL \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002","section.layout":"\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u52B9\u679C","sidebar.label":"\u30B5\u30A4\u30C9\u30D0\u30FC","sidebar.floating":"\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0","sidebar.docked":"\u30C9\u30C3\u30AD\u30F3\u30B0","code.label":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","code.hint":"\u30AC\u30E9\u30B9\u306F\u30B3\u30FC\u30C9\u304C\u8AAD\u307F\u3084\u3059\u3044\u6FC3\u3055\u306B\u3057\u3066\u3042\u308A\u307E\u3059\u3002","code.glass":"\u30AC\u30E9\u30B9","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u5C48\u6298","refraction.hint":"\u30AC\u30E9\u30B9\u306E\u7E01\u3067\u80CC\u666F\u304C\u66F2\u304C\u3063\u3066\u898B\u3048\u307E\u3059\u3002","refraction.unavailable":"Chrome\u3001Edge\u3001DSH \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u306A\u3069 Chromium \u7CFB\u306E\u30D6\u30E9\u30A6\u30B6\u3067\u4F7F\u3048\u307E\u3059\u3002","highlights.label":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u30CF\u30A4\u30E9\u30A4\u30C8","highlights.hint":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u4F4D\u7F6E\u306B\u67D4\u3089\u304B\u3044\u5149\u304C\u5F53\u305F\u308A\u307E\u3059\u3002\u30BF\u30C3\u30C1\u753B\u9762\u3068\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u3067\u306F\u30AA\u30D5\u306B\u306A\u308A\u307E\u3059\u3002","section.compat":"\u4E92\u63DB\u6027","exclude.label":"\u5909\u66F4\u3057\u306A\u3044\u8981\u7D20","exclude.hint":"CSS \u30BB\u30EC\u30AF\u30BF\u30FC\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\u6307\u5B9A\u3057\u307E\u3059\u3002\u307B\u304B\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u304C\u5D29\u308C\u308B\u3068\u304D\u306B\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u30BB\u30EC\u30AF\u30BF\u30FC\u306E\u66F8\u304D\u65B9\u304C\u6B63\u3057\u304F\u306A\u3044\u305F\u3081\u3001\u7121\u8996\u3057\u3066\u3044\u307E\u3059\u3002","diag.title":"\u8A3A\u65AD\u60C5\u5831","diag.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762","diag.lenses":"\u5C48\u6298\u4E2D","diag.tokens":"DSH \u306E\u30C6\u30FC\u30DE\u30C8\u30FC\u30AF\u30F3","diag.tokens.ok":"\u3059\u3079\u3066\u898B\u3064\u304B\u308A\u307E\u3057\u305F","diag.tokens.missing":"\u3053\u306E\u7248\u306E DSH \u306B\u306A\u3044\u3082\u306E: {list}","diag.tokens.ambiguous":"\u533A\u5225\u3067\u304D\u306A\u3044\u3082\u306E: {list}","diag.scan":"\u8D70\u67FB","diag.scan.value":"{batches} \u56DE\u3001\u6700\u9577 {longest} ms","diag.copy":"\u8A3A\u65AD\u60C5\u5831\u3092\u30B3\u30D4\u30FC","diag.copied":"\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F","diag.copy.failed":"\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u4E0B\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u9078\u629E\u3057\u3066\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002","kind.sidebar":"\u30B5\u30A4\u30C9\u30D0\u30FC","kind.composer":"\u5165\u529B\u6B04","kind.panel":"\u30D1\u30CD\u30EB","kind.menu":"\u30E1\u30CB\u30E5\u30FC","kind.smoke":"\u30C8\u30FC\u30B9\u30C8\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7","kind.code":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","kind.backdrop":"\u80CC\u666F","save.local":"\u3053\u306E\u63A5\u7D9A\u3067\u306F\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u5909\u66F4\u306F\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u307E\u3067\u6709\u52B9\u3067\u3059\u3002","save.error":"\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u5143\u306E\u5024\u306B\u623B\u3057\u307E\u3057\u305F\u3002","save.saving":"\u4FDD\u5B58\u4E2D\u2026",footer:"dsh-glassui {version}\u3002\u975E\u516C\u5F0F\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u3067\u3001DeepSeek \u3068\u306F\u95A2\u4FC2\u3042\u308A\u307E\u305B\u3093\u3002"},Lt={"inline.label":"\u884C\u5185\u4EE3\u7801\u4E0D\u900F\u660E\u5EA6","inline.readable":"\u6613\u8BFB","inline.hint":"\u72EC\u7ACB\u4E8E\u4EE3\u7801\u5757\u548C\u900F\u660E\u5EA6\u3002\u63A8\u8350\uFF1A60\u201385\u3002\u5BF9\u6BD4\u5EA6\u504F\u597D\u53EF\u80FD\u63D0\u9AD8\u4E0D\u900F\u660E\u5EA6\u3002","inline.preview":"\u884C\u5185\u4EE3\u7801\u9884\u89C8","inline.example":"\u5728\u6D88\u606F\u4E2D\u4F7F\u7528\uFF1A",updateReason_profile:"\u8FDE\u63A5\u7684\u914D\u7F6E\u73AF\u5883\u5DF2\u6539\u53D8\u3002\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002",updateTitle:"Glass UI\u63D2\u4EF6",updateIdle:"\u5C1A\u672A\u68C0\u67E5\u66F4\u65B0\u3002",updateChecking:"\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026",updateCurrent:"\u6CA1\u6709\u66F4\u65B0\u7684\u6B63\u5F0F\u7248\u672C\u3002",updateAvailable:"\u63D2\u4EF6\u6709\u66F4\u65B0\u3002\u58C1\u7EB8\u3001\u6548\u679C\u548C\u6392\u9664\u8BBE\u7F6E\u4F1A\u4FDD\u7559\u3002",updateBlocked:"\u65E0\u6CD5\u68C0\u67E5\u66F4\u65B0\uFF0C\u6216\u6B64\u73AF\u5883\u4E0D\u5141\u8BB8\u66F4\u65B0\u3002",updatePreparing:"\u6B63\u5728\u4E0B\u8F7D\u5E76\u9A8C\u8BC1\u53D1\u5E03\u6587\u4EF6\u2026",updateInstalling:"\u6B63\u5728\u5B89\u88C5\u63D2\u4EF6\u2026",updateRestart:"\u5DF2\u5B89\u88C5\u3002\u5B8C\u6210\u5F53\u524D\u5DE5\u4F5C\u540E\uFF0C\u8BF7\u91CD\u65B0\u542F\u52A8DSH\u4EE5\u5E94\u7528\u66F4\u65B0\u3002",updateApplied:"\u66F4\u65B0\u540E\u7684\u63D2\u4EF6\u7248\u672C\u6B63\u5728\u8FD0\u884C\u3002",updateFailed:"\u66F4\u65B0\u5931\u8D25\u3002\u8BF7\u68C0\u67E5\u9636\u6BB5\u5E76\u91CD\u8BD5\u3002",updateCancelled:"\u5B89\u88C5\u7A0B\u5E8F\u5DF2\u786E\u8BA4\u53D6\u6D88\u3002",updateOverridden:"\u4E0A\u5C42\u8BBE\u7F6E\u963B\u6B62\u4E86\u66F4\u65B0\u5E94\u7528\u3002",updateUnknown:"\u5B89\u88C5\u7ED3\u679C\u672A\u77E5\u3002\u8BF7\u5148\u6838\u5BF9\u7ED3\u679C\uFF0C\u4E0D\u8981\u91CD\u65B0\u53D1\u9001\u5B89\u88C5\u3002",updateCheck:"\u68C0\u67E5\u63D2\u4EF6\u66F4\u65B0",updateInstall:"\u66F4\u65B0\u63D2\u4EF6",updateReconcile:"\u6838\u5BF9\u5B89\u88C5\u7ED3\u679C",updateManual:"\u53D1\u5E03\u7248\u672C\u4E0E\u624B\u52A8\u66F4\u65B0",updateChecked:"\u68C0\u67E5\u65F6\u95F4",updateStage:"\u5B89\u88C5\u9636\u6BB5","updateReason_manager-unavailable":"\u6B64\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\u3002\u8BF7\u4ECE\u53D1\u5E03\u9875\u9762\u66F4\u65B0\u3002","updateReason_read-only":"\u6B64\u73AF\u5883\u4E0D\u80FD\u4FEE\u6539\u6B64\u63D2\u4EF6\u3002",updateReason_source:"\u6B64\u5B89\u88C5\u6765\u6E90\u9700\u8981\u624B\u52A8\u66F4\u65B0\uFF1B\u4FDD\u7559\u7248\u672C\u56FA\u5B9A\u3002",updateReason_incompatible:"\u6B64\u7248\u672C\u4E0D\u652F\u6301\u5F53\u524DDSH\u7248\u672C\u3002","updateReason_compatibility-unknown":"\u65E0\u6CD5\u786E\u8BA4\u6B64\u53D1\u5E03\u7248\u7684DSH\u517C\u5BB9\u6027\u3002",updateReason_busy:"\u5176\u4ED6\u66F4\u65B0\u6216\u8BBE\u7F6E\u53D8\u66F4\u6B63\u5728\u8FDB\u884C\u3002\u5B8C\u6210\u540E\u518D\u91CD\u8BD5\u3002",updateReason_network:"\u65E0\u6CD5\u8FDE\u63A5\u53D1\u5E03\u670D\u52A1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",updateReason_metadata:"\u53D1\u5E03\u5143\u6570\u636E\u65E0\u6548\uFF0C\u8BF7\u67E5\u770B\u53D1\u5E03\u9875\u9762\u3002",updateReason_asset:"\u6240\u9700\u53D1\u5E03\u6587\u4EF6\u7F3A\u5931\u6216\u91CD\u590D\u3002",updateReason_channel:"\u53EA\u652F\u6301\u6B63\u5F0F\u7248\u672C\u3002",updateReason_checksum:"\u53D1\u5E03\u6587\u4EF6\u6821\u9A8C\u548C\u9A8C\u8BC1\u5931\u8D25\u3002",updateReason_redirect:"\u4E0B\u8F7D\u88AB\u91CD\u5B9A\u5411\u5230\u672A\u5141\u8BB8\u7684\u4E3B\u673A\u3002",updateReason_size:"\u53D1\u5E03\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u9650\u5236\u3002","updateReason_stale-candidate":"\u53D1\u5E03\u4FE1\u606F\u6216\u5B89\u88C5\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002","updateReason_release-unavailable":"\u6CA1\u6709\u53EF\u8BBF\u95EE\u7684\u53D1\u5E03\u7248\u672C\u3002",updateReason_reinstall:"\u5DF2\u5B89\u88C5\u7684\u7248\u672C\u5DF2\u79FB\u9664\uFF0C\u4F46\u65B0\u7248\u672C\u6CA1\u6709\u5B8C\u6210\u5B89\u88C5\u3002\u8BF7\u4ECE Releases \u9875\u9762\u91CD\u65B0\u5B89\u88C5\u3002",updateReason_storage:"\u65E0\u6CD5\u5C06\u66F4\u65B0\u6587\u4EF6\u5199\u5165profile\u3002",updateReason_interrupted:"\u5B89\u88C5\u524D\u7684\u4E0B\u8F7D\u5DF2\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002",updateSettling:"\u6B63\u5728\u4FDD\u5B58\u5F85\u5904\u7406\u8BBE\u7F6E\u2026",updateReason_settings:"\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u6216\u8BBE\u7F6E\u5DF2\u5728\u5176\u4ED6\u7A97\u53E3\u4E2D\u6539\u53D8\u3002\u8BF7\u5148\u89E3\u51B3\u4FDD\u5B58\u9519\u8BEF\u3002",updateRunning:"\u8FD0\u884C\u7248\u672C",updateInstalledVersion:"\u5B89\u88C5\u7248\u672C",title:"Glass UI",subtitle:"\u8BBE\u7F6E\u73BB\u7483\u6750\u8D28\u3001\u5899\u7EB8\u548C\u663E\u793A\u6548\u679C\u3002","status.on":"\u5DF2\u5F00\u542F","status.off":"\u5DF2\u5173\u95ED","status.forced":"\u9AD8\u5BF9\u6BD4\u5EA6\u6A21\u5F0F\u4E0B\u5DF2\u6682\u505C","status.surfaces":"{count} \u4E2A\u73BB\u7483\u754C\u9762","section.material":"\u6750\u8D28","enable.label":"\u73BB\u7483\u6750\u8D28","enable.hint":"\u5173\u95ED\u540E\u6062\u590D DSH \u539F\u672C\u7684\u5916\u89C2\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u901A\u900F","tint.tinted":"\u7740\u8272","section.wallpaper":"\u5899\u7EB8","wallpaper.auto":"\u81EA\u52A8","wallpaper.auto.hint":"\u6D4F\u89C8\u5668\u4E2D\u4F7F\u7528 Bay\uFF0CmacOS \u5E94\u7528\u4E2D\u4E0D\u4F7F\u7528\u5899\u7EB8\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52A8\u6001","wallpaper.live.hint":"\u7F13\u6162\u6D41\u52A8\u3002\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u4FDD\u6301\u9759\u6B62\uFF0C\u8017\u7535\u7565\u9AD8\u4E8E\u9759\u6001\u5899\u7EB8\u3002","wallpaper.none":"\u65E0","wallpaper.custom":"\u81EA\u5B9A\u4E49","wallpaper.url.label":"\u56FE\u7247\u5730\u5740","wallpaper.url.placeholder":"https://\u2026 \u6216 /\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84.jpg","wallpaper.url.invalid":"\u8BF7\u4F7F\u7528 http(s) \u5730\u5740\u3001\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84\u6216 base64 \u56FE\u7247\u6570\u636E\u5730\u5740\u3002","section.layout":"\u5E03\u5C40\u4E0E\u6548\u679C","sidebar.label":"\u4FA7\u680F","sidebar.floating":"\u60AC\u6D6E","sidebar.docked":"\u505C\u9760","code.label":"\u4EE3\u7801\u5757","code.hint":"\u73BB\u7483\u6548\u679C\u4F7F\u7528\u8F83\u6D53\u7684\u8272\u8C03\uFF0C\u4EE3\u7801\u4F9D\u7136\u6E05\u6670\u6613\u8BFB\u3002","code.glass":"\u73BB\u7483","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u6298\u5C04","refraction.hint":"\u73BB\u7483\u8FB9\u7F18\u5904\u7684\u80CC\u666F\u4F1A\u4EA7\u751F\u5F2F\u66F2\u3002","refraction.unavailable":"\u9700\u8981 Chrome\u3001Edge \u6216 DSH \u684C\u9762\u5E94\u7528\u7B49\u57FA\u4E8E Chromium \u7684\u6D4F\u89C8\u5668\u3002","highlights.label":"\u6307\u9488\u9AD8\u5149","highlights.hint":"\u67D4\u548C\u7684\u5149\u4F1A\u8DDF\u968F\u6307\u9488\u3002\u5728\u89E6\u6478\u5C4F\u4E0A\u4EE5\u53CA\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u5173\u95ED\u3002","section.compat":"\u517C\u5BB9\u6027","exclude.label":"\u4E0D\u5904\u7406\u7684\u5143\u7D20","exclude.hint":"\u4EE5\u9017\u53F7\u5206\u9694\u7684 CSS \u9009\u62E9\u5668\u3002\u5F53\u5176\u4ED6\u63D2\u4EF6\u5728\u73BB\u7483\u6548\u679C\u4E0B\u663E\u793A\u5F02\u5E38\u65F6\u4F7F\u7528\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u8BE5\u9009\u62E9\u5668\u65E0\u6548\uFF0C\u5DF2\u88AB\u5FFD\u7565\u3002","diag.title":"\u8BCA\u65AD\u4FE1\u606F","diag.surfaces":"\u73BB\u7483\u754C\u9762","diag.lenses":"\u6B63\u5728\u6298\u5C04","diag.tokens":"DSH \u4E3B\u9898\u4EE4\u724C","diag.tokens.ok":"\u5168\u90E8\u627E\u5230","diag.tokens.missing":"\u6B64\u7248\u672C DSH \u4E2D\u4E0D\u5B58\u5728\uFF1A{list}","diag.tokens.ambiguous":"\u65E0\u6CD5\u533A\u5206\uFF1A{list}","diag.scan":"\u626B\u63CF","diag.scan.value":"{batches} \u6B21\uFF0C\u6700\u957F {longest} \u6BEB\u79D2","diag.copy":"\u590D\u5236\u8BCA\u65AD\u4FE1\u606F","diag.copied":"\u5DF2\u590D\u5236","diag.copy.failed":"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u4E0B\u65B9\u6587\u672C\u8FDB\u884C\u590D\u5236\u3002","kind.sidebar":"\u4FA7\u680F","kind.composer":"\u8F93\u5165\u6846","kind.panel":"\u9762\u677F","kind.menu":"\u83DC\u5355","kind.smoke":"\u63D0\u793A\u4E0E\u5DE5\u5177\u63D0\u793A","kind.code":"\u4EE3\u7801\u5757","kind.backdrop":"\u80CC\u666F","save.local":"\u5F53\u524D\u8FDE\u63A5\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u66F4\u6539\u5C06\u5728\u9875\u9762\u91CD\u65B0\u52A0\u8F7D\u524D\u6709\u6548\u3002","save.error":"\u65E0\u6CD5\u4FDD\u5B58\u66F4\u6539\uFF0C\u5DF2\u6062\u590D\u539F\u6765\u7684\u503C\u3002","save.saving":"\u6B63\u5728\u4FDD\u5B58\u2026",footer:"dsh-glassui {version}\u3002\u975E\u5B98\u65B9\u63D2\u4EF6\uFF0C\u4E0E DeepSeek \u65E0\u5173\u3002"};var m=require("react");var l=require("react/jsx-runtime"),js=1e3;function qs(a){return(0,m.useSyncExternalStore)(a.subscribe,a.getSnapshot)}function Ys(a){let e=(0,m.useSyncExternalStore)(a.subscribe,a.revision);return(0,m.useCallback)((t,s)=>a.translate(t,s),[a,e])}function Xs(){let a=()=>document.body.hasAttribute("data-ds-dark-theme")?"dark":"light",[e,t]=(0,m.useState)(a);return(0,m.useEffect)(()=>{let s=new MutationObserver(()=>t(a()));return s.observe(document.body,{attributes:!0,attributeFilter:["data-ds-dark-theme"]}),()=>s.disconnect()},[]),e}function ce(a){return(0,l.jsxs)("div",{className:"glassui-row",children:[(0,l.jsxs)("div",{className:"glassui-row__text",children:[a.htmlFor?(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:a.htmlFor,children:a.label}):(0,l.jsx)("span",{className:"glassui-row__label",children:a.label}),a.hint?(0,l.jsx)("span",{className:"glassui-row__hint",children:a.hint}):null]}),(0,l.jsx)("div",{className:"glassui-row__control",children:a.children})]})}function Qe(a){return(0,l.jsx)("button",{type:"button",role:"switch",className:"glassui-switch","aria-checked":a.checked,"aria-label":a.label,disabled:a.disabled,onClick:()=>a.onChange(!a.checked)})}function Dt(a){let e=[...a.currentTarget.querySelectorAll('[role="radio"]')],t=e.findIndex(i=>i===a.target);if(t<0)return;let s;switch(a.key){case"ArrowRight":case"ArrowDown":s=(t+1)%e.length;break;case"ArrowLeft":case"ArrowUp":s=(t+e.length-1)%e.length;break;case"Home":s=0;break;case"End":s=e.length-1;break;default:return}a.preventDefault(),e[s]?.focus(),e[s]?.click()}function Nt(a){let e=Math.max(0,a.options.findIndex(t=>t.value===a.value));return(0,l.jsxs)("div",{className:"glassui-segmented",role:"radiogroup","aria-label":a.label,onKeyDown:Dt,style:{"--glassui-segments":a.options.length,"--glassui-index":e},children:[(0,l.jsx)("span",{className:"glassui-segmented__thumb","aria-hidden":"true"}),a.options.map(t=>(0,l.jsx)("button",{type:"button",role:"radio","aria-checked":t.value===a.value,tabIndex:t.value===a.value?0:-1,className:"glassui-segmented__option",onClick:()=>a.onChange(t.value),children:t.label},t.value))]})}function It(a){let[e,t]=(0,m.useState)(a.value);(0,m.useEffect)(()=>t(a.value),[a.value]);let s=a.validate?e.trim()!==""&&!a.validate(e.trim()):!1,i=()=>{let r=e.trim();r===a.value||s||a.onCommit(r)};return(0,l.jsxs)("div",{className:"glassui-field",children:[(0,l.jsx)("input",{id:a.id,className:"glassui-input",value:e,placeholder:a.placeholder,spellCheck:!1,autoComplete:"off","aria-invalid":a.invalid||s,onChange:r=>t(r.target.value),onBlur:i,onKeyDown:r=>{r.key==="Enter"&&i()}}),a.invalid||s?(0,l.jsx)("span",{className:"glassui-field__error",role:"alert",children:a.message}):null]})}function Ze(a){if(a==="auto")return"bay";if(!(a==="none"||a==="custom"))return a}var Js=(0,m.memo)(function(e){let{t}=e;return(0,l.jsx)("div",{className:"glassui-wallpapers",role:"radiogroup","aria-label":t("section.wallpaper"),onKeyDown:Dt,children:Pe.map(s=>{let i=Ze(s),r=i?le(i,e.scheme):void 0,n=s!=="auto"&&i!==void 0&&ge(i),o=t(`wallpaper.${s}`);return(0,l.jsxs)("button",{type:"button",role:"radio","aria-checked":e.value===s,tabIndex:e.value===s?0:-1,"aria-label":n?`${o}, ${t("wallpaper.live")}`:o,className:"glassui-wallpaper","data-choice":s,onClick:()=>e.onChange(s),children:[(0,l.jsxs)("span",{className:"glassui-wallpaper__swatch","aria-hidden":"true",style:r?{backgroundImage:r}:void 0,children:[s==="auto"?(0,l.jsx)("span",{className:"glassui-wallpaper__badge",children:"A"}):null,n?(0,l.jsx)("span",{className:"glassui-wallpaper__badge","data-kind":"live",children:t("wallpaper.live")}):null]}),(0,l.jsx)("span",{className:"glassui-wallpaper__name",children:o})]},s)})})});function Qs(a){let{state:e,t}=a,{diagnostics:s}=e,[i,r]=(0,m.useState)("idle"),n=()=>JSON.stringify({version:a.version,settings:{...e.settings,wallpaperUrl:e.settings.wallpaperUrl?"[configured]":""},diagnostics:s,userAgent:navigator.userAgent},null,2),o=pe.filter(u=>s.surfaces[u]>0).map(u=>`${t(`kind.${u}`)} ${s.surfaces[u]}`).join(" \xB7 "),d=s.missingTokens.length===0&&s.ambiguousTokens.length===0?t("diag.tokens.ok"):[s.missingTokens.length>0?t("diag.tokens.missing",{list:s.missingTokens.join(", ")}):"",s.ambiguousTokens.length>0?t("diag.tokens.ambiguous",{list:s.ambiguousTokens.join(", ")}):""].filter(Boolean).join(" "),c=async()=>{let u=n();try{await navigator.clipboard.writeText(u),r("done")}catch{r("failed")}};return(0,l.jsxs)("div",{className:"glassui-diagnostics",children:[(0,l.jsxs)("dl",{className:"glassui-facts",children:[(0,l.jsx)("dt",{children:t("diag.surfaces")}),(0,l.jsx)("dd",{children:o||"\u2014"}),(0,l.jsx)("dt",{children:t("diag.lenses")}),(0,l.jsx)("dd",{children:s.lenses}),(0,l.jsx)("dt",{children:t("diag.tokens")}),(0,l.jsx)("dd",{children:d}),(0,l.jsx)("dt",{children:t("diag.scan")}),(0,l.jsx)("dd",{children:t("diag.scan.value",{batches:s.scans.batches,longest:s.scans.longestMs.toFixed(1)})})]}),(0,l.jsx)("div",{className:"glassui-actions",children:(0,l.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{c()},children:t(i==="done"?"diag.copied":"diag.copy")})}),i==="failed"?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("p",{className:"glassui-note",children:t("diag.copy.failed")}),(0,l.jsx)("textarea",{className:"glassui-report",readOnly:!0,value:n(),"aria-label":t("diag.title")})]}):null]})}var Zs={idle:"updateIdle",checking:"updateChecking",current:"updateCurrent",available:"updateAvailable",blocked:"updateBlocked",settling:"updateSettling",starting:"updatePreparing",preparing:"updatePreparing",installing:"updateInstalling","restart-required":"updateRestart",applied:"updateApplied",failed:"updateFailed",cancelled:"updateCancelled",overridden:"updateOverridden",unknown:"updateUnknown"};function ea({controller:a,t:e}){let t=(0,m.useSyncExternalStore)(a.subscribe,a.getSnapshot);(0,m.useEffect)(()=>{a.load()},[a]);let s=["settling","checking","starting","preparing","installing"].includes(t.status),i=`updateReason_${t.reason}`in Le?`updateReason_${t.reason}`:"updateReason_network";return(0,l.jsxs)("section",{className:"glassui-section glassui-update","aria-label":e("updateTitle"),children:[(0,l.jsx)("h3",{className:"glassui-section__title",children:e("updateTitle")}),(0,l.jsxs)("div",{className:"glassui-card glassui-stack",children:[(0,l.jsxs)("p",{children:[e("updateRunning"),": ",t.runtimeVersion??"0.2.2",t.installedVersion?` \xB7 ${e("updateInstalledVersion")}: ${t.installedVersion}`:""]}),(0,l.jsx)("p",{role:["failed","blocked"].includes(t.status)?"alert":"status",children:e(Zs[t.status])}),t.reason?(0,l.jsx)("p",{className:"glassui-note",children:e(i)}):null,t.checkedAt?(0,l.jsxs)("p",{className:"glassui-note",children:[e("updateChecked"),": ",new Date(t.checkedAt).toLocaleString()]}):null,t.candidate?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)("p",{children:[t.runtimeVersion," \u2192 ",t.candidate.version," \xB7 DSH ",t.candidate.compatibility]}),(0,l.jsx)("p",{className:"glassui-update__notes",children:t.candidate.notes})]}):t.version?(0,l.jsxs)("p",{children:[t.runtimeVersion," \u2192 ",t.version]}):null,(0,l.jsxs)("div",{className:"glassui-actions",children:[(0,l.jsx)("button",{type:"button",className:"glassui-button",disabled:s||t.status==="unknown"||t.status==="restart-required",onClick:()=>{a.check()},children:e("updateCheck")}),t.status==="available"?(0,l.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{a.begin()},children:e("updateInstall")}):null,t.status==="unknown"?(0,l.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{a.load()},children:e("updateReconcile")}):null,(0,l.jsx)("a",{href:"https://github.com/Aero123421/dsh-glassui/releases",target:"_blank",rel:"noopener noreferrer",children:e("updateManual")})]}),t.result?(0,l.jsxs)("p",{className:"glassui-note",children:[e("updateStage"),": ",t.result.stage,t.result.error?` \xB7 ${t.result.error.code}`:""]}):null]})]})}function Mt(a){let e=qs(a.controller),t=(0,m.useSyncExternalStore)(a.updates.subscribe,a.updates.getSnapshot),s=Ys(a.locale),i=Xs(),r=(0,m.useCallback)(p=>a.controller.update("wallpaper",p),[a.controller]),n=(0,m.useId)(),{settings:o,diagnostics:d}=e,c=(p,v)=>a.controller.update(p,v);(0,m.useEffect)(()=>{let p=setInterval(()=>a.controller.refreshDiagnostics(),js);return()=>clearInterval(p)},[a.controller]);let u=pe.filter(p=>p!=="backdrop").reduce((p,v)=>p+d.surfaces[v],0),f=d.running?`${s("status.on")} \xB7 ${s("status.surfaces",{count:u})}`:d.idle==="forced-colors"?s("status.forced"):s("status.off");return(0,l.jsxs)("div",{className:"glassui-page","data-testid":"glassui-settings",children:[(0,l.jsxs)("header",{className:"glassui-hero",children:[(0,l.jsx)("div",{className:"glassui-hero__art","aria-hidden":"true",style:{backgroundImage:le(Ze(o.wallpaper)??"bay",i)},children:(0,l.jsx)("span",{className:"glassui-hero__pane"})}),(0,l.jsxs)("div",{className:"glassui-hero__text",children:[(0,l.jsx)("h2",{className:"glassui-hero__title",children:s("title")}),(0,l.jsx)("p",{className:"glassui-hero__subtitle",children:s("subtitle")}),(0,l.jsx)("span",{className:"glassui-status","data-on":d.running,children:f})]})]}),e.save==="local"||e.save==="error"?(0,l.jsx)("p",{className:"glassui-banner",role:"status",children:s(e.save==="local"?"save.local":"save.error")}):null,(0,l.jsxs)("fieldset",{className:"glassui-settings-controls",disabled:e.updating||["settling","starting","preparing","installing"].includes(t.status),children:[(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${n}-material`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${n}-material`,children:s("section.material")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(ce,{label:s("enable.label"),hint:s("enable.hint"),children:(0,l.jsx)(Qe,{checked:o.enabled,label:s("enable.label"),onChange:p=>c("enabled",p)})}),(0,l.jsxs)("div",{className:"glassui-slider",children:[(0,l.jsxs)("div",{className:"glassui-slider__head",children:[(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:`${n}-tint`,children:s("tint.label")}),(0,l.jsx)("span",{className:"glassui-slider__value",children:o.tint})]}),(0,l.jsx)("input",{id:`${n}-tint`,type:"range",min:0,max:100,step:1,value:o.tint,className:"glassui-range",style:{"--glassui-progress":`${o.tint}%`},onChange:p=>c("tint",Number(p.target.value))}),(0,l.jsxs)("div",{className:"glassui-slider__ends","aria-hidden":"true",children:[(0,l.jsx)("span",{children:s("tint.clear")}),(0,l.jsx)("span",{children:s("tint.tinted")})]})]})]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${n}-wallpaper`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${n}-wallpaper`,children:s("section.wallpaper")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(Js,{value:o.wallpaper,scheme:i,t:s,onChange:r}),o.wallpaper==="auto"?(0,l.jsx)("p",{className:"glassui-note",children:s("wallpaper.auto.hint")}):null,o.wallpaper!=="auto"&&ge(Ze(o.wallpaper)??"bay")?(0,l.jsx)("p",{className:"glassui-note",children:s("wallpaper.live.hint")}):null,o.wallpaper==="custom"?(0,l.jsx)(ce,{label:s("wallpaper.url.label"),htmlFor:`${n}-url`,children:(0,l.jsx)(It,{id:`${n}-url`,value:o.wallpaperUrl,placeholder:s("wallpaper.url.placeholder"),invalid:o.wallpaperUrl!==""&&!ue(o.wallpaperUrl),message:s("wallpaper.url.invalid"),validate:ue,onCommit:p=>c("wallpaperUrl",p)})}):null]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${n}-layout`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${n}-layout`,children:s("section.layout")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsx)(ce,{label:s("sidebar.label"),children:(0,l.jsx)(Nt,{label:s("sidebar.label"),value:o.sidebar,options:[{value:"floating",label:s("sidebar.floating")},{value:"docked",label:s("sidebar.docked")}],onChange:p=>c("sidebar",p)})}),(0,l.jsx)(ce,{label:s("code.label"),hint:s("code.hint"),children:(0,l.jsx)(Nt,{label:s("code.label"),value:o.codeBlocks,options:[{value:"glass",label:s("code.glass")},{value:"solid",label:s("code.solid")}],onChange:p=>c("codeBlocks",p)})}),(0,l.jsxs)("div",{className:"glassui-inline-settings",children:[(0,l.jsxs)("div",{className:"glassui-slider",children:[(0,l.jsxs)("div",{className:"glassui-slider__head",children:[(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:`${n}-inline-opacity`,children:s("inline.label")}),(0,l.jsx)("span",{className:"glassui-slider__value",children:o.inlineCodeOpacity})]}),(0,l.jsx)("input",{id:`${n}-inline-opacity`,type:"range",min:0,max:100,step:1,value:o.inlineCodeOpacity,className:"glassui-range","aria-describedby":`${n}-inline-hint`,style:{"--glassui-progress":`${o.inlineCodeOpacity}%`},onChange:p=>c("inlineCodeOpacity",Number(p.target.value))}),(0,l.jsxs)("div",{className:"glassui-slider__ends","aria-hidden":"true",children:[(0,l.jsx)("span",{children:s("tint.clear")}),(0,l.jsx)("span",{children:s("inline.readable")})]})]}),(0,l.jsx)("p",{className:"glassui-note",id:`${n}-inline-hint`,children:s("inline.hint")}),(0,l.jsx)("div",{className:"glassui-inline-preview","aria-label":s("inline.preview"),children:(0,l.jsxs)("p",{children:[s("inline.example")," ",(0,l.jsx)("code",{children:"grep"})," \xB7 ",(0,l.jsx)("code",{children:"path"})," \xB7 ",(0,l.jsx)("code",{children:"@deepseek-ai/dsh"})]})})]}),(0,l.jsx)(ce,{label:s("refraction.label"),hint:a.refractionSupported?s("refraction.hint"):s("refraction.unavailable"),children:(0,l.jsx)(Qe,{checked:o.refraction&&a.refractionSupported,label:s("refraction.label"),disabled:!a.refractionSupported,onChange:p=>c("refraction",p)})}),(0,l.jsx)(ce,{label:s("highlights.label"),hint:s("highlights.hint"),children:(0,l.jsx)(Qe,{checked:o.highlights,label:s("highlights.label"),onChange:p=>c("highlights",p)})})]})]}),(0,l.jsxs)("section",{className:"glassui-section","aria-labelledby":`${n}-compat`,children:[(0,l.jsx)("h3",{className:"glassui-section__title",id:`${n}-compat`,children:s("section.compat")}),(0,l.jsxs)("div",{className:"glassui-card",children:[(0,l.jsxs)("div",{className:"glassui-stack",children:[(0,l.jsx)("label",{className:"glassui-row__label",htmlFor:`${n}-exclude`,children:s("exclude.label")}),(0,l.jsx)("span",{className:"glassui-row__hint",children:s("exclude.hint")}),(0,l.jsx)(It,{id:`${n}-exclude`,value:o.exclude,placeholder:s("exclude.placeholder"),invalid:d.invalidExclude,message:s("exclude.invalid"),onCommit:p=>c("exclude",p)})]}),(0,l.jsxs)("div",{className:"glassui-stack",children:[(0,l.jsx)("span",{className:"glassui-row__label",children:s("diag.title")}),(0,l.jsx)(Qs,{state:e,t:s,version:a.version})]})]})]})]}),(0,l.jsx)(ea,{controller:a.updates,t:s}),(0,l.jsx)("footer",{className:"glassui-footer",children:e.save==="saving"?s("save.saving"):s("footer",{version:a.version})})]})}var Ot=`/* Settings page of dsh-glassui. Every color comes from DSH's theme tokens, so the
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

.glassui-page .glassui-settings-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
  border: 0;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}
.glassui-page .glassui-update p {
  margin: 0;
  overflow-wrap: anywhere;
}
.glassui-page .glassui-update__notes {
  white-space: pre-wrap;
  max-height: 180px;
  overflow: auto;
}
.glassui-page .glassui-update .glassui-actions {
  flex-wrap: wrap;
}
.glassui-page .glassui-update a {
  color: var(--dsw-alias-label-primary);
  text-decoration: underline;
}

.glassui-page .glassui-update .glassui-card {
  gap: 10px;
}
.glassui-page .glassui-update .glassui-card > * + * {
  border-top: 0;
}
.glassui-page .glassui-update .glassui-note {
  padding: 0;
}
.glassui-page .glassui-update .glassui-button {
  height: auto;
  min-height: 32px;
  max-width: 100%;
  padding: 6px 10px;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 20px;
  flex-shrink: 0;
}

.glassui-inline-settings {
  padding: 16px 0;
}

.glassui-inline-preview {
  padding: 16px;
  border-radius: 12px;
  background:
    repeating-linear-gradient(135deg, rgb(128 128 128 / 0.12) 0 12px, transparent 12px 24px),
    var(--glassui-wallpaper, none) center / cover;
}

.glassui-inline-preview p {
  margin: 0;
  line-height: 2;
  overflow-wrap: anywhere;
}

.glassui-inline-preview code {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--dsw-alias-markdown-inline-code);
  color: inherit;
}

.glassui-inline-preview code {
  white-space: normal;
  overflow-wrap: anywhere;
}

.glassui-inline-settings .glassui-slider__head {
  gap: 8px;
}

.glassui-inline-settings .glassui-slider__value {
  flex-shrink: 0;
}

@container glassui-settings (max-width: 200px) {
  .glassui-hero__art {
    max-width: 100%;
  }

  .glassui-status {
    box-sizing: border-box;
    max-width: 100%;
  }

  .glassui-button {
    box-sizing: border-box;
    height: auto;
    min-height: 30px;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .glassui-actions {
    flex-wrap: wrap;
  }

  .glassui-note,
  .glassui-status,
  .glassui-footer {
    overflow-wrap: anywhere;
  }
}
`;var Pt=require("react/jsx-runtime"),sa=Oe,aa=[],Ne="__DSH_GLASSUI_DEBUG__",ia=880;function na(){let a=globalThis[at];return typeof a=="object"&&a!==null&&"settings"in a?z(a.settings):{...te}}function ra(){let a=document.createElement("style");return a.setAttribute("data-glassui-settings-style",""),a.textContent=Ot,document.head.append(a),()=>a.remove()}function oa(a){if(typeof document>"u")return;let e=$t(window),t="0.2.2",s={},i=new Ce(window,e,()=>s.controller?.refreshDiagnostics()),r=new ve(i,na());s.controller=r;let n=new me(void 0,()=>r.settleForUpdate(),()=>r.getSnapshot().settings);a.effect(()=>()=>n.dispose(),"dsh-glassui: update state"),a.inject(["connection"],o=>{o.effect(()=>n.attach(o.connection),"dsh-glassui: update connection"),o.on?.("connection/reset",()=>{n.load()})}),a.effect(()=>{let o={version:t,settings:()=>r.getSnapshot().settings,diagnostics:()=>i.diagnostics()};return globalThis[Ne]=o,()=>{r.dispose(),i.dispose(),globalThis[Ne]===o&&Reflect.deleteProperty(globalThis,Ne)}},"dsh-glassui: engine"),a.inject(["configForms"],o=>{o.effect(()=>r.attach(o.configForms.get(Oe)),"dsh-glassui: settings sync")}),a.inject(["slots","locale"],o=>{o.effect(()=>o.locale.register(Je,{en:Le,ja:Ct,zh:Lt}),"dsh-glassui: copy"),o.effect(ra,"dsh-glassui: settings styles");let d=o.locale.bind(Je),c=(f,p)=>d(f,p),u={subscribe:f=>o.locale.subscribe(f),revision:()=>o.locale.getSnapshot().revision,translate:c};o.slots.inject("settings.section",()=>o.slots.register({name:"settings.section",id:"glassui",order:ia,label:()=>c("title")},()=>(0,Pt.jsx)(Mt,{controller:r,updates:n,locale:u,version:t,refractionSupported:e.refraction})))})}

return module.exports;}});
