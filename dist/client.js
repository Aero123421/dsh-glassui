/*! dsh-glassui 0.2.6 | MIT License | https://github.com/Aero123421/dsh-glassui#readme */
window.__ModuleLoader__.load({id:"dsh-glassui",factory(require){const module={exports:{}};const exports=module.exports;
"use strict";var Pe=Object.defineProperty;var Qt=Object.getOwnPropertyDescriptor;var Zt=Object.getOwnPropertyNames;var es=Object.prototype.hasOwnProperty;var ts=(i,e)=>{for(var t in e)Pe(i,t,{get:e[t],enumerable:!0})},ss=(i,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of Zt(e))!es.call(i,a)&&a!==t&&Pe(i,a,{get:()=>e[a],enumerable:!(s=Qt(e,a))||s.enumerable});return i};var is=i=>ss(Pe({},"__esModule",{value:!0}),i);var Yi={};ts(Yi,{DEBUG_GLOBAL:()=>Oe,apply:()=>qi,inject:()=>Hi,name:()=>Bi});module.exports=is(Yi);var Ke="dsh-glassui",ct="__DSH_GLASSUI__",as=["bay","sunrise","meadow","graphite","lagoon","dusk","dune","tide","aurora","bloom","prism"],ze=["auto",...as,"none","custom"],ns=["floating","docked"],rs=["glass","solid"],oe=Object.freeze({enabled:!0,tint:35,wallpaper:"auto",wallpaperUrl:"",sidebar:"floating",codeBlocks:"glass",inlineCodeOpacity:72,refraction:!0,highlights:!0,exclude:""}),ut=2048,os=1e3,ls=/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;function ve(i){if(i.length===0||i.length>ut||/["'()\\\s<>]/.test(i))return!1;if(ls.test(i)||i.startsWith("/")&&!i.startsWith("//")||i.startsWith("./")||i.startsWith("../"))return!0;try{let e=new URL(i);return e.protocol==="https:"||e.protocol==="http:"}catch{return!1}}function Fe(i,e,t){return typeof e=="string"&&i.includes(e)?e:t}function Ue(i,e){return typeof i=="boolean"?i:e}function dt(i,e,t){return typeof i=="string"&&i.length<=e?i.trim():t}function Y(i){let e=typeof i=="object"&&i!==null?i:{},t=oe,s=typeof e.tint=="number"&&Number.isFinite(e.tint)?Math.min(100,Math.max(0,Math.round(e.tint))):t.tint;return{enabled:Ue(e.enabled,t.enabled),tint:s,wallpaper:Fe(ze,e.wallpaper,t.wallpaper),wallpaperUrl:dt(e.wallpaperUrl,ut,t.wallpaperUrl),sidebar:Fe(ns,e.sidebar,t.sidebar),codeBlocks:Fe(rs,e.codeBlocks,t.codeBlocks),inlineCodeOpacity:typeof e.inlineCodeOpacity=="number"&&Number.isFinite(e.inlineCodeOpacity)?Math.min(100,Math.max(0,Math.round(e.inlineCodeOpacity))):t.inlineCodeOpacity,refraction:Ue(e.refraction,t.refraction),highlights:Ue(e.highlights,t.highlights),exclude:dt(e.exclude,os,t.exclude)}}function pt(i,e){return Object.keys(oe).every(t=>i[t]===e[t])}var ds="dsh-glassui:update",cs=new Set(["manager-unavailable","read-only","source","metadata","asset","channel","incompatible","compatibility-unknown","busy","checksum","redirect","size","stale-candidate","release-unavailable","storage","interrupted","settings","profile","manual-update","reinstall","restored","restore-failed","restore-pending","restore-offer","restore-limit"]);function ht(i){let t=/^dsh-glassui\/([a-z0-9-]+)$/.exec(String(i?.message??""))?.[1];return t&&cs.has(t)?t:"network"}var we=class{constructor(e,t,s,a){if(a===void 0)try{a=globalThis.sessionStorage}catch{}this.connection=e,this.settleSettings=t,this.settings=s,this.storage=a,this.listeners=new Set,this.state={status:"blocked",reason:"manager-unavailable"},this.generation=0,this.closed=!1,this.timer=null,this.profileKey=void 0,this.requestId=void 0}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));storageKey(){return this.profileKey?`${ds}:${this.profileKey}`:void 0}selectProfile(e){let t=typeof e=="string"&&/^[a-f0-9]{64}$/.test(e)?e:void 0;if(t!==this.profileKey&&(this.profileKey=t,this.requestId=void 0,t))try{this.requestId=this.storage?.getItem(this.storageKey())||void 0}catch{}}publish(e){if(!this.closed){e.profileKey&&this.selectProfile(e.profileKey),this.state=e;for(let t of this.listeners)t()}}attach(e){return this.connection=e,this.load(),()=>{this.connection===e&&(this.connection=void 0,this.generation++,this.publish({...this.state,status:"blocked",reason:"manager-unavailable"}))}}async call(e,t={}){if(!this.connection)return{status:"blocked",reason:"manager-unavailable"};let s=await this.connection.rpc.call("/api",`dsh-glassui/update-${e}`,t);if(!s.ok){let a=new Error(s.error.code);throw a.rejected=!0,a}return s.value}async load(){if(this.closed)return;let e=++this.generation;clearTimeout(this.timer);try{let t=await this.call("status");if(this.closed||e!==this.generation)return;this.selectProfile(t.profileKey),t.requestId&&(this.requestId=t.requestId);let s=this.requestId?await this.call("reconcile",{requestId:this.requestId,profileKey:this.profileKey}):t;if(this.closed||e!==this.generation)return;if(s.requestId){this.requestId=s.requestId;try{this.storage?.setItem(this.storageKey(),s.requestId)}catch{}}this.publish(s),["preparing","installing"].includes(s.status)&&(this.timer=setTimeout(()=>{this.load()},800))}catch{e===this.generation&&this.publish({...this.state,status:this.requestId?"unknown":"blocked",reason:"network"})}}async check(){if(this.closed||["settling","checking","preparing","installing","starting","unknown"].includes(this.state.status))return;let e=++this.generation;this.publish({...this.state,status:"checking"});try{let t=await this.call("check");e===this.generation&&this.publish(t)}catch{e===this.generation&&this.publish({...this.state,status:"blocked",reason:"network"})}}async restore(){if(this.closed||!this.profileKey||!this.requestId||this.state.reason!=="restore-offer"&&this.state.reason!=="restore-limit")return;let e=++this.generation;this.publish({...this.state,status:"installing"});try{let t=await this.call("restore",{requestId:this.requestId,profileKey:this.profileKey});if(this.closed||e!==this.generation)return;this.publish(t)}catch(t){if(this.closed||e!==this.generation)return;this.publish({...this.state,status:"unknown",reason:ht(t)})}}async begin(){if(this.closed||!this.profileKey||this.state.status!=="available")return;let e=this.state.candidate,t=++this.generation;this.publish({...this.state,status:"settling"});let s;try{s=await this.settleSettings()}catch{!this.closed&&t===this.generation&&this.publish({...this.state,status:"failed",reason:"settings"});return}if(this.closed||t!==this.generation){s();return}this.requestId=crypto.randomUUID();try{this.storage?.setItem(this.storageKey(),this.requestId)}catch{}this.publish({...this.state,status:"starting"});try{let a=await this.call("begin",{candidateId:e.id,requestId:this.requestId,settings:this.settings(),profileKey:this.profileKey});if(this.closed||t!==this.generation)return;if(typeof a.requestId!="string")throw new Error("invalid request");this.requestId=a.requestId;try{this.storage?.setItem(this.storageKey(),a.requestId)}catch{}t===this.generation&&(this.publish({...this.state,...a}),await this.load())}catch(a){if(this.closed||t!==this.generation)return;if(a.rejected){this.requestId=void 0;try{this.storage?.removeItem(this.storageKey())}catch{}}t===this.generation&&this.publish({...this.state,status:a.rejected?"failed":"unknown",reason:ht(a)})}finally{s()}}dispose(){this.closed=!0,this.generation++,clearTimeout(this.timer),this.listeners.clear()}};var M="data-glassui",X="data-glassui-sidebar",F="data-glassui-wallpaper",U="data-glassui-static-wallpaper",le="data-glassui-highlights",J="data-glassui-adjusting",de="data-glassui-raw",v="data-glassui-surface",O="data-glassui-fill",T="data-glassui-flat",C="data-glassui-echo",K="data-glassui-paint",ce="data-glassui-float",W="data-glassui-lens",N="data-glassui-ignore",I="data-glassui-excluded",D="data-glassui-material";var w="data-glassui-owned",Q="--glassui-t",V="--glassui-inline-opacity",Z="--glassui-wallpaper",ee="--glassui-lx",te="--glassui-ly",se=["sidebar","composer","panel","menu","smoke","code","backdrop"],gt=[M,X,F,U,le,J,de,v,O,T,C,K,ce,W,I,w].map(i=>`[${i}]`).join(",");var us=300,xe=class{engine;stored;pending=new Map;timers=new Map;form;detachForm;writing=!1;writeTask;updateLock=!1;failed=!1;disposed=!1;save="loading";state;listeners=new Set;adjustments=new Map;beginAdjustment(e){if(this.disposed)return()=>{};let t={};return this.adjustments.set(t,e),this.adjustments.size===1&&this.engine.setAdjusting?.(!0),()=>{this.adjustments.delete(t)&&this.adjustments.size===0&&this.engine.setAdjusting?.(!1)}}constructor(e,t={...oe}){this.engine=e,this.stored=t,this.state={settings:t,save:this.save,updating:this.updateLock,diagnostics:e.diagnostics()},e.apply(t)}getSnapshot=()=>this.state;subscribe=e=>(this.listeners.add(e),()=>this.listeners.delete(e));attach(e){if(this.disposed)return()=>{};this.detachForm?.(),this.form=e;let t=()=>{if(this.disposed||this.form!==e)return;let n=e.getSnapshot();n.status==="ready"&&(this.stored=Y(n.value)),this.recompute(),this.flush()},s=e.subscribe(t);t();let a=()=>{s(),this.form===e&&(this.form=void 0,this.detachForm=void 0,this.save="local",this.recompute())};return this.detachForm=a,a}update(e,t){if(this.disposed||this.updateLock)return;let s=Y({...this.state.settings,[e]:t});this.pending.set(e,{value:s[e]}),this.failed=!1;let a=this.timers.get(e);a!==void 0&&clearTimeout(a),this.timers.set(e,setTimeout(()=>{this.timers.delete(e),this.flush()},us)),this.recompute()}refreshDiagnostics(){if(this.disposed)return;let e=this.engine.diagnostics();ps(e,this.state.diagnostics)||(this.state={...this.state,diagnostics:e},this.emit())}async settleForUpdate(){if(this.disposed||this.updateLock)throw new Error("settings");for(let t of[...this.adjustments.values()])t?.();this.updateLock=!0,this.recompute();let e=()=>{this.updateLock=!1,this.recompute()};try{for(let t of this.timers.values())clearTimeout(t);if(this.timers.clear(),await this.flush(),!this.isActive()||this.failed||this.pending.size>0||this.save!=="saved")throw new Error("settings");return e}catch(t){throw e(),t}}flush(){return this.writeTask??=Promise.resolve().then(()=>this.writeReady()).finally(()=>{this.writeTask=void 0}),this.writeTask}async writeReady(){if(!(this.writing||this.disposed)){this.writing=!0;try{for(;this.isActive();){let e=this.form,t=e?.getSnapshot();if(!e||t?.status!=="ready"||!t.writable)break;let s=[...this.pending].find(([c])=>!this.timers.has(c));if(!s)break;let[a,n]=s,r=!1;this.recompute();try{r=await e.set(a,n.value)}catch(c){this.isActive()&&console.warn("dsh-glassui: saving a setting failed",c)}if(!this.isActive())return;if(this.form!==e||this.pending.get(a)!==n)continue;this.pending.delete(a),this.failed||=!r;let l=e.getSnapshot();l.status==="ready"&&(this.stored=Y(l.value))}}finally{this.writing=!1,this.recompute()}}}isActive(){return!this.disposed}recompute(){if(this.disposed)return;let e=this.form?.getSnapshot();e?e.status==="loading"?this.save="loading":e.status==="unavailable"||!e.writable?this.save="local":this.pending.size>0||this.writing?this.save="saving":this.save=this.failed?"error":"saved":this.pending.size>0&&(this.save="local");let t=Y({...this.stored,...Object.fromEntries([...this.pending].map(([a,n])=>[a,n.value]))}),s=!pt(t,this.state.settings);s&&this.engine.apply(t),!(!s&&this.save===this.state.save&&this.updateLock===this.state.updating)&&(this.state={settings:t,save:this.save,updating:this.updateLock,diagnostics:this.engine.diagnostics()},this.emit())}emit(){for(let e of this.listeners)e()}dispose(){this.disposed=!0,this.adjustments.clear(),this.engine.setAdjusting?.(!1),this.detachForm?.(),this.form=void 0;for(let e of this.timers.values())clearTimeout(e);this.timers.clear(),this.pending.clear(),this.listeners.clear()}};function ft(i,e){if(i.length!==e.length)return!1;for(let t=0;t<i.length;t++)if(i[t]!==e[t])return!1;return!0}function ps(i,e){if(i.running!==e.running||i.idle!==e.idle||i.lenses!==e.lenses||i.invalidExclude!==e.invalidExclude)return!1;let t=i.environment,s=e.environment;if(t.refraction!==s.refraction||t.finePointer!==s.finePointer||t.reducedTransparency!==s.reducedTransparency||t.reducedMotion!==s.reducedMotion||!ft(i.missingTokens,e.missingTokens)||!ft(i.ambiguousTokens,e.ambiguousTokens))return!1;for(let a of se)if(i.surfaces[a]!==e.surfaces[a])return!1;return i.scans.batches===e.scans.batches&&i.scans.inspected===e.scans.inspected&&i.scans.longestMs===e.scans.longestMs&&i.scans.totalMs===e.scans.totalMs}var _=String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`,hs=new RegExp(String.raw`^rgba?\(\s*(${_})\s*,\s*(${_})\s*,\s*(${_})\s*(?:,\s*(${_})(%?)\s*)?\)$`,"i"),gs=new RegExp(String.raw`^rgba?\(\s*(${_})\s+(${_})\s+(${_})\s*(?:/\s*(${_})(%?)\s*)?\)$`,"i"),fs=new RegExp(String.raw`^color\(\s*srgb\s+(${_})\s+(${_})\s+(${_})\s*(?:/\s*(${_})(%?)\s*)?\)$`,"i");function ue(i){return Math.min(255,Math.max(0,Math.round(i)))}function bt(i,e){if(i===void 0)return 1;let t=Number(i)/(e==="%"?100:1);return Math.min(1,Math.max(0,t))}function Ge(i){let e=i.trim(),t=hs.exec(e)??gs.exec(e);if(t)return{r:ue(Number(t[1])),g:ue(Number(t[2])),b:ue(Number(t[3])),a:bt(t[4],t[5])};let s=fs.exec(e);if(s)return{r:ue(Number(s[1])*255),g:ue(Number(s[2])*255),b:ue(Number(s[3])*255),a:bt(s[4],s[5])}}function mt(i){let e=Math.round(i.a*1e3)/1e3;return e>=1?`rgb(${i.r} ${i.g} ${i.b})`:`rgb(${i.r} ${i.g} ${i.b} / ${e})`}function Se(i){return`${i.r},${i.g},${i.b},${Math.round(i.a*1e3)}`}var bs=[1,-1,2,-2,3,-3],ms=["b","g","r"];function vt(i,e){let t=new Set(e.map(Se));for(let[,a]of i)a&&t.add(Se(a));let s=new Map;for(let[a,n]of i){if(!n)continue;let r;e:for(let l of ms)for(let c of bs){let d=n[l]+c;if(d<0||d>255)continue;let u={...n,[l]:d};if(!t.has(Se(u))){r=u;break e}}r&&(t.add(Se(r)),s.set(a,r))}return s}var S={input:"--dsw-specific-input-major",sidebar:"--dsw-specific-sidebar-fill",toast:"--dsw-alias-toast-bg",tooltip:"--dsw-alias-tooltip-bg",layer1:"--dsw-alias-bg-layer-1",layer2:"--dsw-alias-bg-layer-2",layer3:"--dsw-alias-bg-layer-3",floating:"--dsw-alias-button-floating-fill",elevated:"--dsw-alias-button-elevated-fill",overlay:"--dsw-alias-bg-overlay",base:"--dsw-alias-bg-base",code:"--dsw-alias-markdown-code-block",codeBanner:"--dsw-alias-markdown-code-block-banner"},P=Object.keys(S),yt=new Set(["code","codeBanner"]),pe="--dsw-alias-markdown-inline-code",he=[pe,"--dsw-alias-markdown-citation","--dsw-alias-markdown-tag","--dsw-alias-markdown-placeholder","--dsw-specific-bubble","--dsw-specific-selector","--dsw-specific-tip","--dsw-specific-login-input","--dsw-specific-sidebar-nav-item-active","--dsw-specific-sidebar-nav-item-hover","--dsw-alias-bg-module-platform","--dsw-alias-bg-multi-select","--dsw-alias-bg-document-preview","--dsw-alias-interactive-bg-hover-solid","--dsw-alias-button-primary-dimmed"],ge={panel:"--dsw-elevation-panel",prominent:"--dsw-elevation-prominent",soft:"--dsw-elevation-soft"},Be="--dsw-elevation-stroke",j={panel:"rgb(1 0 61 / 0)",prominent:"rgb(1 0 62 / 0)",soft:"rgb(1 0 63 / 0)"},k={fill:"--dsw-menu-surface-fill",filter:"--dsw-menu-backdrop-filter",overlayFill:"--dsw-specific-menu",groupHeader:"--dsw-alias-menu-group-header-fill"},z="data-ds-dark-theme",He="data-platform",We="data-markdown-variant",aa=[...Object.values(S),...he,...Object.values(ge),Be,...Object.values(k)];var vs={bay:{light:{bg:["#b9d4ff","#eef4ff"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,40,120,0.16)",ribbons:[["#9cc6ff","#cfe6ff"],["#5f9df7","#97ccff"],["#4cc0e8","#3d8ff2"],["#2f72e8","#6aaeff"],["#1d4fc4","#4b8cf0"]]},dark:{bg:["#040a1e","#0b1838"],glow:"rgba(80,140,255,0.35)",crest:"rgba(170,210,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#183a8c","#2c63c6"],["#1d55b8","#3a8ae0"],["#0f7fa6","#2266c8"],["#2a3fb0","#4b78e0"],["#101f66","#2647a8"]]}},sunrise:{light:{bg:["#ffd9bf","#fff1e8"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(120,30,60,0.14)",ribbons:[["#ffc49a","#ffe0c2"],["#ff9a8c","#ffc49a"],["#f084b8","#ff9e94"],["#b58cf0","#ef8cc4"],["#7e6ee6","#b48cf0"]]},dark:{bg:["#16070c","#24101e"],glow:"rgba(255,120,90,0.3)",crest:"rgba(255,200,170,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#8a3a1e","#c26434"],["#962c44","#c4563a"],["#82306e","#b0425a"],["#55348e","#8a3a7c"],["#2c2470","#5a3490"]]}},meadow:{light:{bg:["#d2f0dc","#f1faf3"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(10,80,50,0.14)",ribbons:[["#bfeac8","#e0f6e2"],["#86d8a6","#bdebc8"],["#4fc4a6","#86d89a"],["#2fa59a","#5ccaa0"],["#1f7f86","#3aa894"]]},dark:{bg:["#03120e","#08201a"],glow:"rgba(80,220,160,0.25)",crest:"rgba(170,255,210,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#185c3c","#2a8a56"],["#11704e","#2a9a66"],["#0c6a64","#1a8a6e"],["#0e5260","#127068"],["#08343e","#0e5056"]]}},graphite:{light:{bg:["#dcdfe5","#f4f5f7"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(0,0,0,0.12)",ribbons:[["#d2d6dd","#e8eaee"],["#b6bbc5","#d4d8de"],["#9aa0ac","#bcc1c9"],["#7e8492","#a2a8b2"],["#626876","#868c98"]]},dark:{bg:["#0c0d0f","#1a1b1f"],glow:"rgba(255,255,255,0.12)",crest:"rgba(255,255,255,0.22)",shade:"rgba(0,0,0,0.5)",ribbons:[["#3a3d44","#4e525a"],["#2e3138","#43474f"],["#25282e","#373a42"],["#1d1f24","#2c2f35"],["#141519","#22242a"]]}},lagoon:{light:{bg:["#bdeff0","#effbfb"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(0,90,100,0.15)",ribbons:[["#a6eae6","#d4f6f2"],["#62d6d2","#9fe9e2"],["#2fc0c8","#5fd8cf"],["#1a9fb6","#3cc2c4"],["#0d7a98","#1fa2b2"]]},dark:{bg:["#021317","#06252b"],glow:"rgba(60,220,220,0.25)",crest:"rgba(160,255,250,0.28)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0d5a5e","#178a86"],["#0b6e72","#16a0a0"],["#08707e","#0f8e96"],["#075866","#0b7682"],["#043a46","#08525e"]]}},dusk:{light:{bg:["#e4d7ff","#fbf1ff"],glow:"rgba(255,255,255,0.7)",crest:"rgba(255,255,255,0.7)",shade:"rgba(70,20,110,0.15)",ribbons:[["#d9c4ff","#f0e2ff"],["#b79cff","#dcc0ff"],["#e39cdc","#c3a0ff"],["#f08cb4","#d896e8"],["#8a6cf0","#cf86d8"]]},dark:{bg:["#0c0718","#1a0f2e"],glow:"rgba(190,120,255,0.28)",crest:"rgba(230,190,255,0.3)",shade:"rgba(0,0,0,0.45)",ribbons:[["#3a2a7a","#5a3c9c"],["#4c2a86","#7a3a96"],["#6a2c80","#9a3c78"],["#3c2470","#6a2e86"],["#1e1650","#3c2070"]]}},dune:{light:{bg:["#f6e6cf","#fdf7ee"],glow:"rgba(255,255,255,0.75)",crest:"rgba(255,255,255,0.7)",shade:"rgba(110,60,10,0.14)",ribbons:[["#f2dcb8","#faecd6"],["#e9c590","#f4dbb2"],["#dea872","#ecc48e"],["#cf8c5c","#e2a876"],["#b46e48","#cf8c60"]]},dark:{bg:["#120c06","#22170c"],glow:"rgba(255,180,100,0.22)",crest:"rgba(255,220,170,0.26)",shade:"rgba(0,0,0,0.5)",ribbons:[["#5a3e22","#7a5630"],["#6a4426","#8c5c32"],["#74462a","#966036"],["#5e3622","#7c4a2c"],["#3a2216","#58321e"]]}},tide:{light:{bg:["#c6e2ff","#f2f8ff"],glow:"rgba(255,255,255,0.8)",crest:"rgba(255,255,255,0.75)",shade:"rgba(10,50,130,0.16)",ribbons:[["#9ee6ff","#d0f4ff"],["#5fcff5","#9ee6ff"],["#3aa8f0","#5fd0f0"],["#2f7ce6","#4fb0f2"],["#2552c8","#3c88e8"]]},dark:{bg:["#020b1a","#071a33"],glow:"rgba(60,170,255,0.32)",crest:"rgba(150,220,255,0.35)",shade:"rgba(0,0,0,0.45)",ribbons:[["#0f4a7a","#1d74a8"],["#0e5f8e","#1f8ac0"],["#0b6f9a","#1a5fb0"],["#173c94","#2c66c8"],["#0b1f5a","#183c94"]]}}},ys=[[.14,.2,760],[.76,.16,820],[.5,.86,860],[.94,.7,640],[.26,.92,600]],wt=[[.5,.08,720],[.08,.58,700],[.92,.5,700],[.32,.98,620],[.72,.96,640]],ws={prism:{light:{geometry:wt,bg:["#f6f3ff","#fdf8fb"],glow:"rgba(255,255,255,0.6)",blobs:[["#ff9ad5",.8],["#8fd3ff",.85],["#ffe27a",.7],["#a6f0c6",.75],["#c3a2ff",.75]]},dark:{geometry:wt,bg:["#07061a","#0d0a22"],glow:"rgba(160,120,255,0.16)",blobs:[["#ff3fa4",.55],["#2d9cff",.6],["#ffb800",.35],["#20d38a",.5],["#8b5cff",.55]]}},aurora:{light:{bg:["#e6efff","#f6f1ff"],glow:"rgba(255,255,255,0.55)",blobs:[["#5ec8ff",.9],["#a98bff",.8],["#4fe0b8",.75],["#7aa6ff",.8],["#ffb3dc",.6]]},dark:{bg:["#03061a","#080b26"],glow:"rgba(80,120,255,0.18)",blobs:[["#14c995",.7],["#2f55ff",.75],["#7d3cff",.65],["#00a6cc",.6],["#ff3d93",.38]]}},bloom:{light:{bg:["#fff0e6","#fff8f2"],glow:"rgba(255,255,255,0.55)",blobs:[["#ff9a6b",.85],["#ff86ba",.75],["#ffc94d",.7],["#b893ff",.65],["#ff7676",.5]]},dark:{bg:["#10060d","#1b0a16"],glow:"rgba(255,120,90,0.16)",blobs:[["#ff5a2a",.6],["#e0307f",.65],["#ffa600",.38],["#6f3cff",.6],["#ff3a3a",.38]]}}},Ve={bay:{style:"ribbons"},sunrise:{style:"ribbons"},meadow:{style:"ribbons"},graphite:{style:"ribbons"},lagoon:{style:"ribbons"},dusk:{style:"ribbons"},dune:{style:"ribbons"},tide:{style:"ribbons",groups:[{items:[0,1,2],motion:{duration:36,x:1.2,y:2.4,scale:1.02}},{items:[3,4],motion:{duration:26,x:-1.8,y:-2.2,scale:1}}]},aurora:{style:"blobs",groups:[{items:[0,3],motion:{duration:48,x:7,y:5,scale:1.12}},{items:[1,4],motion:{duration:60,x:-8,y:6,scale:.9}},{items:[2],motion:{duration:40,x:5,y:-7,scale:1.15}}]},prism:{style:"blobs",groups:[{items:[0,2],motion:{duration:56,x:6,y:7,scale:1.1}},{items:[1,3],motion:{duration:46,x:7,y:-6,scale:1.12}},{items:[4],motion:{duration:38,x:-8,y:-5,scale:.92}}]},bloom:{style:"blobs",groups:[{items:[0,3],motion:{duration:52,x:-6,y:6,scale:1.14}},{items:[1,4],motion:{duration:44,x:7,y:-5,scale:.9}},{items:[2],motion:{duration:64,x:-5,y:-6,scale:1.1}}]}},A=1600,L=1e3,xt=12;function R(i){return String(Math.round(i*10)/10)}function xs(i){let e=L*(.26+i*.135),t=L*(.075+i*.012),s=.9+i*.28,a=2.1+i*.45,n=i*1.15+.4,r=[];for(let l=0;l<=xt;l++){let c=-A*.06+A*1.12*l/xt,d=c/A,u=e+t*Math.sin(s*d*Math.PI*2+n)+t*.38*Math.sin(a*d*Math.PI*2+n*1.7)-d*L*.1;r.push([c,u])}return r}function Ss(i){let e=l=>i[Math.max(0,Math.min(i.length-1,l))]??[0,0],[t,s]=e(0),a=`M${R(t)} ${R(s)}`;for(let l=0;l<i.length-1;l++){let[c,d]=e(l-1),[u,g]=e(l),[p,m]=e(l+1),[x,ne]=e(l+2),re=u+(p-c)/6,B=g+(m-d)/6,h=p-(x-u)/6,y=m-(ne-g)/6;a+=`C${R(re)} ${R(B)} ${R(h)} ${R(y)} ${R(p)} ${R(m)}`}let n=A*1.06,r=-A*.06;return`${a}L${R(n)} ${L+120}L${R(r)} ${L+120}Z`}function je(){return{defs:new Map,body:[]}}var Te=.15;function Ee(i,e=0){let t=new Map;for(let{defs:a}of i)for(let[n,r]of a)t.set(n,r);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${[-A*e,-L*e,A*(1+2*e),L*(1+2*e)].map(R).join(" ")}" preserveAspectRatio="xMidYMid slice"><defs>${[...t.values()].join("")}</defs>${i.flatMap(a=>a.body).join("")}</svg>`}function St(i,e){let t=je();return t.defs.set("b",`<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${i[0]}"/><stop offset="1" stop-color="${i[1]}"/></linearGradient>`),t.defs.set("g",`<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${A*.22}" cy="${L*.05}" r="${A*.7}"><stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${e}" stop-opacity="0"/></radialGradient>`),t.body.push(`<rect width="${A}" height="${L}" fill="url(#b)"/>`,`<rect width="${A}" height="${L}" fill="url(#g)"/>`),t}function Es(i,e){let[t,s]=i.ribbons[e]??["#000","#000"],a=je();return a.defs.set("s",'<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>'),a.defs.set("f",'<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>'),a.defs.set("c",'<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>'),a.defs.set(`r${e}`,`<linearGradient id="r${e}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${A}" y2="${L*.4}"><stop offset="0" stop-color="${t}"/><stop offset="1" stop-color="${s}"/></linearGradient>`),a.defs.set(`p${e}`,`<path id="p${e}" d="${Ss(xs(e))}"/>`),a.body.push(`<use href="#p${e}" fill="${i.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,`<use href="#p${e}" fill="url(#r${e})" fill-opacity="0.92" filter="url(#f)"/>`,`<use href="#p${e}" fill="none" stroke="${i.crest}" stroke-width="2.5" filter="url(#c)"/>`),a}function Ts(i,e,t){let[s,a]=i.blobs[e]??["#000",0],[n,r,l]=(i.geometry??ys)[e]??[.5,.5,400],c=(t?1-n:n)*A,d=r*L,u=je();return u.defs.set(`o${e}`,`<radialGradient id="o${e}"><stop offset="0" stop-color="${s}" stop-opacity="${a}"/><stop offset="0.45" stop-color="${s}" stop-opacity="${R(a*.55)}"/><stop offset="1" stop-color="${s}" stop-opacity="0"/></radialGradient>`),u.body.push(`<circle cx="${R(c)}" cy="${R(d)}" r="${l}" fill="url(#o${e})"/>`),u}function Tt(i,e){if(Ve[i].style==="blobs"){let s=ws[i][e];return[St(s.bg,s.glow),...s.blobs.map((a,n)=>Ts(s,n,i==="bloom"))]}let t=vs[i][e];return[St(t.bg,t.glow),...t.ribbons.map((s,a)=>Es(t,a))]}function ye(i){return Ve[i].groups!==void 0}function ks(i,e){return Ee(Tt(i,e))}function kt(i,e){let t=Ve[i].groups,s=Tt(i,e);if(!t)return[{svg:Ee(s),motion:void 0}];let[a]=s,n=[{svg:Ee(a?[a]:[]),motion:void 0}];for(let r of t){let l=r.items.map(c=>s[c+1]).filter(c=>c!==void 0);n.push({svg:Ee(l,Te),motion:r.motion})}return n}function qe(i){return`data:image/svg+xml,${i.replace(/"/g,"'").replace(/\s+/g," ").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E")}`}function ke(i){return`url("${qe(i)}")`}var Et=new Map;function ie(i,e){let t=`${i}|${e}`,s=Et.get(t);return s===void 0&&(s=ke(ks(i,e)),Et.set(t,s)),s}function Rt(i,e,t){let s="<rect width='100%' height='100%' rx='18' ry='18' fill='none'",a=["<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>","<linearGradient id='r' x1='0' y1='0' x2='1' y2='1'>",`<stop offset='0' stop-color='white' stop-opacity='${i}'/>`,`<stop offset='0.32' stop-color='white' stop-opacity='${Math.round(i*20)/100}'/>`,"<stop offset='0.62' stop-color='white' stop-opacity='0.04'/>",`<stop offset='1' stop-color='white' stop-opacity='${e}'/>`,"</linearGradient>",`${s} stroke='black' stroke-opacity='${t}' stroke-width='1'/>`,`${s} stroke='url(#r)' stroke-width='3'/>`,"</svg>"].join("");return`url("${qe(a)}")`}var E=`:root[${M}]`,q=`${E} body`,Re=`${E} body[${z}]`,G=`:not([${I}]):not([${I}] *)`,$=`${q} [${v}]${G}`,Ye=`${$}:not([${v}="backdrop"]):not([${T}])`;function f(i,e){let t=Object.entries(e).map(([s,a])=>`  ${s}: ${a};`).join(`
`);return`${i} {
${t}
}`}var Rs={[Q]:.35,[V]:.72,"--glassui-floor":0,"--glassui-tt":`max(var(${Q}), var(--glassui-floor))`,"--glassui-blur":"calc(6px + var(--glassui-tt) * 22px)","--glassui-filter":"blur(var(--glassui-blur)) saturate(180%) brightness(1.04)","--glassui-fill-a":"max(var(--glassui-floor), calc(0.16 + var(--glassui-tt) * 0.62))","--glassui-dense-a":"max(var(--glassui-floor), calc(0.52 + var(--glassui-tt) * 0.42))","--glassui-smoke-a":"max(var(--glassui-floor), calc(0.5 + var(--glassui-tt) * 0.42))","--glassui-code-a":"max(var(--glassui-floor), calc(0.4 + var(--glassui-tt) * 0.4))","--glassui-canvas-a":"max(var(--glassui-floor), calc(0.4 + var(--glassui-tt) * 0.5))","--glassui-inset":"8px","--glassui-radius":"18px"},As={"--glassui-glass-rgb":"255 255 255","--glassui-composer-a":"max(0.74, var(--glassui-fill-a))","--glassui-smoke-rgb":"30 30 32","--glassui-rim-hi":.9,"--glassui-rim-lo":.38,"--glassui-edge":"rgb(0 0 0 / 0.08)","--glassui-drop":"rgb(0 0 0 / 0.14)","--glassui-contact":"rgb(0 0 0 / 0.2)","--glassui-sheen":.2,"--glassui-light-a":.3,"--glassui-pane-rim":Rt(.95,.5,.1),[pe]:`rgb(245 246 248 / max(var(${V}), var(--glassui-floor)))`,[k.fill]:"rgb(250 250 252 / max(var(--glassui-floor), calc(0.5 + var(--glassui-tt) * 0.42)))",[k.overlayFill]:"rgb(250 250 252 / max(var(--glassui-floor), calc(0.86 + var(--glassui-tt) * 0.12)))",[k.groupHeader]:"rgb(250 250 252 / max(var(--glassui-floor), calc(0.8 + var(--glassui-tt) * 0.18)))"},_s={"--glassui-glass-rgb":"40 40 44","--glassui-composer-a":"var(--glassui-fill-a)","--glassui-smoke-rgb":"44 44 48","--glassui-rim-hi":.32,"--glassui-rim-lo":.12,"--glassui-edge":"rgb(0 0 0 / 0.5)","--glassui-drop":"rgb(0 0 0 / 0.42)","--glassui-contact":"rgb(0 0 0 / 0.5)","--glassui-sheen":.07,"--glassui-light-a":.16,"--glassui-pane-rim":Rt(.4,.18,.5),[pe]:`rgb(48 48 54 / max(var(${V}), var(--glassui-floor)))`,[k.fill]:"rgb(44 44 48 / max(var(--glassui-floor), calc(0.46 + var(--glassui-tt) * 0.44)))",[k.overlayFill]:"rgb(44 44 48 / max(var(--glassui-floor), calc(0.86 + var(--glassui-tt) * 0.12)))",[k.groupHeader]:"rgb(44 44 48 / max(var(--glassui-floor), calc(0.8 + var(--glassui-tt) * 0.18)))"},Ls={"--glassui-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","0 0 0 0.5px var(--glassui-edge)"].join(", "),"--glassui-contained-rim":["inset 1px 1.5px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-hi))","inset -1px -1px 0 -0.5px rgb(255 255 255 / var(--glassui-rim-lo))","inset 0 0 0 0.5px var(--glassui-edge)"].join(", "),[k.filter]:"var(--glassui-filter)",...Object.fromEntries(P.map(i=>[`--glassui-src-${i}`,`var(${S[i]})`]))};function Xe(i,e,t){return`var(${Be}), var(--glassui-rim), ${e}, ${t}, 0 0 0 0 ${i}`}var $s={[ge.panel]:Xe(j.panel,"0 2px 6px -2px rgb(0 0 0 / 0.06)","0 10px 28px -10px var(--glassui-drop)"),[ge.prominent]:Xe(j.prominent,"0 3px 10px -3px rgb(0 0 0 / 0.08)","0 18px 44px -14px var(--glassui-drop)"),[ge.soft]:Xe(j.soft,"0 4px 16px -6px rgb(0 0 0 / 0.06)","0 14px 36px -16px var(--glassui-drop)")},Cs=Object.fromEntries(["panel","prominent","soft"].map(i=>[ge[i],["var(--glassui-contained-rim)","0 1px 2px -3px rgb(0 0 0 / 0.12)","0 16px 22px -33px var(--glassui-contact)",`0 0 0 0 ${j[i]}`].join(", ")])),Ns="linear-gradient(to bottom, rgb(255 255 255 / var(--glassui-sheen)), rgb(255 255 255 / 0) 42%)",Is=`radial-gradient(240px circle at var(${ee}) var(${te}), rgb(255 255 255 / var(--glassui-light-a)), rgb(255 255 255 / 0) 70%)`,Ds=[`@property ${ee} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,`@property ${te} { syntax: '<length>'; inherits: false; initial-value: -9999px; }`,"@property --glassui-light { syntax: '*'; inherits: false; }","@property --glassui-pane { syntax: '*'; inherits: false; }","@property --glassui-pane-size { syntax: '*'; inherits: false; }"].join(`
`);function Ms(){let i="[data-composer-card] button:not([aria-haspopup]):has(> span + span)",e="[data-composer-card] button:has([data-model-id])",t=n=>[`${n} ${i}`,`${n} ${i} span`,`${n} ${i} svg`,`${n} ${e}`,`${n} ${e} span[data-model-id]`,`${n} ${e} svg`].join(`,
`),s=n=>`${n} [data-composer-placeholder]`,a=`${q}:not([${z}])`;return[f([s(a),t(a)].join(`,
`),{color:"#4f5459"}),f(s(Re),{color:"#b0b4ba"}),f(t(Re),{color:"#d4d8de"})]}function Os(){let i=[f(`${$}[${v}="sidebar"]`,{"--glassui-pct":"calc(var(--glassui-fill-a) * 100%)"}),f(`${$}[${v}="composer"]`,{"--glassui-pct":"calc(var(--glassui-composer-a) * 100%)"}),f(`${$}[${v}="panel"], ${$}[${v}="menu"]`,{"--glassui-pct":"calc(var(--glassui-dense-a) * 100%)"}),f(`${$}[${v}="smoke"]`,{"--glassui-pct":"calc(var(--glassui-smoke-a) * 100%)"}),f(`${$}[${v}="code"]`,{"--glassui-pct":"calc(var(--glassui-code-a) * 100%)"}),f(`${$}[${v}="backdrop"], ${$}[${T}]`,{"--glassui-pct":"0%"}),f(Ye,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)"}),f(`${q} [${C}]`,{"background-color":"transparent"}),f(`${Ye}[${v}="code"]`,{"box-shadow":"var(--glassui-rim)"})],e=t=>`color-mix(in srgb, var(--glassui-src-${t}) var(--glassui-pct, 100%), transparent)`;for(let t of P)i.push(f(`${$}[${O}="${t}"]`,{[S[t]]:e(t)}));return i.push(f(`${$}[${v}="code"][${O}="code"]`,{[S.codeBanner]:"transparent"})),i.push(f(`${Ye}[${K}]`,{"--glassui-pane":"none","--glassui-pane-size":"100% 100%","background-image":`var(--glassui-light, none), var(--glassui-pane, none), ${Ns}`,"background-size":"auto, var(--glassui-pane-size, 100% 100%), var(--glassui-pane-size, 100% 100%)","background-position":"center","background-repeat":"no-repeat"}),f(`${E}[${le}] body [${v}][${K}]`,{"--glassui-light":Is}),f(`${E}[${X}="floating"] body [${v}="sidebar"][${ce}]:not([${T}])`,{"clip-path":"inset(var(--glassui-inset) round var(--glassui-radius))","--glassui-pane":"var(--glassui-pane-rim)","--glassui-pane-size":"calc(100% - 2 * var(--glassui-inset)) calc(100% - 2 * var(--glassui-inset))"})),i}function Ps(){let i=`${q} [${D}]${G}`;return[f(`${i}:not([${D}="none"])`,{"-webkit-backdrop-filter":"blur(18px) saturate(180%)","backdrop-filter":"var(--glassui-filter)","box-shadow":"var(--glassui-rim), 0 10px 28px -10px var(--glassui-drop)"}),f(`${i}[${D}="regular"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-fill-a))"}),f(`${i}[${D}="dense"]`,{"background-color":"rgb(var(--glassui-glass-rgb) / var(--glassui-dense-a))"}),f(`${i}[${D}="smoke"]`,{"background-color":"rgb(var(--glassui-smoke-rgb) / var(--glassui-smoke-a))"})]}function Fs(){return[f(`${E}[${F}]`,{background:`var(${Z}) center / cover no-repeat fixed`}),f(`${E}[${F}][${U}]`,{"background-image":"linear-gradient(transparent, transparent)"}),f(`${E}[${U}] > [${w}="static-wallpaper"]`,{position:"fixed",inset:0,"z-index":-1,"pointer-events":"none",contain:"strict",transform:"translateZ(0)","background-position":"center","background-size":"cover","background-repeat":"no-repeat"}),f(`${E}[${F}] body${G}`,{"background-color":"color-mix(in srgb, var(--dsw-alias-bg-base) calc(var(--glassui-canvas-a) * 100%), transparent)"})]}function Us(){return[`@media (prefers-contrast: more) {
${[f(E,{"--glassui-floor":.85}),f(q,{"--glassui-edge":"rgb(0 0 0 / 0.45)"}),f(Re,{"--glassui-edge":"rgb(255 255 255 / 0.35)"})].join(`
`)}
}`,`@media (prefers-reduced-transparency: reduce) {
${f(E,{"--glassui-floor":1,"--glassui-filter":"none"})}
}`,`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
${f(E,{"--glassui-floor":.9})}
}`].join(`
`)}function At(){return`${["/* dsh-glassui: Liquid Glass-style material for DSH Web. Inert unless <html> has data-glassui. */",Ds,"@media screen and (forced-colors: none) {",f(E,Rs),f(`${q}${G}`,{...As,...Ls}),f(`${Re}${G}`,_s),f(`${q}${G}, ${q} *${G}`,$s),f(`${$}[${W}]`,{...Cs,"box-shadow":"var(--glassui-contained-rim), 0 16px 22px -33px var(--glassui-contact)"}),...Os(),...Ms(),...Ps(),...Fs(),Us(),"}"].join(`
`)}
`}var Ks=new Set(["layer1","layer2","layer3","floating","elevated","overlay","base"]),zs=.5,Gs=.25,Bs=160;function Hs(i,e){if(i!=="none"){for(let t of["prominent","panel","soft"])if(e[t]!==""&&i.includes(e[t]))return t}}function ae(i,e,t,s=!1){return{kind:i,fill:e,paint:i!=="backdrop"&&t.backgroundImage==="none",float:s}}function _t(i,e){if(i.managed)return;let t=e.fills.get(i.background),s=Hs(i.boxShadow,e.elevation),a=i.area>zs;if(i.backdropFilter!=="none"&&i.backdropFilter===e.menuFilter)return a?void 0:ae("menu",void 0,i);switch(t){case"sidebar":return a?ae("backdrop",t,i):ae("sidebar",t,i,i.width>=Bs&&i.boxShadow==="none"&&i.backgroundImage==="none");case"input":return ae(a?"backdrop":"composer",t,i);case"toast":case"tooltip":return a?void 0:ae("smoke",t,i);case"code":case"codeBanner":return a?void 0:{kind:"code",fill:t,paint:!1,float:!1};case void 0:return;default:break}if(Ks.has(t)&&(s==="panel"||s==="prominent"))return ae("panel",t,i);if(t==="base"&&s===void 0&&i.area>=Gs)return ae("backdrop",t,i)}var Ws=[...Object.values(S),...Object.values(k),pe],Ae=class{doc;sheet;entries=new Map;nextId=1;initialized=!1;constructor(e,t){this.doc=e,this.sheet=t}sync(e,t){let s=e!==""||!this.initialized?[...this.doc.querySelectorAll(`[${N}]${e?`, ${e}`:""}`)]:[...[...this.entries.keys()].filter(c=>c.hasAttribute(N)),...t.flatMap(c=>[...c.hasAttribute(N)?[c]:[],...c.children.length>0?[...c.querySelectorAll(`[${N}]`)]:[]])];this.initialized=!0;let a=new Set(s.filter(c=>this.doc.body.contains(c)&&!c.closest(`[${w}]`))),n=[];for(let c of this.entries.keys())a.has(c)||(c.removeAttribute(I),this.entries.delete(c),n.push(c));for(let c of a){if(this.entries.has(c))continue;let d=this.nextId++;this.entries.set(c,{id:d,css:""}),c.setAttribute(I,String(d)),n.push(c)}let r=[...this.entries].filter(([c,d])=>d.css===""||t.some(u=>u.contains(c))),l=this.doc.defaultView;if(r.length>0&&l){let c=this.doc.documentElement,d=c.getAttribute(M);c.removeAttribute(M);try{for(let[u,g]of r){let p=l.getComputedStyle(u),m=Ws.map(x=>`  ${x}: ${p.getPropertyValue(x).trim()||"initial"};`);g.css=`:where(${E} [${I}="${g.id}"]) {
${m.join(`
`)}
}`}}finally{d!==null&&c.setAttribute(M,d)}}return this.sheet.setExclusions([...this.entries.values()].map(c=>c.css).join(`
`)),n}dispose(){for(let e of this.entries.keys())e.removeAttribute(I);this.entries.clear(),this.initialized=!1,this.sheet.setExclusions("")}};var Lt=`[${v}][${K}]:not([${T}]):not([${v}="backdrop"])`,_e=class{doc;enabled=!1;frame=0;x=0;y=0;target=null;geometryStale=!0;lit=new Set;boxes=new Map;styleBaseline=new Map;observedSize=new Map;measuredBorder=new Map;resizeTargets=new Set;observer;resize;fonts;viewport;constructor(e){this.doc=e;let t=e.defaultView?.MutationObserver;this.observer=t?new t(this.mutated):void 0;let s=e.defaultView?.ResizeObserver;this.resize=s?new s(this.resized):void 0}move=e=>{e.pointerType!=="mouse"&&e.pointerType!=="pen"||(this.x=e.clientX,this.y=e.clientY,this.target=e.target instanceof Element?e.target:null,this.schedule())};out=e=>{e.relatedTarget===null&&(this.target=null,this.schedule())};markStale=()=>{this.geometryStale=!0};mutated=e=>{for(let t of e)if(!this.pointerStyleOnly(t)){this.geometryStale=!0;return}};resized=e=>{let t=!1;for(let s of e){let a=`${s.contentRect.width}x${s.contentRect.height}`,n=this.observedSize.get(s.target);if(this.observedSize.set(s.target,a),n!==void 0){n!==a&&(t=!0);continue}let r=this.measuredBorder.get(s.target),l=js(s);r!==void 0&&l!==void 0&&!qs(r,l)&&(t=!0)}t&&(this.geometryStale=!0)};resourceSettled=e=>{let t=e.target;(t===this.doc||t instanceof HTMLImageElement||t instanceof HTMLVideoElement||t instanceof HTMLLinkElement)&&(this.geometryStale=!0)};schedule(){let e=this.doc.defaultView;this.frame===0&&e&&(this.frame=e.requestAnimationFrame(this.paint))}paint=()=>{this.frame=0;let e=new Set;for(let t=this.target?.closest(Lt);t;t=t.parentElement?.closest(Lt))t instanceof HTMLElement&&e.add(t);if(this.shouldMeasure(e)){this.geometryStale=!1,this.boxes.clear(),this.measuredBorder.clear(),this.styleBaseline.clear();for(let t of e){let s=t.getBoundingClientRect();this.boxes.set(t,{left:s.left,top:s.top,clientLeft:t.clientLeft,clientTop:t.clientTop}),this.measuredBorder.set(t,{width:s.width,height:s.height}),this.styleBaseline.set(t,$t(t.getAttribute("style")??""))}}for(let t of this.lit)e.has(t)||this.clear(t);for(let t of e){let s=this.boxes.get(t);if(s===void 0)continue;let a=`${Math.round(this.x-s.left-s.clientLeft)}px`,n=`${Math.round(this.y-s.top-s.clientTop)}px`;t.style.getPropertyValue(ee)!==a&&t.style.setProperty(ee,a),t.style.getPropertyValue(te)!==n&&t.style.setProperty(te,n)}this.lit.clear();for(let t of e)this.lit.add(t);this.syncResizeWatch(e)};shouldMeasure(e){if(this.geometryStale||e.size!==this.boxes.size)return!0;for(let t of e)if(!this.boxes.has(t)||this.surfaceIsMoving(t))return!0;return!1}surfaceIsMoving(e){for(let t=e;t;t=t.parentElement)if(typeof t.getAnimations=="function"&&t.getAnimations().length>0)return!0;return!1}pointerStyleOnly(e){if(e.type!=="attributes"||e.attributeName!=="style"||!(e.target instanceof HTMLElement)||!this.lit.has(e.target))return!1;let t=this.styleBaseline.get(e.target);return t===void 0?!1:$t(e.target.getAttribute("style")??"")===t}syncResizeWatch(e){let t=this.resize;if(!t)return;let s=new Set;s.add(this.doc.documentElement),s.add(this.doc.body);for(let a of e)for(let n=a;n;n=n.parentElement)s.add(n);for(let a of[...this.resizeTargets])s.has(a)||(t.unobserve(a),this.observedSize.delete(a),this.resizeTargets.delete(a));for(let a of s)this.resizeTargets.has(a)||(this.resizeTargets.add(a),t.observe(a))}clear(e){e.style.removeProperty(ee),e.style.removeProperty(te)}setEnabled(e){if(e===this.enabled)return;this.enabled=e;let t=this.doc.defaultView,s=this.doc.documentElement;if(e){s.setAttribute(le,""),t?.addEventListener("pointermove",this.move,{passive:!0,capture:!0}),t?.addEventListener("resize",this.markStale,{passive:!0}),this.doc.addEventListener("pointerout",this.out,{passive:!0}),this.doc.addEventListener("scroll",this.markStale,{passive:!0,capture:!0}),this.viewport=t?.visualViewport??void 0,this.viewport?.addEventListener("scroll",this.markStale,{passive:!0}),this.viewport?.addEventListener("resize",this.markStale,{passive:!0}),this.doc.addEventListener("load",this.resourceSettled,!0),this.doc.addEventListener("error",this.resourceSettled,!0);let a=Vs(this.doc);a&&(this.fonts=a,a.addEventListener("loadingdone",this.markStale),a.addEventListener("loadingerror",this.markStale)),this.syncResizeWatch([]),this.observer?.observe(this.doc,{subtree:!0,childList:!0,characterData:!0,attributes:!0}),this.geometryStale=!0;return}t?.removeEventListener("pointermove",this.move,{capture:!0}),t?.removeEventListener("resize",this.markStale),this.doc.removeEventListener("pointerout",this.out),this.doc.removeEventListener("scroll",this.markStale,{capture:!0}),this.doc.removeEventListener("load",this.resourceSettled,!0),this.doc.removeEventListener("error",this.resourceSettled,!0),this.fonts?.removeEventListener("loadingdone",this.markStale),this.fonts?.removeEventListener("loadingerror",this.markStale),this.fonts=void 0,this.viewport?.removeEventListener("scroll",this.markStale),this.viewport?.removeEventListener("resize",this.markStale),this.viewport=void 0,this.observer?.disconnect(),this.resize?.disconnect(),this.resizeTargets.clear(),this.observedSize.clear(),this.measuredBorder.clear(),this.styleBaseline.clear(),this.frame!==0&&t?.cancelAnimationFrame(this.frame),this.frame=0,this.target=null,this.geometryStale=!0,this.boxes.clear();for(let a of this.lit)this.clear(a);this.lit.clear(),s.removeAttribute(le)}dispose(){this.setEnabled(!1)}};function $t(i){return i.replace(/--glassui-l[xy]\s*:\s*[^;]*;?/g,"").replace(/\s/g,"")}function Vs(i){let e=i.fonts;if(e)return e}function js(i){let e=i.borderBoxSize[0];if(e===void 0)return{width:i.contentRect.width,height:i.contentRect.height};if(!(!Number.isFinite(e.inlineSize)||!Number.isFinite(e.blockSize)))return{width:e.inlineSize,height:e.blockSize}}function qs(i,e){return Math.abs(i.width-e.width)<1&&Math.abs(i.height-e.height)<1}function Ys(i){let e=[],t=0,s=0;for(let a=0;a<i.length;a++){let n=i[a];n==="("?t++:n===")"?t=Math.max(0,t-1):n===","&&t===0&&(e.push(i.slice(s,a)),s=a+1)}return e.push(i.slice(s)),e.map(a=>a.trim()).filter(a=>a.length>0)}function Xs(i){let e="",t=0;for(let s of i)s==="("?t++:s===")"?t=Math.max(0,t-1):t===0&&(e+=s);return e}var Js=/(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)px/gi;function Qs(i){let e=0,t=0;if(i.trim()==="none")return{x:e,y:t};for(let s of Ys(i)){let a=Xs(s);if(/\binset\b/i.test(a))continue;let n=[...a.matchAll(Js)].map(g=>Number(g[1]));if(n.length<2)continue;let[r=0,l=0,c=0,d=0]=n,u=Math.max(0,c)*1.5+d;e=Math.max(e,u-r),t=Math.max(t,u-l)}return{x:e,y:t}}function Ct(i){let e=Qs(i.boxShadow),t=0;i.outlineStyle!=="none"&&(t=Math.max(0,(parseFloat(i.outlineWidth)||0)+(parseFloat(i.outlineOffset)||0)));let s=a=>Math.max(0,Math.ceil(a-.001));return{x:s(Math.max(e.x,t)),y:s(Math.max(e.y,t))}}function Nt(i,e){return Math.max(6,Math.min(Math.min(i,e)*.34,28))}function It(i){return Math.round(i*1.7)}function Dt({width:i,height:e,radius:t,bezel:s}){let a=new Uint8ClampedArray(i*e*4),n=i/2,r=e/2,l=Math.max(0,Math.min(t,n,r));for(let c=0;c<e;c++)for(let d=0;d<i;d++){let u=d+.5-n,g=c+.5-r,p=Math.abs(u)-(n-l),m=Math.abs(g)-(r-l),x=-(Math.hypot(Math.max(p,0),Math.max(m,0))+Math.min(Math.max(p,m),0)-l),ne=0,re=0;if(x>0&&x<s){let h,y;if(p>0&&m>0){let me=Math.hypot(p,m)||1;h=p/me*Math.sign(u),y=m/me*Math.sign(g)}else p>m?(h=Math.sign(u),y=0):(h=0,y=Math.sign(g));let H=Math.pow(1-x/s,2.4);ne=-h*H,re=-y*H}let B=(c*i+d)*4;a[B]=128+ne*127,a[B+1]=128+re*127,a[B+2]=128,a[B+3]=255}return a}var Zs=Uint8Array.from([137,80,78,71,13,10,26,10]),ei=bi(),ti=mi(),si=vi(),Je=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],ii=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];function Ot(i,e,t){if(e<1||t<1||i.length!==e*t*4)throw new Error("png size");let s=ai(i,e,t),a=Qe("IDAT",di(ni(s),s)),n=new Uint8Array(13),r=new DataView(n.buffer);r.setUint32(0,e),r.setUint32(4,t),n[8]=8,n[9]=6;let l=gi([Zs,Qe("IHDR",n),a,Qe("IEND",new Uint8Array)]);return`data:image/png;base64,${fi(l)}`}function ai(i,e,t){let s=e*4,a=new Uint8Array(t*(s+1)),n=0;for(let r=0;r<t;r++){let l=r*s;a[n++]=r===0?0:2;let c=l-s;for(let d=0;d<s;d++){let u=i[l+d]??0,g=r===0?0:i[c+d]??0;a[n++]=r===0?u:u-g&255}}return a}var Ze=class{bytes=[];accumulator=0;bits=0;push(e,t){let s=t,a=e;for(;s>0;){let n=Math.min(s,16);for(this.accumulator|=(a&(1<<n)-1)<<this.bits,this.bits+=n,a>>>=n,s-=n;this.bits>=8;)this.bytes.push(this.accumulator&255),this.accumulator>>>=8,this.bits-=8}}finish(){return this.bits>0&&this.bytes.push(this.accumulator&255),Uint8Array.from(this.bytes)}};function ni(i){let e=new Ze;e.push(1,1),e.push(1,2);let t=i.length,s=new Int32Array(32768);s.fill(-1);let a=new Int32Array(32768);a.fill(-1);let n=0;for(;n<t;){let r=0,l=0;if(n+2<t){let c=Pt(i,n),d=s[c]??-1,u=0;for(;d>=0&&d<n&&n-d<=32768&&u<24;){let g=n-d;if(ri(i,d,n)){let p=3,m=Math.min(258,t-n);for(;p<m&&i[d+p]===i[n+p];)p++;if(p>r&&(r=p,l=g,p===m))break}d=a[d&32767]??-1,u++}Mt(i,s,a,n)}if(r>=3&&l>=1){oi(e,r,l);let c=n+r;for(let d=n+1;d<c&&d+2<t;d++)Mt(i,s,a,d);n=c}else et(e,i[n]??0),n++}return et(e,256),e.finish()}function Pt(i,e){return((i[e]??0)*31+(i[e+1]??0))*31+(i[e+2]??0)&32767}function ri(i,e,t){return i[e]===i[t]&&i[e+1]===i[t+1]&&i[e+2]===i[t+2]}function Mt(i,e,t,s){let a=Pt(i,s);t[s&32767]=e[a]??-1,e[a]=s}function et(i,e){let t=ei[e];if(t===void 0)throw new Error(`png symbol ${e}`);i.push(t.bits,t.length)}function oi(i,e,t){let s=si[e],a=li(t);if(s===void 0||a===void 0)throw new Error("png match");et(i,s.symbol),s.extra>0&&i.push(s.value,s.extra);let n=ti[a.symbol];if(n===void 0)throw new Error("png distance");i.push(n.bits,n.length),a.extra>0&&i.push(a.value,a.extra)}function li(i){if(i<1||i>32768)return;let e=29;for(let a=0;a<Je.length;a++){let n=Je[a+1]??32769;if(i<n){e=a;break}}let t=Je[e]??1,s=ii[e]??0;return{symbol:e,extra:s,value:i-t}}function di(i,e){let t=new Uint8Array(i.length+6);return t[0]=120,t[1]=1,t.set(i,2),new DataView(t.buffer).setUint32(i.length+2,ci(e)),t}function ci(i){let e=1,t=0;for(let s=0;s<i.length;s++)e+=i[s]??0,t+=e,(s&4095)===4095&&(e%=65521,t%=65521);return e%=65521,t%=65521,(t<<16|e)>>>0}var ui=hi();function Qe(i,e){let t=new Uint8Array(12+e.length),s=new DataView(t.buffer);return s.setUint32(0,e.length),t[4]=i.charCodeAt(0),t[5]=i.charCodeAt(1),t[6]=i.charCodeAt(2),t[7]=i.charCodeAt(3),t.set(e,8),s.setUint32(8+e.length,pi(t.subarray(4,8+e.length))),t}function pi(i){let e=4294967295;for(let t of i)e=(ui[(e^t)&255]??0)^e>>>8;return(e^4294967295)>>>0}function hi(){let i=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let s=0;s<8;s++)t=t&1?3988292384^t>>>1:t>>>1;i[e]=t>>>0}return i}function gi(i){let e=0;for(let a of i)e+=a.length;let t=new Uint8Array(e),s=0;for(let a of i)t.set(a,s),s+=a.length;return t}function fi(i){let e="";for(let t=0;t<i.length;t+=8192){let s=i.subarray(t,t+8192);e+=String.fromCharCode(...s)}return btoa(e)}function Ft(i,e){let t=0;for(let s=0;s<e;s++)t=t<<1|i>>>s&1;return t}function bi(){let i=[],e=(t,s,a)=>{i[t]={bits:Ft(s,a),length:a}};for(let t=0;t<=143;t++)e(t,48+t,8);for(let t=144;t<=255;t++)e(t,400+(t-144),9);for(let t=256;t<=279;t++)e(t,t-256,7);for(let t=280;t<=287;t++)e(t,192+(t-280),8);return i}function mi(){let i=[];for(let e=0;e<=29;e++)i[e]={bits:Ft(e,5),length:5};return i}function vi(){let i=[],e=(t,s,a,n)=>{let r=n;for(let l=t;l<=s;l++){let c=1<<a;for(let d=0;d<c;d++)i[r++]={symbol:l,extra:a,value:d}}};e(257,264,0,3),e(265,268,1,11),e(269,272,2,19),e(273,276,3,35),e(277,280,4,67),e(281,283,5,131);for(let t=0;t<31;t++)i[227+t]={symbol:284,extra:5,value:t};return i[258]={symbol:285,extra:0,value:0},i}function Ut(i,e){if(i.size===0)return"";let t=e?`[${z}]`:`:not([${z}])`,s=[...i].map(([a,n])=>`  ${S[a]}: ${mt(n)};`).join(`
`);return`${E} body${t}:not([${de}]):not([${I}]) {
${s}
}`}function Kt(i){return`${E}:not([${J}]) body [${v}]${G}[${W}="${i}"]:not([${v}="backdrop"]):not([${T}]) {
  backdrop-filter: url(#glassui-lens-${i}) saturate(180%) brightness(1.04);
}`}var Le=class{doc;element;nudges="";exclusions="";lenses=new Map;constructor(e){this.doc=e}setNudges(e){e!==this.nudges&&(this.nudges=e,this.flush())}setExclusions(e){e!==this.exclusions&&(this.exclusions=e,this.flush())}setLens(e,t){if(t===void 0){if(!this.lenses.delete(e))return}else{if(this.lenses.get(e)===t)return;this.lenses.set(e,t)}this.flush()}flush(){this.element?.isConnected||(this.element=this.doc.createElement("style"),this.element.setAttribute(w,"dynamic"),this.doc.head.append(this.element)),this.element.textContent=[this.nudges,this.exclusions,...this.lenses.values()].filter(Boolean).join(`
`)}dispose(){this.element?.remove(),this.element=void 0,this.nudges="",this.exclusions="",this.lenses.clear()}};var zt="http://www.w3.org/2000/svg",yi=12,wi=.35,xi=160,Si=24,Ei="rgb(128 128 128)",tt={composer:0,smoke:1,menu:2,panel:3},$e=class{doc;sheet;entries=new Map;maps=new Map;resize;defs;enabled=!1;blur=12;nextId=1;frame=0;constructor(e,t){this.doc=e,this.sheet=t;let s=e.defaultView;this.resize=s&&typeof s.ResizeObserver=="function"?new s.ResizeObserver(a=>{for(let n of a)this.resized(n.target)}):void 0}get active(){let e=0;for(let t of this.entries.values())t.live&&e++;return e}setEnabled(e){if(e!==this.enabled){this.enabled=e;for(let t of["focusin","focusout","transitionend","animationend"])e?this.doc.addEventListener(t,this.recheck,{capture:!0,passive:!0}):this.doc.removeEventListener(t,this.recheck,{capture:!0});e||(this.releaseAll(),this.frame!==0&&this.doc.defaultView?.cancelAnimationFrame(this.frame),this.frame=0)}}setBlur(e){if(e!==this.blur){this.blur=e;for(let t of this.defs?.querySelectorAll("feGaussianBlur")??[])t.setAttribute("stdDeviation",this.deviation())}}sync(e){let t=new Set(this.enabled?e.filter(s=>tt[s.kind]!==void 0&&s.area>0&&s.area<=wi).sort((s,a)=>(tt[s.kind]??9)-(tt[a.kind]??9)||s.area-a.area).slice(0,yi).map(s=>s.element):[]);for(let s of[...this.entries.keys()])(!t.has(s)||!s.isConnected)&&this.release(s);for(let s of t){if(this.entries.has(s)){this.verify(s);continue}let a={id:this.nextId++,key:"",live:!1,timer:void 0};this.entries.set(s,a),s.setAttribute(W,String(a.id)),this.resize?.observe(s),this.schedule(s,0)}}recheck=()=>{let e=this.doc.defaultView;this.frame!==0||!e||(this.frame=e.requestAnimationFrame(()=>{this.frame=0;for(let t of this.entries.keys())this.verify(t)}))};verify(e){let t=this.entries.get(e);!t||t.timer!==void 0||!e.isConnected||t.key!==this.geometryKey(e)&&this.resized(e)}deviation(){return(this.blur*.8).toFixed(1)}resized(e){let t=this.entries.get(e);!t||t.key===this.geometryKey(e)||(this.setLive(t,!1),this.schedule(e,xi))}setLive(e,t){e.live!==t&&(e.live=t,this.sheet.setLens(e.id,t?Kt(e.id):void 0))}schedule(e,t){let s=this.entries.get(e);s&&(s.timer!==void 0&&clearTimeout(s.timer),s.timer=setTimeout(()=>{s.timer=void 0,this.build(e)},t))}geometryKey(e){let{width:t,height:s}=this.size(e),a=this.doc.defaultView;if(!a)return"";let n=a.getComputedStyle(e),r=Math.round(Math.min(parseFloat(n.borderTopLeftRadius)||0,t/2,s/2)),l=Ct(n);return`${t}x${s}r${r}s${l.x},${l.y}`}size(e){if(e instanceof(this.doc.defaultView?.HTMLElement??HTMLElement))return{width:Math.round(e.offsetWidth),height:Math.round(e.offsetHeight)};let t=e.getBoundingClientRect();return{width:Math.round(t.width),height:Math.round(t.height)}}build(e){let t=this.entries.get(e);if(!t||!this.enabled)return;if(!e.isConnected){this.release(e);return}let s=this.geometryKey(e),a=/^(\d+)x(\d+)r(\d+)s(\d+),(\d+)$/.exec(s);t.key=s;let n=Number(a?.[1]??0),r=Number(a?.[2]??0),l=Number(a?.[3]??0),c={x:Number(a?.[4]??0),y:Number(a?.[5]??0)};if(!a||n<8||r<8||c.x!==0||c.y!==0){this.setLive(t,!1);return}let d=Nt(n,r),u=this.map(`${n}x${r}r${l}`,{width:n,height:r,radius:l,bezel:d});if(u===void 0){this.setLive(t,!1);return}let g={x:String(-c.x),y:String(-c.y),width:String(n),height:String(r)},p=this.filter(t.id);for(let[m,x]of Object.entries(g))p.setAttribute(m,x);p.replaceChildren(this.node("feGaussianBlur",{in:"SourceGraphic",stdDeviation:this.deviation(),edgeMode:"duplicate",result:"blur"}),this.node("feFlood",{...g,"flood-color":Ei,result:"neutral"}),this.node("feImage",{...g,href:u,preserveAspectRatio:"none",result:"image"}),this.node("feMerge",{result:"map"},[this.node("feMergeNode",{in:"neutral"}),this.node("feMergeNode",{in:"image"})]),this.node("feDisplacementMap",{in:"blur",in2:"map",scale:String(It(d)),xChannelSelector:"R",yChannelSelector:"G"})),this.setLive(t,!0)}map(e,t){let s=this.maps.get(e);if(s!==void 0)return s;let a;try{a=Ot(Dt(t),t.width,t.height)}catch{return}if(this.maps.set(e,a),this.maps.size>Si){let n=this.maps.keys().next().value;n!==void 0&&this.maps.delete(n)}return a}filter(e){let t=this.doc.getElementById(`glassui-lens-${e}`);if(t instanceof(this.doc.defaultView?.SVGFilterElement??SVGFilterElement))return t;let s=this.node("filter",{id:`glassui-lens-${e}`,x:"0",y:"0",filterUnits:"userSpaceOnUse",primitiveUnits:"userSpaceOnUse","color-interpolation-filters":"sRGB"});return this.container().append(s),s}container(){if(this.defs?.isConnected)return this.defs;let e=this.doc.createElementNS(zt,"svg");return e.setAttribute(w,"defs"),e.setAttribute("aria-hidden","true"),e.setAttribute("focusable","false"),e.setAttribute("width","0"),e.setAttribute("height","0"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none",this.doc.body.append(e),this.defs=e,e}node(e,t,s=[]){let a=this.doc.createElementNS(zt,e);for(let[n,r]of Object.entries(t))a.setAttribute(n,r);return a.append(...s),a}release(e){let t=this.entries.get(e);t&&(t.timer!==void 0&&clearTimeout(t.timer),this.resize?.unobserve(e),this.setLive(t,!1),e.removeAttribute(W),this.doc.getElementById(`glassui-lens-${t.id}`)?.remove(),this.entries.delete(e))}releaseAll(){for(let e of[...this.entries.keys()])this.release(e)}dispose(){this.setEnabled(!1),this.releaseAll(),this.resize?.disconnect(),this.defs?.remove(),this.defs=void 0,this.maps.clear()}};var fe="rgba(0, 0, 0, 0)",Ce=class{doc;host;cache=new Map;constructor(e){this.doc=e}container(){if(this.host?.isConnected)return this.host;let e=this.doc.createElement("div");return e.setAttribute(w,"probes"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict",this.doc.body.append(e),this.host=e,this.cache.clear(),e}probe(e,t){let s=this.cache.get(e);if(s?.isConnected)return s;let a=this.doc.createElement("div");return t(a),this.container().append(a),this.cache.set(e,a),a}style(e){let t=this.doc.defaultView;if(!t)throw new Error("dsh-glassui: probes need a document with a window");return t.getComputedStyle(e)}color(e){return this.style(this.probe(`bg:${e}`,t=>t.style.background=`var(${e})`)).backgroundColor}raw(){for(let t of[...Object.values(S),...he])this.probe(`bg:${t}`,s=>s.style.background=`var(${t})`);for(let t of["panel","prominent","soft"])this.probe(`sentinel:${t}`,s=>s.style.color=j[t]);this.probe("menu-filter",t=>t.style.setProperty("backdrop-filter",`var(${k.filter})`));let e=this.doc.body;e.setAttribute(de,"");try{let t=new Map(P.map(a=>[a,this.color(S[a])])),s=he.map(a=>this.color(a)).filter(a=>a!==fe);return{watched:t,reserved:s}}finally{e.removeAttribute(de)}}elevation(){let e=t=>this.style(this.probe(`sentinel:${t}`,s=>s.style.color=j[t])).color;return{panel:e("panel"),prominent:e("prominent"),soft:e("soft")}}menuFilter(){return this.style(this.probe("menu-filter",e=>e.style.setProperty("backdrop-filter",`var(${k.filter})`))).backdropFilter}tagged(e,t,s){let a=this.probe(`tagged:${e}:${t}:${s}`,n=>{n.setAttribute(v,e),n.setAttribute(O,t),s&&n.setAttribute(T,""),n.style.background=`var(${S[t]})`});return this.style(a).backgroundColor}dispose(){this.host?.remove(),this.host=void 0,this.cache.clear()}};var Ti=12;function ki(i,e,t){switch(i.wallpaper){case"none":return;case"custom":return ve(i.wallpaperUrl)?{name:"custom",image:`url("${i.wallpaperUrl}")`,preset:void 0}:void 0;case"auto":return t?void 0:{name:"bay",image:ie("bay",e),preset:"bay"};default:return{name:i.wallpaper,image:ie(i.wallpaper,e),preset:i.wallpaper}}}function Ri(i){let e=[[0,0],[.2,.1],[.5,.5],[.8,.9],[1,1]],t=1+2*Te;return e.map(([s,a])=>({offset:s,transform:`translate(${st(i.x*a/t)}%, ${st(i.y*a/t)}%) scale(${st(1+(i.scale-1)*a,4)})`}))}function st(i,e=3){let t=10**e;return Math.round(i*t)/t}var it=class{doc;container;layers=[];key="";constructor(e){this.doc=e}show(e,t){let s=`${e}|${t.length}`;if(this.container?.isConnected&&s===this.key){t.forEach((l,c)=>this.layers[c]?.style.setProperty("background-image",l.image));return}this.hide(),this.key=s;let a=this.doc.createElement("div");a.setAttribute(w,"wallpaper"),a.setAttribute("aria-hidden","true"),a.style.cssText="position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict;";let n=this.doc.createElement("div");n.style.cssText="position:absolute;left:50%;top:50%;width:max(100vw,160vh);height:max(100vh,62.5vw);transform:translate(-50%,-50%);",a.append(n);for(let l of t){let c=this.doc.createElement("div");c.style.cssText=`position:absolute;inset:${-Te*100}%;background:center / 100% 100% no-repeat;will-change:transform;`,c.style.setProperty("background-image",l.image),n.append(c),this.layers.push(c),typeof c.animate=="function"&&c.animate(Ri(l.motion),{duration:l.motion.duration*1e3,iterations:Number.POSITIVE_INFINITY,direction:"alternate",easing:`steps(${l.motion.duration*Ti})`})}this.doc.documentElement.insertBefore(a,this.doc.body),this.container=a}hide(){for(let e of this.layers)for(let t of e.getAnimations())t.cancel();this.layers=[],this.container?.remove(),this.container=void 0,this.key=""}},at=class{doc;element;image="";appliedImage="";observer;constructor(e){this.doc=e}show(e){this.image=e;let t=this.doc.defaultView;!this.observer&&t&&(this.observer=new t.MutationObserver(()=>this.sync()),this.observer.observe(this.doc.documentElement,{attributes:!0,attributeFilter:["style"]})),this.sync()}sync(){let e=this.doc.documentElement;if(["background-image","background-color","background-size","background-position","background-repeat","background-attachment"].some(s=>e.style.getPropertyValue(s)!=="")){this.element?.remove(),this.element=void 0,this.appliedImage="",e.removeAttribute(U);return}this.element?.isConnected||(this.element=this.doc.createElement("div"),this.element.setAttribute(w,"static-wallpaper"),this.element.setAttribute("aria-hidden","true"),e.insertBefore(this.element,this.doc.body),this.appliedImage=""),this.image!==this.appliedImage&&(this.element.style.backgroundImage=this.image,this.appliedImage=this.image),e.hasAttribute(U)||e.setAttribute(U,"")}hide(){this.observer?.disconnect(),this.observer=void 0,this.element?.remove(),this.element=void 0,this.image="",this.appliedImage="",this.doc.documentElement.removeAttribute(U)}},Ne=class{doc;live;still;cache=new Map;layerCache=new Map;current;constructor(e){this.doc=e,this.live=new it(e),this.still=new at(e)}apply(e,t,s,a=!0){let n=`${e.wallpaper}|${e.wallpaperUrl}|${t}|${s}|${a}`;if(n===this.current)return;if(this.current=n,!this.cache.has(n)&&(this.cache.set(n,ki(e,t,s)),this.cache.size>24)){let d=this.cache.keys().next().value;d!==void 0&&this.cache.delete(d)}let r=this.cache.get(n),l=this.doc.documentElement;if(!r){this.live.hide(),this.still.hide(),l.removeAttribute(F),l.style.removeProperty(Z);return}let c=r.preset;if(a&&c!==void 0&&ye(c)){this.still.hide();let d=this.layers(c,t);l.style.setProperty(Z,d.base),this.live.show(c,d.moving)}else this.live.hide(),l.style.setProperty(Z,r.image),c!==void 0?this.still.show(r.image):this.still.hide();l.setAttribute(F,r.name)}layers(e,t){let s=`${e}|${t}`,a=this.layerCache.get(s);if(!a){let[n,...r]=kt(e,t);a={base:n?ke(n.svg):"none",moving:r.flatMap(l=>l.motion?[{image:ke(l.svg),motion:l.motion}]:[])},this.layerCache.set(s,a)}return a}dispose(){this.live.hide(),this.still.hide();let e=this.doc.documentElement;e.removeAttribute(F),e.style.removeProperty(Z),this.current=void 0,this.cache.clear(),this.layerCache.clear()}};var Ie=new Set(["DIV","ASIDE","NAV","HEADER","FOOTER","SECTION","MAIN","FORM","DIALOG","MENU","UL","OL","ARTICLE","BUTTON","FIELDSET","DETAILS"]),Ai=new Set(["SVG","PRE","CODE","TABLE","IFRAME","VIDEO","CANVAS","IMG","TEXTAREA","SELECT","SCRIPT","STYLE","TEMPLATE"]),_i="/* dsh-glassui:",Li=8,$i=new Set(["sidebar","composer","panel","smoke","code"]);function Ci(){return Object.fromEntries(se.map(i=>[i,0]))}function Ni(i,e){let t=e.trim();if(t==="")return"";try{return i.createDocumentFragment().querySelector(t),t}catch{return}}function Ii(i,e,t){if(e)return 0;let s=i/100;return 6+Math.max(s,t?.85:0)*22}var De=class{win;doc;env;onChange;settings;running=!1;idle="disabled";probes;sheet;exclusions;lenses;highlights;wallpaper;ownSheet;menuFilterDirty=!1;signatures;expected=new Map;missing=[];ambiguous=[];tagged=new Map;echoes=new Set;roots=new Set;singles=new Set;invalidated=new Set;reclassifications=[];requeue=[];walkers=[];frame=0;paletteDirty=!1;exclusionsDirty=!1;exclude="";invalidExclude=!1;stats={batches:0,inspected:0,longestMs:0,totalMs:0};subtree;bodyWatch;rootWatch;headWatch;stopEnvironment;disposed=!1;adjusting=!1;constructor(e,t,s){this.win=e,this.doc=e.document,this.env=t,this.onChange=s,this.probes=new Ce(this.doc),this.sheet=new Le(this.doc),this.exclusions=new Ae(this.doc,this.sheet),this.lenses=new $e(this.doc,this.sheet),this.highlights=new _e(this.doc),this.wallpaper=new Ne(this.doc),this.stopEnvironment=this.env.onChange(()=>{this.settings&&(this.apply(this.settings),this.applyPresentation()),this.paletteChanged()})}get active(){return this.running}apply(e){if(this.disposed)return;let t=this.settings;if(this.settings=e,!e.enabled||this.env.forcedColors()){this.idle=e.enabled?"forced-colors":"disabled",this.stop();return}if(!this.running){this.start();return}let s=this.doc.documentElement;t?.sidebar!==e.sidebar&&s.setAttribute(X,e.sidebar),t?.inlineCodeOpacity!==e.inlineCodeOpacity&&s.style.setProperty(V,String(e.inlineCodeOpacity/100)),t?.tint!==e.tint&&(s.style.setProperty(Q,String(e.tint/100)),this.expected.clear(),this.adjusting||this.lenses.setBlur(this.blurPx()),this.menuFilterDirty=!0),t?.exclude!==e.exclude&&this.updateExclude(!0),t?.codeBlocks!==e.codeBlocks&&this.updateCodeBlocks(),(t?.sidebar!==e.sidebar||t.refraction!==e.refraction||t.highlights!==e.highlights||t.wallpaper!==e.wallpaper||t.wallpaperUrl!==e.wallpaperUrl)&&this.applyPresentation()}start(){let e=this.settings;if(!e||!this.doc.body)return;this.running=!0,this.idle=void 0,this.ensureStylesheet();let t=this.doc.documentElement;t.setAttribute(M,"on"),this.adjusting&&t.setAttribute(J,""),t.setAttribute(X,e.sidebar),t.style.setProperty(Q,String(e.tint/100)),t.style.setProperty(V,String(e.inlineCodeOpacity/100)),this.lenses.setBlur(this.blurPx()),this.updateExclude(!1),this.refreshExclusions(),this.refreshPalette(),this.applyPresentation(),this.subtree=new this.win.MutationObserver(s=>this.mutated(s)),this.subtree.observe(this.doc.body,{childList:!0,subtree:!0,attributes:!0,attributeOldValue:!0}),this.bodyWatch=new this.win.MutationObserver(()=>this.paletteChanged()),this.bodyWatch.observe(this.doc.body,{attributes:!0,attributeFilter:[z,"style","class"]}),this.rootWatch=new this.win.MutationObserver(()=>this.applyPresentation()),this.rootWatch.observe(t,{attributes:!0,attributeFilter:[He]}),this.headWatch=new this.win.MutationObserver(s=>{s.some(a=>!this.ownRecord(a))&&this.paletteChanged()}),this.headWatch.observe(this.doc.head,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["href","media","disabled"]}),this.win.addEventListener("resize",this.resized,{passive:!0}),this.doc.addEventListener("load",this.loaded,!0),this.doc.addEventListener("transitionend",this.settled,!0),this.doc.addEventListener("animationend",this.settled,!0),this.roots.add(this.doc.body),this.schedule()}stop(){let e=this.running;this.running=!1,this.frame!==0&&this.win.cancelAnimationFrame(this.frame),this.frame=0,this.subtree?.disconnect(),this.bodyWatch?.disconnect(),this.rootWatch?.disconnect(),this.headWatch?.disconnect(),this.subtree=this.bodyWatch=this.rootWatch=this.headWatch=void 0,this.doc.removeEventListener("load",this.loaded,!0),this.doc.removeEventListener("transitionend",this.settled,!0),this.doc.removeEventListener("animationend",this.settled,!0),this.win.removeEventListener("resize",this.resized),this.roots.clear(),this.singles.clear(),this.invalidated.clear(),this.reclassifications=[],this.exclusionsDirty=!1,this.walkers=[],this.requeue.length=0,this.lenses.dispose(),this.highlights.dispose(),this.wallpaper.dispose(),this.exclusions.dispose(),this.sheet.dispose(),this.probes.dispose(),this.ownSheet?.remove(),this.ownSheet=void 0;for(let s of[...this.tagged.keys()])this.untag(s);for(let s of this.echoes)s.removeAttribute(C);this.echoes.clear(),this.signatures=void 0,this.expected.clear();let t=this.doc.documentElement;t.removeAttribute(M),t.removeAttribute(J),t.removeAttribute(X),t.style.removeProperty(Q),t.style.removeProperty(V);for(let s of this.doc.querySelectorAll(gt)){if(s.hasAttribute(w)){s.remove();continue}for(let a of[...s.getAttributeNames()])a.startsWith("data-glassui")&&a!==N&&a!==D&&s.removeAttribute(a)}e&&this.changed()}dispose(){this.disposed=!0,this.stopEnvironment?.(),this.stopEnvironment=void 0,this.stop(),this.notifyFrame!==0&&this.win.cancelAnimationFrame(this.notifyFrame),this.notifyFrame=0}diagnostics(){let e=Ci();for(let[t,s]of this.tagged)!s.flat&&t.isConnected&&e[s.kind]++;return{running:this.running,idle:this.running?void 0:this.idle,environment:{refraction:this.env.refraction,finePointer:this.env.finePointer(),reducedTransparency:this.env.reducedTransparency(),reducedMotion:this.env.reducedMotion()},missingTokens:[...this.missing],ambiguousTokens:[...this.ambiguous],surfaces:e,lenses:this.lenses.active,invalidExclude:this.invalidExclude,scans:{...this.stats}}}blurPx(){return Ii(this.settings?.tint??35,this.env.reducedTransparency(),this.env.increasedContrast())}scheme(){return this.doc.body.hasAttribute(z)?"dark":"light"}applyPresentation(){let e=this.settings;if(!this.running||!e)return;this.adjusting||this.lenses.setBlur(this.blurPx());let t=this.doc.documentElement.getAttribute(He)==="darwin";this.wallpaper.apply(e,this.scheme(),t,!this.env.reducedMotion()),this.highlights.setEnabled(e.highlights&&!this.adjusting&&this.env.finePointer()&&!this.env.reducedMotion()&&!this.env.reducedTransparency()),this.lenses.setEnabled(e.refraction&&this.env.refraction&&!this.env.reducedTransparency()),this.syncLenses()}setAdjusting(e){this.disposed||this.adjusting===e||(this.adjusting=e,this.running&&(this.doc.documentElement.toggleAttribute(J,e),this.applyPresentation()))}ensureStylesheet(){for(let t of this.doc.querySelectorAll("style"))if(t.textContent.startsWith(_i))return;let e=this.doc.createElement("style");e.setAttribute(w,"stylesheet"),e.textContent=At(),this.doc.head.append(e),this.ownSheet=e}updateCodeBlocks(){if(this.settings?.codeBlocks!=="glass"){for(let[e,t]of[...this.tagged])t.kind==="code"&&this.untag(e);this.syncLenses(),this.changed()}this.paletteChanged()}codeGlass(){return this.settings?.codeBlocks==="glass"}watchedFills(){return this.codeGlass()?[...P]:P.filter(e=>!yt.has(e))}updateExclude(e){let t=Ni(this.doc,this.settings?.exclude??"");this.invalidExclude=t===void 0;let s=t??"";if(s!==this.exclude&&(this.exclude=s,!!e)){if(this.refreshExclusions(),s!==""){for(let a of[...this.tagged.keys()])a.closest(s)&&this.untag(a);for(let a of this.echoes)a.closest(s)&&(a.removeAttribute(C),this.echoes.delete(a))}this.syncLenses(),this.changed(),this.roots.add(this.doc.body),this.schedule()}}refreshExclusions(){for(let e of this.exclusions.sync(this.exclude,[...this.invalidated]))this.invalidated.add(e),this.roots.add(e)}resized=()=>this.paletteChanged();paletteChanged(){this.running&&(this.paletteDirty=!0,this.invalidated.add(this.doc.body),this.roots.add(this.doc.body),this.schedule())}refreshPalette(){let e=this.probes.raw(),t=this.watchedFills(),s=[...e.reserved,...P.filter(d=>!t.includes(d)).map(d=>e.watched.get(d)??fe)],a=d=>d===fe?void 0:Ge(d),n=vt(t.map(d=>[d,a(e.watched.get(d)??fe)]),s.map(a).filter(d=>d!==void 0));this.sheet.setNudges(Ut(n,this.scheme()==="dark"));let r=new Set([...he,...P.filter(d=>!t.includes(d)).map(d=>S[d])].map(d=>this.probes.color(d))),l=new Map,c=new Map;this.missing=[];for(let d of t){if(e.watched.get(d)===fe){this.missing.push(d);continue}let u=this.probes.color(S[d]);c.set(u,[...c.get(u)??[],d])}this.ambiguous=[];for(let[d,u]of c){let[g]=u;u.length===1&&g!==void 0&&!r.has(d)?l.set(d,g):this.ambiguous.push(...u)}this.menuFilterDirty=!1,this.signatures={fills:l,elevation:this.probes.elevation(),menuFilter:this.probes.menuFilter()},this.expected.clear()}loaded=e=>{e.target instanceof this.win.HTMLLinkElement&&this.paletteChanged()};ownedNode(e){let t=e instanceof this.win.Element?e:e.parentElement;return t!==null&&t.closest(`[${w}]`)!==null}ownRecord(e){if(this.ownedNode(e.target))return!0;if(e.type!=="childList")return!1;let t=[...e.addedNodes,...e.removedNodes];return t.length>0&&t.every(s=>s instanceof this.win.Element&&s.hasAttribute(w))}settled=e=>{let t=e.target;this.running&&t instanceof this.win.Element&&Ie.has(t.tagName)&&(this.singles.add(t),this.schedule())};mutated(e){let t=!1;for(let s of e)if(!this.ownRecord(s)){if(s.type==="attributes"){if(!(s.target instanceof this.win.Element))continue;let a=s.attributeName??"";if(a.startsWith("data-glassui-")&&a!==N&&a!==D||a!=="class"&&a!=="style"&&a!==N&&a!==D&&a!=="contenteditable"&&this.exclude===""||s.attributeName==="style"&&this.onlyOwnStyleChanged(s))continue;this.exclusionsDirty=!0,this.invalidated.add(s.target),this.roots.add(s.target);continue}this.exclusionsDirty=!0;for(let a of s.addedNodes)a instanceof this.win.Element&&!a.hasAttribute(w)&&(this.invalidated.add(a),this.roots.add(a));s.removedNodes.length>0&&(t=!0)}t&&this.prune(),(this.exclusionsDirty||this.roots.size>0||this.singles.size>0)&&this.schedule()}oldStyle;newStyle;docStyle(){return this.win.document.createElement("div").style}onlyOwnStyleChanged(e){this.oldStyle??=this.docStyle(),this.newStyle??=this.docStyle();let t=(s,a)=>{a.cssText=s;for(let n of[...a])n.startsWith("--glassui-")&&a.removeProperty(n);return a.cssText};return t(e.oldValue??"",this.oldStyle)===t(e.target.getAttribute("style")??"",this.newStyle)}reclassify(e){if(this.invalidated.size>0){let s=[...this.invalidated];this.invalidated.clear();let a=new Set(this.reclassifications.flat()),n=[...new Set([...this.tagged.keys(),...this.echoes,...a])].filter(u=>a.has(u)||s.some(g=>g.contains(u))).sort((u,g)=>u.compareDocumentPosition(g)&this.win.Node.DOCUMENT_POSITION_FOLLOWING?-1:1),r=new Map;for(let u of n){let g=this.doc.body;for(let m=u;m;m=m.parentElement)this.tagged.get(m)?.kind==="code"&&(g=m);let p=r.get(g)??[];p.push(u),r.set(g,p)}let l=r.get(this.doc.body);r.delete(this.doc.body);let c=[],d=l??[];for(let u of r.values())d.length>=64&&(c.push(d),d=[]),d.push(...u);d.length>0&&c.push(d),this.reclassifications=c}let t=!1;for(;this.reclassifications.length>0;){let s=this.reclassifications.shift();if(s&&(t=this.reclassifyFamily(s)||t),performance.now()>=e)break}return t}reclassifyFamily(e){let t=new Set(e.filter(n=>this.echoes.has(n)));if(e.length===0)return!1;for(let n of e)this.tagged.has(n)&&this.untag(n,!1),this.echoes.delete(n)&&n.removeAttribute(C);let s=e.filter(n=>n.isConnected&&this.admissible(n)).map(n=>this.inspect(n));for(let n of s)this.commit(n);let a=s.filter(({element:n})=>t.has(n)&&this.isEcho(n,this.win.getComputedStyle(n).backgroundColor));for(let{element:n}of a)this.untag(n,!1),n.setAttribute(C,""),this.echoes.add(n);return this.stats.inspected+=s.length,!0}schedule(){this.running&&this.frame===0&&(this.frame=this.win.requestAnimationFrame(this.process))}process=()=>{if(this.frame=0,!this.running)return;let e=performance.now(),t=e+Li;(this.exclusionsDirty||this.paletteDirty)&&(this.exclusionsDirty=!1,this.refreshExclusions()),this.paletteDirty&&(this.paletteDirty=!1,this.refreshPalette(),this.applyPresentation());let s=this.reclassify(t);for(let r of this.roots)this.admissible(r)&&r.isConnected&&!this.walkers.some(l=>!l.started&&l.root.contains(r))&&(this.walkers=this.walkers.filter(l=>l.started||!r.contains(l.root)),this.walkers.push({root:r,walker:this.walker(r),started:!1}));this.roots.clear();let a=[];for(let r of this.singles)if(this.reclassifications.length>0||performance.now()>=t||(this.singles.delete(r),r.isConnected&&Ie.has(r.tagName)&&this.admissible(r)&&a.push(this.inspect(r)),(a.length&63)===0&&performance.now()>t))break;e:for(;this.reclassifications.length===0&&this.walkers.length>0&&performance.now()<=t;){let r=this.walkers[0];if(!r)break;if(!r.root.isConnected||!this.admissible(r.root)){this.walkers.shift();continue}r.started||(r.started=!0,Ie.has(r.root.tagName)&&this.admissible(r.root)&&a.push(this.inspect(r.root)));for(let l=r.walker.nextNode();l;l=r.walker.nextNode())if(a.push(this.inspect(l)),(a.length&63)===0&&performance.now()>t)break e;this.walkers.shift()}for(let r of a)s=this.commit(r)||s;for(let r of this.requeue.splice(0))this.singles.add(r);s&&this.syncLenses();let n=performance.now()-e;this.stats.batches++,this.stats.inspected+=a.length,this.stats.totalMs+=n,this.stats.longestMs=Math.max(this.stats.longestMs,n),s&&this.changed(),(this.walkers.length>0||this.roots.size>0||this.singles.size>0||this.reclassifications.length>0)&&this.schedule()};admissible(e){return e.closest(`[${w}],[${N}],[contenteditable]`)?!1:this.exclude===""||!e.closest(this.exclude)}walker(e){let t=s=>{let a=s,n=a.tagName;if(this.codeGlass()&&a.hasAttribute(We)){this.singles.add(a);for(let r of a.querySelectorAll("div"))this.singles.add(r);return NodeFilter.FILTER_REJECT}return Ai.has(n.toUpperCase())||a.hasAttribute(w)||a.hasAttribute(N)||a.hasAttribute("contenteditable")||a.hasAttribute(We)||this.exclude!==""&&a.matches(this.exclude)?NodeFilter.FILTER_REJECT:Ie.has(n)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP};return this.doc.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:t})}inspect(e){let t=this.signatures,s=this.tagged.get(e);if(!t)return{element:e,verdict:void 0,area:0,untag:!1};let a=this.win.getComputedStyle(e);if(s)return(s.kind==="menu"?a.backdropFilter!=="none":s.fill!==void 0&&a.backgroundColor===this.expectedFor(s.kind,s.fill,s.flat))?{element:e,verdict:void 0,area:s.area,untag:!1}:(this.requeue.push(e),{element:e,verdict:void 0,area:0,untag:!0});let n=a.backgroundColor,r=a.backdropFilter;if(this.menuFilterDirty&&r!=="none"&&!t.fills.has(n)&&(t.menuFilter=this.probes.menuFilter(),this.menuFilterDirty=!1),!t.fills.has(n)&&(r==="none"||r!==t.menuFilter))return{element:e,verdict:void 0,area:0,untag:!1,echo:this.echoes.has(e)||this.isEcho(e,n)};let l=e.getBoundingClientRect(),c=Math.max(1,this.win.innerWidth*this.win.innerHeight),d={background:n,backgroundImage:a.backgroundImage,boxShadow:a.boxShadow,backdropFilter:r,area:l.width*l.height/c,width:l.width,managed:e.hasAttribute(D)};return{element:e,verdict:_t(d,t),area:d.area,untag:!1}}isEcho(e,t){let s=Ge(t);if(!s||s.a===0||s.a>=1)return!1;let a=e.parentElement?.closest(`[${v}]:not([${T}])`),n=a?this.tagged.get(a):void 0;return!n||n.kind==="backdrop"||n.kind==="menu"||n.fill===void 0?!1:t===this.expectedFor(n.kind,n.fill,!1)}expectedFor(e,t,s){let a=`${e}|${t}|${s}`,n=this.expected.get(a);return n===void 0&&(n=this.probes.tagged(e,t,s),this.expected.set(a,n)),n}commit(e){let{element:t,verdict:s}=e;if(e.untag)return this.untag(t),!0;if(e.echo&&!this.echoes.has(t))return t.setAttribute(C,""),this.echoes.add(t),!1;if(!s||this.tagged.has(t)||!t.isConnected)return!1;let a=!1;if(s.fill!==void 0&&$i.has(s.kind)){let n=s.kind==="code"?`[${v}="code"]`:`[${O}="${s.fill}"]`,r=t.parentElement?.closest(`${n}:not([${T}])`);a=r!=null&&this.tagged.get(r)?.kind!=="backdrop"}return t.setAttribute(v,s.kind),s.fill!==void 0&&t.setAttribute(O,s.fill),a&&t.setAttribute(T,""),s.paint&&!a&&t.setAttribute(K,""),s.float&&!a&&t.setAttribute(ce,""),this.tagged.set(t,{kind:s.kind,fill:s.fill,flat:a,area:e.area}),a&&this.requeue.push(t),!0}untag(e,t=!0){for(let s of[v,O,T,K,ce])e.removeAttribute(s);if(this.tagged.delete(e),!!t)for(let s of this.echoes)e.contains(s)&&(s.removeAttribute(C),this.echoes.delete(s))}prune(){for(let t of this.echoes)t.isConnected||(t.removeAttribute(C),this.echoes.delete(t));let e=!1;for(let t of this.tagged.keys())t.isConnected||(this.untag(t),e=!0);e&&(this.syncLenses(),this.changed())}syncLenses(){let e=[];for(let[t,s]of this.tagged)!s.flat&&t.isConnected&&e.push({element:t,kind:s.kind,area:s.area});this.lenses.sync(e)}notifyFrame=0;changed(){this.disposed||!this.onChange||this.notifyFrame!==0||(this.notifyFrame=this.win.requestAnimationFrame(()=>{this.notifyFrame=0,this.onChange?.()}))}};function Gt(i){let e=u=>typeof i.matchMedia=="function"?i.matchMedia(u):void 0,t=e("(hover: hover) and (pointer: fine)"),s=e("(prefers-reduced-motion: reduce)"),a=e("(prefers-reduced-transparency: reduce)"),n=e("(prefers-contrast: more)"),r=e("(forced-colors: active)"),l=i.navigator.userAgentData?.brands,c=l?l.some(u=>/Chromium/i.test(u.brand)):/(?:Chrome|Chromium)\/\d/.test(i.navigator.userAgent),d=typeof i.CSS<"u"&&typeof i.CSS.supports=="function"&&i.CSS.supports("backdrop-filter","url(#a)");return{refraction:c&&d,finePointer:()=>t?.matches??!1,reducedMotion:()=>s?.matches??!1,reducedTransparency:()=>a?.matches??!1,increasedContrast:()=>n?.matches??!1,forcedColors:()=>r?.matches??!1,onChange(u){let g=[t,s,a,n,r].filter(p=>p!==void 0);for(let p of g)p.addEventListener("change",u);return()=>{for(let p of g)p.removeEventListener("change",u)}}}}var nt="dsh-glassui",Me={"settings.close":"Close","tint.preview":"Glass preview","slider.hint":"Preview while dragging. Release to apply across the page.","updateReason_manual-update":"DSH refused to replace the plugin. Stop DSH and install the release with the CLI, then restart.","inline.label":"Inline-code opacity","inline.readable":"Readable","inline.hint":"Independent of code blocks and Transparency. Recommended: 60\u201385. Contrast preferences may raise opacity.","inline.preview":"Inline-code preview","inline.example":"Try these in your message:",updateReason_profile:"The connected profile changed. Check again.",updateReason_storage:"Could not write the update files to the profile.",updateReason_interrupted:"The download was interrupted before installation. Check again.",updateTitle:"Glass UI plugin",updateIdle:"Updates have not been checked yet.",updateChecking:"Checking for updates\u2026",updateCurrent:"No newer stable release.",updateAvailable:"A plugin update is available. Wallpaper, effects and exclusions are kept.",updateBlocked:"The update could not be checked or is unavailable.",updatePreparing:"Downloading and verifying the release\u2026",updateInstalling:"Installing the plugin\u2026",updateRestart:"Installed. Restart DSH when your current work is finished to apply the update.",updateApplied:"The updated plugin version is running.",updateFailed:"Update failed. Review the stage below and check again.",updateCancelled:"The installer confirmed cancellation.",updateOverridden:"Saved settings prevent the update from applying.",updateUnknown:"The installation result is unknown. Reconcile the operation before starting another update.",updateCheck:"Check plugin update",updateInstall:"Update plugin",updateReconcile:"Check installation result",updateManual:"Releases / manual update",updateChecked:"Last checked",updateStage:"Installer stage","updateReason_manager-unavailable":"Automatic updates are unavailable here. Use the Releases page.","updateReason_read-only":"This plugin cannot be changed here.",updateReason_source:"This installation source requires a manual update. Its version pin will be preserved.",updateReason_incompatible:"The release does not support this DSH version.","updateReason_compatibility-unknown":"The release compatibility could not be confirmed.",updateReason_busy:"Another update or settings change is in progress. Finish it before retrying.",updateReason_network:"Could not contact the release service. Try again later.",updateReason_metadata:"Release metadata is invalid. Use the release link to review it.",updateReason_asset:"The required release assets are missing or ambiguous.",updateReason_channel:"This update accepts stable releases only.",updateReason_checksum:"Release checksum verification failed.",updateReason_redirect:"The release redirected to an unapproved host.",updateReason_size:"The release exceeded its download size limit.","updateReason_stale-candidate":"The release or installation changed. Check again.","updateReason_release-unavailable":"The release service returned no accessible release.",updateReason_reinstall:"The installed copy was removed, and the new version did not finish installing. Install this release again from the Releases page.",updateReason_restored:"The new version was not installed. The previous version is installed again. Restart DSH if this plugin is not running, then check again.","updateReason_restore-failed":"The update removed this plugin, and putting the previous version back failed. Install it again from the Releases page.","updateReason_restore-pending":"The previous version is installed again. Restart DSH before that version runs, then check the installation result.","updateReason_restore-offer":"This update has no record that it removed the plugin, or the install already finished. The previous version is not put back automatically.","updateReason_restore-limit":"Automatic reinstall stopped after the attempt limit. Reinstall previous version is on this page, and the Releases page is available too.",updateRestore:"Reinstall previous version",updateSettling:"Saving pending settings\u2026",updateReason_settings:"Settings could not be saved or changed elsewhere. Resolve the save error and try again.",updateRunning:"Running version",updateInstalledVersion:"Installed version",title:"Glass UI",subtitle:"Adjust glass, wallpaper and effects.","status.on":"On","status.off":"Off","status.forced":"Paused while high contrast is on","status.surfaces":"{count} glass surfaces","section.material":"Material","enable.label":"Glass material","enable.hint":"Turn off to see DSH\u2019s original look.","tint.label":"Transparency","tint.clear":"Clear","tint.tinted":"Tinted","section.wallpaper":"Wallpaper","wallpaper.auto":"Automatic","wallpaper.auto.hint":"Bay in a browser, none in the macOS app.","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"Live","wallpaper.live.hint":"Moves slowly. It holds still with Reduce Motion, and costs a little more power than a still wallpaper.","wallpaper.none":"None","wallpaper.custom":"Custom","wallpaper.url.label":"Image URL","wallpaper.url.placeholder":"https://\u2026 or /path/on/this/server.jpg","wallpaper.url.invalid":"Use an http(s) URL, a path on this server, or a base64 image data URL.","section.layout":"Layout and effects","sidebar.label":"Sidebar","sidebar.floating":"Floating","sidebar.docked":"Docked","code.label":"Code blocks","code.hint":"Glass is a denser tint that keeps code easy to read.","code.glass":"Glass","code.solid":"Solid","refraction.label":"Refraction","refraction.hint":"Bends the background along glass edges. Off with Reduce Transparency.","refraction.unavailable":"Needs a Chromium-based browser such as Chrome, Edge or the DSH desktop app.","highlights.label":"Pointer highlights","highlights.hint":"A soft light follows the pointer. Off on touch screens and with Reduce Motion or Reduce Transparency.","section.compat":"Compatibility","exclude.label":"Leave these elements alone","exclude.hint":"CSS selectors, comma separated. Use this when another plugin looks wrong under glass.","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"This selector is not valid, so it is ignored.","diag.title":"Diagnostics","diag.surfaces":"Glass surfaces","diag.lenses":"Refracting now","diag.tokens":"DSH theme tokens","diag.tokens.ok":"All found","diag.tokens.missing":"Not in this DSH release: {list}","diag.tokens.ambiguous":"Indistinguishable: {list}","diag.scan":"Scanning","diag.scan.value":"{batches} passes, longest {longest} ms","diag.copy":"Copy diagnostics","diag.copied":"Copied","diag.copy.failed":"Copy failed. Select the text below instead.","kind.sidebar":"Sidebar","kind.composer":"Composer","kind.panel":"Panels","kind.menu":"Menus","kind.smoke":"Toasts and tooltips","kind.code":"Code blocks","kind.backdrop":"Backgrounds","save.local":"This connection cannot save settings, so changes last until the page reloads.","save.error":"Could not save the change. The previous value is back.","save.saving":"Saving\u2026",footer:"dsh-glassui {version}. Unofficial; not affiliated with DeepSeek."},Bt={"settings.close":"\u9589\u3058\u308B","tint.preview":"\u30AC\u30E9\u30B9\u306E\u30D7\u30EC\u30D3\u30E5\u30FC","slider.hint":"\u30C9\u30E9\u30C3\u30B0\u4E2D\u306F\u3053\u3053\u3067\u30D7\u30EC\u30D3\u30E5\u30FC\u3057\u307E\u3059\u3002\u96E2\u3059\u3068\u753B\u9762\u5168\u4F53\u3078\u9069\u7528\u3057\u307E\u3059\u3002","updateReason_manual-update":"DSH \u304C\u7F6E\u63DB\u3092\u62D2\u5426\u3057\u307E\u3057\u305F\u3002DSH \u3092\u505C\u6B62\u3057\u3001CLI \u3067\u30EA\u30EA\u30FC\u30B9\u3092\u5C0E\u5165\u3057\u3066\u304B\u3089\u518D\u8D77\u52D5\u3057\u3066\u304F\u3060\u3055\u3044\u3002","inline.label":"\u30A4\u30F3\u30E9\u30A4\u30F3\u30B3\u30FC\u30C9\u306E\u4E0D\u900F\u660E\u5EA6","inline.readable":"\u8AAD\u307F\u3084\u3059\u3044","inline.hint":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u3084\u900F\u660E\u5EA6\u3068\u306F\u5225\u306E\u8A2D\u5B9A\u3067\u3059\u3002\u63A8\u5968\u306F60\u301C85\u3002\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u8A2D\u5B9A\u306B\u3088\u3063\u3066\u4E0D\u900F\u660E\u5EA6\u304C\u9AD8\u304F\u306A\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002","inline.preview":"\u30A4\u30F3\u30E9\u30A4\u30F3\u30B3\u30FC\u30C9\u306E\u30D7\u30EC\u30D3\u30E5\u30FC","inline.example":"\u6587\u7AE0\u306E\u4E2D\u3067\u4F7F\u3046\u4F8B\uFF1A",updateReason_profile:"\u63A5\u7D9A\u5148\u306E\u8A2D\u5B9A\u74B0\u5883\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_storage:"profile\u5185\u306B\u66F4\u65B0\u7528\u30D5\u30A1\u30A4\u30EB\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_interrupted:"\u5C0E\u5165\u524D\u306E\u53D6\u5F97\u51E6\u7406\u304C\u4E2D\u65AD\u3055\u308C\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateTitle:"Glass UI\u30D7\u30E9\u30B0\u30A4\u30F3",updateIdle:"\u66F4\u65B0\u306F\u307E\u3060\u78BA\u8A8D\u3057\u3066\u3044\u307E\u305B\u3093\u3002",updateChecking:"\u66F4\u65B0\u3092\u78BA\u8A8D\u4E2D\u2026",updateCurrent:"\u65B0\u3057\u3044\u6B63\u5F0F\u7248\u306F\u3042\u308A\u307E\u305B\u3093\u3002",updateAvailable:"\u66F4\u65B0\u304C\u3042\u308A\u307E\u3059\u3002\u58C1\u7D19\u30FB\u52B9\u679C\u30FB\u9664\u5916\u8A2D\u5B9A\u306F\u7DAD\u6301\u3057\u307E\u3059\u3002",updateBlocked:"\u66F4\u65B0\u3092\u78BA\u8A8D\u3067\u304D\u306A\u3044\u304B\u3001\u3053\u306E\u74B0\u5883\u3067\u306F\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3002",updatePreparing:"\u914D\u5E03\u7269\u3092\u53D6\u5F97\u30FB\u691C\u8A3C\u4E2D\u2026",updateInstalling:"\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u4E2D\u2026",updateRestart:"\u5C0E\u5165\u3057\u307E\u3057\u305F\u3002\u73FE\u5728\u306E\u4F5C\u696D\u3092\u7D42\u3048\u3066\u304B\u3089DSH\u3092\u518D\u8D77\u52D5\u3057\u3066\u9069\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateApplied:"\u66F4\u65B0\u3057\u305F\u30D7\u30E9\u30B0\u30A4\u30F3\u304C\u52D5\u4F5C\u3057\u3066\u3044\u307E\u3059\u3002",updateFailed:"\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u5931\u6557\u6BB5\u968E\u3092\u78BA\u8A8D\u3057\u3066\u518D\u5EA6\u66F4\u65B0\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateCancelled:"\u30A4\u30F3\u30B9\u30C8\u30FC\u30E9\u30FC\u304C\u53D6\u6D88\u3092\u78BA\u8A8D\u3057\u307E\u3057\u305F\u3002",updateOverridden:"\u4FDD\u5B58\u8A2D\u5B9A\u306B\u3088\u308A\u66F4\u65B0\u3092\u9069\u7528\u3067\u304D\u307E\u305B\u3093\u3002",updateUnknown:"\u5C0E\u5165\u7D50\u679C\u306F\u4E0D\u660E\u3067\u3059\u3002\u518D\u9001\u305B\u305A\u3001\u7D50\u679C\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateCheck:"\u66F4\u65B0\u3092\u78BA\u8A8D",updateInstall:"\u66F4\u65B0\u3059\u308B",updateReconcile:"\u5C0E\u5165\u7D50\u679C\u3092\u78BA\u8A8D",updateManual:"\u914D\u5E03\u7248\u30FB\u624B\u52D5\u66F4\u65B0",updateChecked:"\u78BA\u8A8D\u6642\u523B",updateStage:"\u5C0E\u5165\u6BB5\u968E","updateReason_manager-unavailable":"\u3053\u306E\u74B0\u5883\u3067\u306F\u81EA\u52D5\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3002\u914D\u5E03\u30DA\u30FC\u30B8\u304B\u3089\u66F4\u65B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_read-only":"\u3053\u306E\u74B0\u5883\u3067\u306F\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u5909\u66F4\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_source:"\u3053\u306E\u5C0E\u5165\u5143\u306F\u624B\u52D5\u66F4\u65B0\u304C\u5FC5\u8981\u3067\u3059\u3002\u7248\u56FA\u5B9A\u306F\u7DAD\u6301\u3057\u307E\u3059\u3002",updateReason_incompatible:"\u3053\u306E\u914D\u5E03\u7248\u306F\u5B9F\u884C\u4E2D\u306EDSH\u7248\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093\u3002","updateReason_compatibility-unknown":"\u914D\u5E03\u7248\u306EDSH\u4E92\u63DB\u6027\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002",updateReason_busy:"\u5225\u306E\u66F4\u65B0\u307E\u305F\u306F\u8A2D\u5B9A\u5909\u66F4\u304C\u9032\u884C\u4E2D\u3067\u3059\u3002\u5B8C\u4E86\u3057\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_network:"\u914D\u5E03\u30B5\u30FC\u30D3\u30B9\u3068\u306E\u901A\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u6642\u9593\u3092\u7F6E\u3044\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_metadata:"\u914D\u5E03\u60C5\u5831\u304C\u4E0D\u6B63\u3067\u3059\u3002\u914D\u5E03\u30DA\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_asset:"\u5FC5\u8981\u306A\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u304C\u306A\u3044\u304B\u3001\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002",updateReason_channel:"\u3053\u306E\u66F4\u65B0\u6A5F\u80FD\u306F\u6B63\u5F0F\u7248\u306E\u307F\u6271\u3044\u307E\u3059\u3002",updateReason_checksum:"\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u306E\u30C1\u30A7\u30C3\u30AF\u30B5\u30E0\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",updateReason_redirect:"\u914D\u5E03\u53D6\u5F97\u5148\u304C\u8A31\u53EF\u3057\u3066\u3044\u306A\u3044\u30DB\u30B9\u30C8\u306B\u8EE2\u9001\u3055\u308C\u307E\u3057\u305F\u3002",updateReason_size:"\u914D\u5E03\u30D5\u30A1\u30A4\u30EB\u304C\u53D6\u5F97\u30B5\u30A4\u30BA\u4E0A\u9650\u3092\u8D85\u3048\u307E\u3057\u305F\u3002","updateReason_stale-candidate":"\u914D\u5E03\u60C5\u5831\u307E\u305F\u306F\u5C0E\u5165\u72B6\u614B\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_release-unavailable":"\u53D6\u5F97\u3067\u304D\u308B\u914D\u5E03\u7248\u304C\u3042\u308A\u307E\u305B\u3093\u3002",updateReason_reinstall:"\u5C0E\u5165\u6E08\u307F\u306E\u7248\u306F\u524A\u9664\u3055\u308C\u307E\u3057\u305F\u304C\u3001\u65B0\u3057\u3044\u7248\u306E\u5C0E\u5165\u306F\u5B8C\u4E86\u3057\u3066\u3044\u307E\u305B\u3093\u3002Releases \u30DA\u30FC\u30B8\u304B\u3089\u5165\u308C\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateReason_restored:"\u65B0\u3057\u3044\u7248\u306F\u5C0E\u5165\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u4EE5\u524D\u306E\u7248\u3092\u5165\u308C\u76F4\u3057\u307E\u3057\u305F\u3002\u30D7\u30E9\u30B0\u30A4\u30F3\u304C\u52D5\u4F5C\u3057\u3066\u3044\u306A\u3044\u5834\u5408\u306FDSH\u3092\u518D\u8D77\u52D5\u3057\u3066\u304B\u3089\u3001\u518D\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_restore-failed":"\u66F4\u65B0\u3067\u3053\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u304C\u524A\u9664\u3055\u308C\u3001\u4EE5\u524D\u306E\u7248\u306E\u518D\u5C0E\u5165\u306B\u3082\u5931\u6557\u3057\u307E\u3057\u305F\u3002Releases \u30DA\u30FC\u30B8\u304B\u3089\u5165\u308C\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_restore-pending":"\u4EE5\u524D\u306E\u7248\u3092\u5165\u308C\u76F4\u3057\u307E\u3057\u305F\u3002\u305D\u306E\u7248\u3092\u52D5\u4F5C\u3055\u305B\u308B\u306B\u306F DSH \u3092\u518D\u8D77\u52D5\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u518D\u8D77\u52D5\u5F8C\u306B\u5C0E\u5165\u7D50\u679C\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002","updateReason_restore-offer":"\u3053\u306E\u66F4\u65B0\u304C\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u524A\u9664\u3057\u305F\u8A18\u9332\u304C\u306A\u3044\u304B\u3001\u5C0E\u5165\u306F\u3059\u3067\u306B\u7D42\u308F\u3063\u3066\u3044\u307E\u3059\u3002\u4EE5\u524D\u306E\u7248\u306F\u81EA\u52D5\u3067\u306F\u623B\u3057\u307E\u305B\u3093\u3002","updateReason_restore-limit":"\u81EA\u52D5\u3067\u306E\u5165\u308C\u76F4\u3057\u306F\u56DE\u6570\u306E\u4E0A\u9650\u306B\u9054\u3057\u305F\u305F\u3081\u505C\u6B62\u3057\u307E\u3057\u305F\u3002\u3053\u306E\u753B\u9762\u306E\u300C\u524D\u306E\u7248\u3092\u5165\u308C\u76F4\u3059\u300D\u304B\u3089\u623B\u3059\u304B\u3001Releases \u30DA\u30FC\u30B8\u304B\u3089\u5165\u308C\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateRestore:"\u524D\u306E\u7248\u3092\u5165\u308C\u76F4\u3059",updateSettling:"\u4FDD\u5B58\u5F85\u3061\u306E\u8A2D\u5B9A\u3092\u4FDD\u5B58\u4E2D\u2026",updateReason_settings:"\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u304B\u3001\u5225\u306E\u753B\u9762\u3067\u8A2D\u5B9A\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u4FDD\u5B58\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002",updateRunning:"\u5B9F\u884C\u7248",updateInstalledVersion:"\u5C0E\u5165\u7248",title:"Glass UI",subtitle:"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F\u3001\u58C1\u7D19\u3001\u8868\u793A\u52B9\u679C\u3092\u8A2D\u5B9A\u3057\u307E\u3059\u3002","status.on":"\u30AA\u30F3","status.off":"\u30AA\u30D5","status.forced":"\u30CF\u30A4\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u306E\u305F\u3081\u4E00\u6642\u505C\u6B62\u4E2D","status.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762 {count} \u500B","section.material":"\u8CEA\u611F","enable.label":"\u30AC\u30E9\u30B9\u306E\u8CEA\u611F","enable.hint":"\u30AA\u30D5\u306B\u3059\u308B\u3068 DSH \u672C\u6765\u306E\u898B\u305F\u76EE\u306B\u623B\u308A\u307E\u3059\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u30AF\u30EA\u30A2","tint.tinted":"\u30C6\u30A3\u30F3\u30C8","section.wallpaper":"\u58C1\u7D19","wallpaper.auto":"\u81EA\u52D5","wallpaper.auto.hint":"\u30D6\u30E9\u30A6\u30B6\u3067\u306F Bay\u3001macOS \u30A2\u30D7\u30EA\u3067\u306F\u58C1\u7D19\u306A\u3057\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52D5\u304F","wallpaper.live.hint":"\u3086\u3063\u304F\u308A\u52D5\u304D\u307E\u3059\u3002\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u304C\u30AA\u30F3\u306E\u3068\u304D\u306F\u6B62\u307E\u308A\u307E\u3059\u3002\u9759\u6B62\u3057\u305F\u58C1\u7D19\u3088\u308A\u5C11\u3057\u3060\u3051\u96FB\u529B\u3092\u4F7F\u3044\u307E\u3059\u3002","wallpaper.none":"\u306A\u3057","wallpaper.custom":"\u30AB\u30B9\u30BF\u30E0","wallpaper.url.label":"\u753B\u50CF\u306E URL","wallpaper.url.placeholder":"https://\u2026 \u307E\u305F\u306F /\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9.jpg","wallpaper.url.invalid":"http(s) \u306E URL\u3001\u3053\u306E\u30B5\u30FC\u30D0\u30FC\u4E0A\u306E\u30D1\u30B9\u3001\u307E\u305F\u306F base64 \u306E\u753B\u50CF\u30C7\u30FC\u30BF URL \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002","section.layout":"\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u52B9\u679C","sidebar.label":"\u30B5\u30A4\u30C9\u30D0\u30FC","sidebar.floating":"\u30D5\u30ED\u30FC\u30C6\u30A3\u30F3\u30B0","sidebar.docked":"\u30C9\u30C3\u30AD\u30F3\u30B0","code.label":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","code.hint":"\u30AC\u30E9\u30B9\u306F\u30B3\u30FC\u30C9\u304C\u8AAD\u307F\u3084\u3059\u3044\u6FC3\u3055\u306B\u3057\u3066\u3042\u308A\u307E\u3059\u3002","code.glass":"\u30AC\u30E9\u30B9","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u5C48\u6298","refraction.hint":"\u30AC\u30E9\u30B9\u306E\u7E01\u3067\u80CC\u666F\u304C\u66F2\u304C\u3063\u3066\u898B\u3048\u307E\u3059\u3002\u300C\u900F\u660E\u5EA6\u3092\u4E0B\u3052\u308B\u300D\u304C\u30AA\u30F3\u306E\u3068\u304D\u306F\u30AA\u30D5\u306B\u306A\u308A\u307E\u3059\u3002","refraction.unavailable":"Chrome\u3001Edge\u3001DSH \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u306A\u3069 Chromium \u7CFB\u306E\u30D6\u30E9\u30A6\u30B6\u3067\u4F7F\u3048\u307E\u3059\u3002","highlights.label":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u30CF\u30A4\u30E9\u30A4\u30C8","highlights.hint":"\u30DD\u30A4\u30F3\u30BF\u30FC\u306E\u4F4D\u7F6E\u306B\u67D4\u3089\u304B\u3044\u5149\u304C\u5F53\u305F\u308A\u307E\u3059\u3002\u30BF\u30C3\u30C1\u753B\u9762\u3068\u3001\u300C\u8996\u5DEE\u52B9\u679C\u3092\u6E1B\u3089\u3059\u300D\u307E\u305F\u306F\u300C\u900F\u660E\u5EA6\u3092\u4E0B\u3052\u308B\u300D\u3067\u306F\u30AA\u30D5\u306B\u306A\u308A\u307E\u3059\u3002","section.compat":"\u4E92\u63DB\u6027","exclude.label":"\u5909\u66F4\u3057\u306A\u3044\u8981\u7D20","exclude.hint":"CSS \u30BB\u30EC\u30AF\u30BF\u30FC\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\u6307\u5B9A\u3057\u307E\u3059\u3002\u307B\u304B\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u304C\u5D29\u308C\u308B\u3068\u304D\u306B\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u30BB\u30EC\u30AF\u30BF\u30FC\u306E\u66F8\u304D\u65B9\u304C\u6B63\u3057\u304F\u306A\u3044\u305F\u3081\u3001\u7121\u8996\u3057\u3066\u3044\u307E\u3059\u3002","diag.title":"\u8A3A\u65AD\u60C5\u5831","diag.surfaces":"\u30AC\u30E9\u30B9\u306E\u9762","diag.lenses":"\u5C48\u6298\u4E2D","diag.tokens":"DSH \u306E\u30C6\u30FC\u30DE\u30C8\u30FC\u30AF\u30F3","diag.tokens.ok":"\u3059\u3079\u3066\u898B\u3064\u304B\u308A\u307E\u3057\u305F","diag.tokens.missing":"\u3053\u306E\u7248\u306E DSH \u306B\u306A\u3044\u3082\u306E: {list}","diag.tokens.ambiguous":"\u533A\u5225\u3067\u304D\u306A\u3044\u3082\u306E: {list}","diag.scan":"\u8D70\u67FB","diag.scan.value":"{batches} \u56DE\u3001\u6700\u9577 {longest} ms","diag.copy":"\u8A3A\u65AD\u60C5\u5831\u3092\u30B3\u30D4\u30FC","diag.copied":"\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F","diag.copy.failed":"\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u4E0B\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u9078\u629E\u3057\u3066\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002","kind.sidebar":"\u30B5\u30A4\u30C9\u30D0\u30FC","kind.composer":"\u5165\u529B\u6B04","kind.panel":"\u30D1\u30CD\u30EB","kind.menu":"\u30E1\u30CB\u30E5\u30FC","kind.smoke":"\u30C8\u30FC\u30B9\u30C8\u3068\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7","kind.code":"\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF","kind.backdrop":"\u80CC\u666F","save.local":"\u3053\u306E\u63A5\u7D9A\u3067\u306F\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u5909\u66F4\u306F\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3059\u308B\u307E\u3067\u6709\u52B9\u3067\u3059\u3002","save.error":"\u5909\u66F4\u3092\u4FDD\u5B58\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u5143\u306E\u5024\u306B\u623B\u3057\u307E\u3057\u305F\u3002","save.saving":"\u4FDD\u5B58\u4E2D\u2026",footer:"dsh-glassui {version}\u3002\u975E\u516C\u5F0F\u306E\u30D7\u30E9\u30B0\u30A4\u30F3\u3067\u3001DeepSeek \u3068\u306F\u95A2\u4FC2\u3042\u308A\u307E\u305B\u3093\u3002"},Ht={"settings.close":"\u5173\u95ED","tint.preview":"\u73BB\u7483\u9884\u89C8","slider.hint":"\u62D6\u52A8\u65F6\u5728\u6B64\u9884\u89C8\uFF0C\u677E\u5F00\u540E\u5E94\u7528\u5230\u6574\u4E2A\u9875\u9762\u3002","updateReason_manual-update":"DSH \u62D2\u7EDD\u66FF\u6362\u63D2\u4EF6\u3002\u8BF7\u505C\u6B62 DSH\uFF0C\u901A\u8FC7 CLI \u5B89\u88C5\u8BE5\u7248\u672C\u540E\u91CD\u65B0\u542F\u52A8\u3002","inline.label":"\u884C\u5185\u4EE3\u7801\u4E0D\u900F\u660E\u5EA6","inline.readable":"\u6613\u8BFB","inline.hint":"\u72EC\u7ACB\u4E8E\u4EE3\u7801\u5757\u548C\u900F\u660E\u5EA6\u3002\u63A8\u8350\uFF1A60\u201385\u3002\u5BF9\u6BD4\u5EA6\u504F\u597D\u53EF\u80FD\u63D0\u9AD8\u4E0D\u900F\u660E\u5EA6\u3002","inline.preview":"\u884C\u5185\u4EE3\u7801\u9884\u89C8","inline.example":"\u5728\u6D88\u606F\u4E2D\u4F7F\u7528\uFF1A",updateReason_profile:"\u8FDE\u63A5\u7684\u914D\u7F6E\u73AF\u5883\u5DF2\u6539\u53D8\u3002\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002",updateTitle:"Glass UI\u63D2\u4EF6",updateIdle:"\u5C1A\u672A\u68C0\u67E5\u66F4\u65B0\u3002",updateChecking:"\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026",updateCurrent:"\u6CA1\u6709\u66F4\u65B0\u7684\u6B63\u5F0F\u7248\u672C\u3002",updateAvailable:"\u63D2\u4EF6\u6709\u66F4\u65B0\u3002\u58C1\u7EB8\u3001\u6548\u679C\u548C\u6392\u9664\u8BBE\u7F6E\u4F1A\u4FDD\u7559\u3002",updateBlocked:"\u65E0\u6CD5\u68C0\u67E5\u66F4\u65B0\uFF0C\u6216\u6B64\u73AF\u5883\u4E0D\u5141\u8BB8\u66F4\u65B0\u3002",updatePreparing:"\u6B63\u5728\u4E0B\u8F7D\u5E76\u9A8C\u8BC1\u53D1\u5E03\u6587\u4EF6\u2026",updateInstalling:"\u6B63\u5728\u5B89\u88C5\u63D2\u4EF6\u2026",updateRestart:"\u5DF2\u5B89\u88C5\u3002\u5B8C\u6210\u5F53\u524D\u5DE5\u4F5C\u540E\uFF0C\u8BF7\u91CD\u65B0\u542F\u52A8DSH\u4EE5\u5E94\u7528\u66F4\u65B0\u3002",updateApplied:"\u66F4\u65B0\u540E\u7684\u63D2\u4EF6\u7248\u672C\u6B63\u5728\u8FD0\u884C\u3002",updateFailed:"\u66F4\u65B0\u5931\u8D25\u3002\u8BF7\u68C0\u67E5\u9636\u6BB5\u5E76\u91CD\u8BD5\u3002",updateCancelled:"\u5B89\u88C5\u7A0B\u5E8F\u5DF2\u786E\u8BA4\u53D6\u6D88\u3002",updateOverridden:"\u4E0A\u5C42\u8BBE\u7F6E\u963B\u6B62\u4E86\u66F4\u65B0\u5E94\u7528\u3002",updateUnknown:"\u5B89\u88C5\u7ED3\u679C\u672A\u77E5\u3002\u8BF7\u5148\u6838\u5BF9\u7ED3\u679C\uFF0C\u4E0D\u8981\u91CD\u65B0\u53D1\u9001\u5B89\u88C5\u3002",updateCheck:"\u68C0\u67E5\u63D2\u4EF6\u66F4\u65B0",updateInstall:"\u66F4\u65B0\u63D2\u4EF6",updateReconcile:"\u6838\u5BF9\u5B89\u88C5\u7ED3\u679C",updateManual:"\u53D1\u5E03\u7248\u672C\u4E0E\u624B\u52A8\u66F4\u65B0",updateChecked:"\u68C0\u67E5\u65F6\u95F4",updateStage:"\u5B89\u88C5\u9636\u6BB5","updateReason_manager-unavailable":"\u6B64\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\u3002\u8BF7\u4ECE\u53D1\u5E03\u9875\u9762\u66F4\u65B0\u3002","updateReason_read-only":"\u6B64\u73AF\u5883\u4E0D\u80FD\u4FEE\u6539\u6B64\u63D2\u4EF6\u3002",updateReason_source:"\u6B64\u5B89\u88C5\u6765\u6E90\u9700\u8981\u624B\u52A8\u66F4\u65B0\uFF1B\u4FDD\u7559\u7248\u672C\u56FA\u5B9A\u3002",updateReason_incompatible:"\u6B64\u7248\u672C\u4E0D\u652F\u6301\u5F53\u524DDSH\u7248\u672C\u3002","updateReason_compatibility-unknown":"\u65E0\u6CD5\u786E\u8BA4\u6B64\u53D1\u5E03\u7248\u7684DSH\u517C\u5BB9\u6027\u3002",updateReason_busy:"\u5176\u4ED6\u66F4\u65B0\u6216\u8BBE\u7F6E\u53D8\u66F4\u6B63\u5728\u8FDB\u884C\u3002\u5B8C\u6210\u540E\u518D\u91CD\u8BD5\u3002",updateReason_network:"\u65E0\u6CD5\u8FDE\u63A5\u53D1\u5E03\u670D\u52A1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",updateReason_metadata:"\u53D1\u5E03\u5143\u6570\u636E\u65E0\u6548\uFF0C\u8BF7\u67E5\u770B\u53D1\u5E03\u9875\u9762\u3002",updateReason_asset:"\u6240\u9700\u53D1\u5E03\u6587\u4EF6\u7F3A\u5931\u6216\u91CD\u590D\u3002",updateReason_channel:"\u53EA\u652F\u6301\u6B63\u5F0F\u7248\u672C\u3002",updateReason_checksum:"\u53D1\u5E03\u6587\u4EF6\u6821\u9A8C\u548C\u9A8C\u8BC1\u5931\u8D25\u3002",updateReason_redirect:"\u4E0B\u8F7D\u88AB\u91CD\u5B9A\u5411\u5230\u672A\u5141\u8BB8\u7684\u4E3B\u673A\u3002",updateReason_size:"\u53D1\u5E03\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u9650\u5236\u3002","updateReason_stale-candidate":"\u53D1\u5E03\u4FE1\u606F\u6216\u5B89\u88C5\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002","updateReason_release-unavailable":"\u6CA1\u6709\u53EF\u8BBF\u95EE\u7684\u53D1\u5E03\u7248\u672C\u3002",updateReason_reinstall:"\u5DF2\u5B89\u88C5\u7684\u7248\u672C\u5DF2\u79FB\u9664\uFF0C\u4F46\u65B0\u7248\u672C\u6CA1\u6709\u5B8C\u6210\u5B89\u88C5\u3002\u8BF7\u4ECE Releases \u9875\u9762\u91CD\u65B0\u5B89\u88C5\u3002",updateReason_restored:"\u65B0\u7248\u672C\u6CA1\u6709\u5B89\u88C5\u3002\u5DF2\u91CD\u65B0\u5B89\u88C5\u5148\u524D\u7684\u7248\u672C\u3002\u5982\u679C\u63D2\u4EF6\u6CA1\u6709\u5728\u8FD0\u884C\uFF0C\u8BF7\u91CD\u542F DSH \u540E\u518D\u68C0\u67E5\u3002","updateReason_restore-failed":"\u66F4\u65B0\u5DF2\u5220\u9664\u6B64\u63D2\u4EF6\uFF0C\u4E14\u6062\u590D\u5148\u524D\u7248\u672C\u5931\u8D25\u3002\u8BF7\u4ECE Releases \u9875\u9762\u91CD\u65B0\u5B89\u88C5\u3002","updateReason_restore-pending":"\u5DF2\u91CD\u65B0\u5B89\u88C5\u5148\u524D\u7684\u7248\u672C\u3002\u8BF7\u91CD\u65B0\u542F\u52A8 DSH \u540E\u518D\u8BA9\u8BE5\u7248\u672C\u8FD0\u884C\uFF0C\u5E76\u6838\u5BF9\u5B89\u88C5\u7ED3\u679C\u3002","updateReason_restore-offer":"\u6CA1\u6709\u8FD9\u6B21\u66F4\u65B0\u5220\u9664\u63D2\u4EF6\u7684\u8BB0\u5F55\uFF0C\u6216\u5B89\u88C5\u5DF2\u7ECF\u7ED3\u675F\u3002\u5148\u524D\u7684\u7248\u672C\u4E0D\u4F1A\u81EA\u52A8\u88C5\u56DE\u3002","updateReason_restore-limit":"\u81EA\u52A8\u91CD\u65B0\u5B89\u88C5\u5DF2\u8FBE\u5230\u6B21\u6570\u4E0A\u9650\u5E76\u5DF2\u505C\u6B62\u3002\u53EF\u4F7F\u7528\u672C\u9875\u7684\u300C\u91CD\u65B0\u5B89\u88C5\u5148\u524D\u7248\u672C\u300D\uFF0C\u6216\u4ECE Releases \u9875\u9762\u91CD\u65B0\u5B89\u88C5\u3002",updateRestore:"\u91CD\u65B0\u5B89\u88C5\u5148\u524D\u7248\u672C",updateReason_storage:"\u65E0\u6CD5\u5C06\u66F4\u65B0\u6587\u4EF6\u5199\u5165profile\u3002",updateReason_interrupted:"\u5B89\u88C5\u524D\u7684\u4E0B\u8F7D\u5DF2\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u3002",updateSettling:"\u6B63\u5728\u4FDD\u5B58\u5F85\u5904\u7406\u8BBE\u7F6E\u2026",updateReason_settings:"\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u6216\u8BBE\u7F6E\u5DF2\u5728\u5176\u4ED6\u7A97\u53E3\u4E2D\u6539\u53D8\u3002\u8BF7\u5148\u89E3\u51B3\u4FDD\u5B58\u9519\u8BEF\u3002",updateRunning:"\u8FD0\u884C\u7248\u672C",updateInstalledVersion:"\u5B89\u88C5\u7248\u672C",title:"Glass UI",subtitle:"\u8BBE\u7F6E\u73BB\u7483\u6750\u8D28\u3001\u5899\u7EB8\u548C\u663E\u793A\u6548\u679C\u3002","status.on":"\u5DF2\u5F00\u542F","status.off":"\u5DF2\u5173\u95ED","status.forced":"\u9AD8\u5BF9\u6BD4\u5EA6\u6A21\u5F0F\u4E0B\u5DF2\u6682\u505C","status.surfaces":"{count} \u4E2A\u73BB\u7483\u754C\u9762","section.material":"\u6750\u8D28","enable.label":"\u73BB\u7483\u6750\u8D28","enable.hint":"\u5173\u95ED\u540E\u6062\u590D DSH \u539F\u672C\u7684\u5916\u89C2\u3002","tint.label":"\u900F\u660E\u5EA6","tint.clear":"\u901A\u900F","tint.tinted":"\u7740\u8272","section.wallpaper":"\u5899\u7EB8","wallpaper.auto":"\u81EA\u52A8","wallpaper.auto.hint":"\u6D4F\u89C8\u5668\u4E2D\u4F7F\u7528 Bay\uFF0CmacOS \u5E94\u7528\u4E2D\u4E0D\u4F7F\u7528\u5899\u7EB8\u3002","wallpaper.bay":"Bay","wallpaper.sunrise":"Sunrise","wallpaper.meadow":"Meadow","wallpaper.graphite":"Graphite","wallpaper.lagoon":"Lagoon","wallpaper.dusk":"Dusk","wallpaper.dune":"Dune","wallpaper.tide":"Tide","wallpaper.aurora":"Aurora","wallpaper.bloom":"Bloom","wallpaper.prism":"Prism","wallpaper.live":"\u52A8\u6001","wallpaper.live.hint":"\u7F13\u6162\u6D41\u52A8\u3002\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u65F6\u4FDD\u6301\u9759\u6B62\uFF0C\u8017\u7535\u7565\u9AD8\u4E8E\u9759\u6001\u5899\u7EB8\u3002","wallpaper.none":"\u65E0","wallpaper.custom":"\u81EA\u5B9A\u4E49","wallpaper.url.label":"\u56FE\u7247\u5730\u5740","wallpaper.url.placeholder":"https://\u2026 \u6216 /\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84.jpg","wallpaper.url.invalid":"\u8BF7\u4F7F\u7528 http(s) \u5730\u5740\u3001\u672C\u670D\u52A1\u5668\u4E0A\u7684\u8DEF\u5F84\u6216 base64 \u56FE\u7247\u6570\u636E\u5730\u5740\u3002","section.layout":"\u5E03\u5C40\u4E0E\u6548\u679C","sidebar.label":"\u4FA7\u680F","sidebar.floating":"\u60AC\u6D6E","sidebar.docked":"\u505C\u9760","code.label":"\u4EE3\u7801\u5757","code.hint":"\u73BB\u7483\u6548\u679C\u4F7F\u7528\u8F83\u6D53\u7684\u8272\u8C03\uFF0C\u4EE3\u7801\u4F9D\u7136\u6E05\u6670\u6613\u8BFB\u3002","code.glass":"\u73BB\u7483","code.solid":"\u4E0D\u900F\u660E","refraction.label":"\u6298\u5C04","refraction.hint":"\u73BB\u7483\u8FB9\u7F18\u5904\u7684\u80CC\u666F\u4F1A\u4EA7\u751F\u5F2F\u66F2\u3002\u5F00\u542F\u201C\u964D\u4F4E\u900F\u660E\u5EA6\u201D\u65F6\u5173\u95ED\u3002","refraction.unavailable":"\u9700\u8981 Chrome\u3001Edge \u6216 DSH \u684C\u9762\u5E94\u7528\u7B49\u57FA\u4E8E Chromium \u7684\u6D4F\u89C8\u5668\u3002","highlights.label":"\u6307\u9488\u9AD8\u5149","highlights.hint":"\u67D4\u548C\u7684\u5149\u4F1A\u8DDF\u968F\u6307\u9488\u3002\u5728\u89E6\u6478\u5C4F\u4E0A\uFF0C\u4EE5\u53CA\u5F00\u542F\u201C\u51CF\u5F31\u52A8\u6001\u6548\u679C\u201D\u6216\u201C\u964D\u4F4E\u900F\u660E\u5EA6\u201D\u65F6\u5173\u95ED\u3002","section.compat":"\u517C\u5BB9\u6027","exclude.label":"\u4E0D\u5904\u7406\u7684\u5143\u7D20","exclude.hint":"\u4EE5\u9017\u53F7\u5206\u9694\u7684 CSS \u9009\u62E9\u5668\u3002\u5F53\u5176\u4ED6\u63D2\u4EF6\u5728\u73BB\u7483\u6548\u679C\u4E0B\u663E\u793A\u5F02\u5E38\u65F6\u4F7F\u7528\u3002","exclude.placeholder":".my-plugin-panel, [data-my-plugin]","exclude.invalid":"\u8BE5\u9009\u62E9\u5668\u65E0\u6548\uFF0C\u5DF2\u88AB\u5FFD\u7565\u3002","diag.title":"\u8BCA\u65AD\u4FE1\u606F","diag.surfaces":"\u73BB\u7483\u754C\u9762","diag.lenses":"\u6B63\u5728\u6298\u5C04","diag.tokens":"DSH \u4E3B\u9898\u4EE4\u724C","diag.tokens.ok":"\u5168\u90E8\u627E\u5230","diag.tokens.missing":"\u6B64\u7248\u672C DSH \u4E2D\u4E0D\u5B58\u5728\uFF1A{list}","diag.tokens.ambiguous":"\u65E0\u6CD5\u533A\u5206\uFF1A{list}","diag.scan":"\u626B\u63CF","diag.scan.value":"{batches} \u6B21\uFF0C\u6700\u957F {longest} \u6BEB\u79D2","diag.copy":"\u590D\u5236\u8BCA\u65AD\u4FE1\u606F","diag.copied":"\u5DF2\u590D\u5236","diag.copy.failed":"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u4E0B\u65B9\u6587\u672C\u8FDB\u884C\u590D\u5236\u3002","kind.sidebar":"\u4FA7\u680F","kind.composer":"\u8F93\u5165\u6846","kind.panel":"\u9762\u677F","kind.menu":"\u83DC\u5355","kind.smoke":"\u63D0\u793A\u4E0E\u5DE5\u5177\u63D0\u793A","kind.code":"\u4EE3\u7801\u5757","kind.backdrop":"\u80CC\u666F","save.local":"\u5F53\u524D\u8FDE\u63A5\u65E0\u6CD5\u4FDD\u5B58\u8BBE\u7F6E\uFF0C\u66F4\u6539\u5C06\u5728\u9875\u9762\u91CD\u65B0\u52A0\u8F7D\u524D\u6709\u6548\u3002","save.error":"\u65E0\u6CD5\u4FDD\u5B58\u66F4\u6539\uFF0C\u5DF2\u6062\u590D\u539F\u6765\u7684\u503C\u3002","save.saving":"\u6B63\u5728\u4FDD\u5B58\u2026",footer:"dsh-glassui {version}\u3002\u975E\u5B98\u65B9\u63D2\u4EF6\uFF0C\u4E0E DeepSeek \u65E0\u5173\u3002"};var b=require("react");var o=require("react/jsx-runtime"),Di=1e3;function Wt(i){let[e,t]=(0,b.useState)(i.value),s=(0,b.useRef)(i.value),a=(0,b.useRef)(!1),n=(0,b.useRef)(void 0),r=()=>i.controller.update(i.field,s.current),l=()=>{a.current&&(a.current=!1,r(),n.current?.(),n.current=void 0)},c=(0,b.useRef)(l);return c.current=l,(0,b.useEffect)(()=>{a.current||(s.current=i.value,t(i.value))},[i.value]),(0,b.useEffect)(()=>{let d=()=>c.current();return window.addEventListener("pointerup",d,!0),window.addEventListener("pointercancel",d,!0),window.addEventListener("blur",d),()=>{window.removeEventListener("pointerup",d,!0),window.removeEventListener("pointercancel",d,!0),window.removeEventListener("blur",d),d()}},[]),(0,o.jsxs)("div",{className:"glassui-slider",style:{"--glassui-preview-opacity":e/100},children:[(0,o.jsxs)("div",{className:"glassui-slider__head",children:[(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:i.id,children:i.label}),(0,o.jsx)("span",{className:"glassui-slider__value",children:e})]}),(0,o.jsx)("input",{id:i.id,type:"range",min:0,max:100,step:1,value:e,className:"glassui-range","aria-describedby":i.describedBy,style:{"--glassui-progress":`${e}%`},onPointerDown:()=>{a.current||(a.current=!0,n.current=i.controller.beginAdjustment(()=>c.current()))},onBlur:l,onChange:d=>{s.current=Number(d.target.value),t(s.current),a.current||r()}}),(0,o.jsxs)("div",{className:"glassui-slider__ends","aria-hidden":"true",children:[(0,o.jsx)("span",{children:i.left}),(0,o.jsx)("span",{children:i.right})]}),(0,o.jsx)("div",{className:"glassui-slider-preview","aria-label":i.previewLabel,"data-kind":i.field,"data-scheme":i.scheme,style:{backgroundImage:ie("bay",i.scheme)},children:(0,o.jsx)("span",{className:"glassui-slider-preview__pane",children:i.field==="inlineCodeOpacity"?(0,o.jsx)("code",{children:"path"}):i.previewLabel})}),(0,o.jsx)("p",{className:"glassui-note",children:i.hint})]})}function Mi(i){return(0,b.useSyncExternalStore)(i.subscribe,i.getSnapshot)}function Oi(i){let e=(0,b.useSyncExternalStore)(i.subscribe,i.revision);return(0,b.useCallback)((t,s)=>i.translate(t,s),[i,e])}function Pi(){let i=()=>document.body.hasAttribute("data-ds-dark-theme")?"dark":"light",[e,t]=(0,b.useState)(i);return(0,b.useEffect)(()=>{let s=new MutationObserver(()=>t(i()));return s.observe(document.body,{attributes:!0,attributeFilter:["data-ds-dark-theme"]}),()=>s.disconnect()},[]),e}function be(i){return(0,o.jsxs)("div",{className:"glassui-row",children:[(0,o.jsxs)("div",{className:"glassui-row__text",children:[i.htmlFor?(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:i.htmlFor,children:i.label}):(0,o.jsx)("span",{className:"glassui-row__label",children:i.label}),i.hint?(0,o.jsx)("span",{className:"glassui-row__hint",children:i.hint}):null]}),(0,o.jsx)("div",{className:"glassui-row__control",children:i.children})]})}function rt(i){return(0,o.jsx)("button",{type:"button",role:"switch",className:"glassui-switch","aria-checked":i.checked,"aria-label":i.label,disabled:i.disabled,onClick:()=>i.onChange(!i.checked)})}function qt(i){let e=[...i.currentTarget.querySelectorAll('[role="radio"]')],t=e.findIndex(a=>a===i.target);if(t<0)return;let s;switch(i.key){case"ArrowRight":case"ArrowDown":s=(t+1)%e.length;break;case"ArrowLeft":case"ArrowUp":s=(t+e.length-1)%e.length;break;case"Home":s=0;break;case"End":s=e.length-1;break;default:return}i.preventDefault(),e[s]?.focus(),e[s]?.click()}function Vt(i){let e=Math.max(0,i.options.findIndex(t=>t.value===i.value));return(0,o.jsxs)("div",{className:"glassui-segmented",role:"radiogroup","aria-label":i.label,onKeyDown:qt,style:{"--glassui-segments":i.options.length,"--glassui-index":e},children:[(0,o.jsx)("span",{className:"glassui-segmented__thumb","aria-hidden":"true"}),i.options.map(t=>(0,o.jsx)("button",{type:"button",role:"radio","aria-checked":t.value===i.value,tabIndex:t.value===i.value?0:-1,className:"glassui-segmented__option",onClick:()=>i.onChange(t.value),children:t.label},t.value))]})}function jt(i){let[e,t]=(0,b.useState)(i.value);(0,b.useEffect)(()=>t(i.value),[i.value]);let s=i.validate?e.trim()!==""&&!i.validate(e.trim()):!1,a=()=>{let n=e.trim();n===i.value||s||i.onCommit(n)};return(0,o.jsxs)("div",{className:"glassui-field",children:[(0,o.jsx)("input",{id:i.id,className:"glassui-input",value:e,placeholder:i.placeholder,spellCheck:!1,autoComplete:"off","aria-invalid":i.invalid||s,onChange:n=>t(n.target.value),onBlur:a,onKeyDown:n=>{n.key==="Enter"&&a()}}),i.invalid||s?(0,o.jsx)("span",{className:"glassui-field__error",role:"alert",children:i.message}):null]})}function ot(i){if(i==="auto")return"bay";if(!(i==="none"||i==="custom"))return i}var Fi=(0,b.memo)(function(e){let{t}=e;return(0,o.jsx)("div",{className:"glassui-wallpapers",role:"radiogroup","aria-label":t("section.wallpaper"),onKeyDown:qt,children:ze.map(s=>{let a=ot(s),n=a?ie(a,e.scheme):void 0,r=s!=="auto"&&a!==void 0&&ye(a),l=t(`wallpaper.${s}`);return(0,o.jsxs)("button",{type:"button",role:"radio","aria-checked":e.value===s,tabIndex:e.value===s?0:-1,"aria-label":r?`${l}, ${t("wallpaper.live")}`:l,className:"glassui-wallpaper","data-choice":s,onClick:()=>e.onChange(s),children:[(0,o.jsxs)("span",{className:"glassui-wallpaper__swatch","aria-hidden":"true",style:n?{backgroundImage:n}:void 0,children:[s==="auto"?(0,o.jsx)("span",{className:"glassui-wallpaper__badge",children:"A"}):null,r?(0,o.jsx)("span",{className:"glassui-wallpaper__badge","data-kind":"live",children:t("wallpaper.live")}):null]}),(0,o.jsx)("span",{className:"glassui-wallpaper__name",children:l})]},s)})})});function Ui(i){let{state:e,t}=i,{diagnostics:s}=e,[a,n]=(0,b.useState)("idle"),r=()=>JSON.stringify({version:i.version,settings:{...e.settings,wallpaperUrl:e.settings.wallpaperUrl?"[configured]":""},diagnostics:s,userAgent:navigator.userAgent},null,2),l=se.filter(u=>s.surfaces[u]>0).map(u=>`${t(`kind.${u}`)} ${s.surfaces[u]}`).join(" \xB7 "),c=s.missingTokens.length===0&&s.ambiguousTokens.length===0?t("diag.tokens.ok"):[s.missingTokens.length>0?t("diag.tokens.missing",{list:s.missingTokens.join(", ")}):"",s.ambiguousTokens.length>0?t("diag.tokens.ambiguous",{list:s.ambiguousTokens.join(", ")}):""].filter(Boolean).join(" "),d=async()=>{let u=r();try{await navigator.clipboard.writeText(u),n("done")}catch{n("failed")}};return(0,o.jsxs)("div",{className:"glassui-diagnostics",children:[(0,o.jsxs)("dl",{className:"glassui-facts",children:[(0,o.jsx)("dt",{children:t("diag.surfaces")}),(0,o.jsx)("dd",{children:l||"\u2014"}),(0,o.jsx)("dt",{children:t("diag.lenses")}),(0,o.jsx)("dd",{children:s.lenses}),(0,o.jsx)("dt",{children:t("diag.tokens")}),(0,o.jsx)("dd",{children:c}),(0,o.jsx)("dt",{children:t("diag.scan")}),(0,o.jsx)("dd",{children:t("diag.scan.value",{batches:s.scans.batches,longest:s.scans.longestMs.toFixed(1)})})]}),(0,o.jsx)("div",{className:"glassui-actions",children:(0,o.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{d()},children:t(a==="done"?"diag.copied":"diag.copy")})}),a==="failed"?(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("p",{className:"glassui-note",children:t("diag.copy.failed")}),(0,o.jsx)("textarea",{className:"glassui-report",readOnly:!0,value:r(),"aria-label":t("diag.title")})]}):null]})}var Ki={idle:"updateIdle",checking:"updateChecking",current:"updateCurrent",available:"updateAvailable",blocked:"updateBlocked",settling:"updateSettling",starting:"updatePreparing",preparing:"updatePreparing",installing:"updateInstalling","restart-required":"updateRestart",applied:"updateApplied",failed:"updateFailed",cancelled:"updateCancelled",overridden:"updateOverridden",unknown:"updateUnknown"};function zi({controller:i,t:e}){let t=(0,b.useSyncExternalStore)(i.subscribe,i.getSnapshot);(0,b.useEffect)(()=>{i.load()},[i]);let s=["settling","checking","starting","preparing","installing"].includes(t.status),a=`updateReason_${t.reason}`in Me?`updateReason_${t.reason}`:"updateReason_network";return(0,o.jsxs)("section",{className:"glassui-section glassui-update","aria-label":e("updateTitle"),children:[(0,o.jsx)("h3",{className:"glassui-section__title",children:e("updateTitle")}),(0,o.jsxs)("div",{className:"glassui-card glassui-stack",children:[(0,o.jsxs)("p",{children:[e("updateRunning"),": ",t.runtimeVersion??"0.2.6",t.installedVersion?` \xB7 ${e("updateInstalledVersion")}: ${t.installedVersion}`:""]}),(0,o.jsx)("p",{role:["failed","blocked"].includes(t.status)||t.reason==="restore-failed"||t.reason==="restore-pending"||t.reason==="restore-limit"?"alert":"status",children:e(t.reason==="restore-pending"||t.reason==="restore-offer"||t.reason==="restore-limit"?`updateReason_${t.reason}`:Ki[t.status])}),t.reason&&t.reason!=="restore-pending"&&t.reason!=="restore-offer"&&t.reason!=="restore-limit"?(0,o.jsx)("p",{className:"glassui-note",children:e(a)}):null,t.checkedAt?(0,o.jsxs)("p",{className:"glassui-note",children:[e("updateChecked"),": ",new Date(t.checkedAt).toLocaleString()]}):null,t.candidate?(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)("p",{children:[t.runtimeVersion," \u2192 ",t.candidate.version," \xB7 DSH ",t.candidate.compatibility]}),(0,o.jsx)("p",{className:"glassui-update__notes",children:t.candidate.notes})]}):t.version?(0,o.jsxs)("p",{children:[t.runtimeVersion," \u2192 ",t.version]}):null,(0,o.jsxs)("div",{className:"glassui-actions",children:[(0,o.jsx)("button",{type:"button",className:"glassui-button",disabled:s||t.status==="unknown"||t.status==="restart-required",onClick:()=>{i.check()},children:e("updateCheck")}),t.status==="available"?(0,o.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{i.begin()},children:e("updateInstall")}):null,t.status==="unknown"?(0,o.jsx)("button",{type:"button",className:"glassui-button",onClick:()=>{i.load()},children:e("updateReconcile")}):null,t.reason==="restore-offer"||t.reason==="restore-limit"?(0,o.jsx)("button",{type:"button",className:"glassui-button",disabled:s,onClick:()=>{i.restore()},children:e("updateRestore")}):null,(0,o.jsx)("a",{href:"https://github.com/Aero123421/dsh-glassui/releases",target:"_blank",rel:"noopener noreferrer",children:e("updateManual")})]}),t.result?(0,o.jsxs)("p",{className:"glassui-note",children:[e("updateStage"),": ",t.result.stage,t.result.error?` \xB7 ${t.result.error.code}`:""]}):null]})]})}function Yt(i){let e=Mi(i.controller),t=(0,b.useSyncExternalStore)(i.updates.subscribe,i.updates.getSnapshot),s=Oi(i.locale),a=Pi(),n=(0,b.useCallback)(h=>i.controller.update("wallpaper",h),[i.controller]),r=(0,b.useId)(),l=(0,b.useRef)(null),c=(0,b.useRef)(null),[d,u]=(0,b.useState)(!1),g=(0,b.useCallback)(()=>i.close?.(),[i.close]);(0,b.useEffect)(()=>{let h=l.current;if(!h)return;let y=()=>u(h.clientWidth>0&&h.clientWidth<240);y();let H=new ResizeObserver(y);return H.observe(h),()=>H.disconnect()},[]),(0,b.useEffect)(()=>{if(!d)return;let h=c.current;if(!h)return;let y=document.activeElement;if(!(y instanceof HTMLElement&&h.contains(y)))return h.querySelector("button")?.focus(),()=>{y instanceof HTMLElement&&y.isConnected&&y.focus()}},[d]);let{settings:p,diagnostics:m}=e,x=(h,y)=>i.controller.update(h,y);(0,b.useEffect)(()=>{let h=setInterval(()=>i.controller.refreshDiagnostics(),Di);return()=>clearInterval(h)},[i.controller]);let ne=se.filter(h=>h!=="backdrop").reduce((h,y)=>h+m.surfaces[y],0),re=m.running?`${s("status.on")} \xB7 ${s("status.surfaces",{count:ne})}`:m.idle==="forced-colors"?s("status.forced"):s("status.off"),B=(0,o.jsxs)("div",{className:"glassui-page","data-testid":"glassui-settings",children:[(0,o.jsxs)("header",{className:"glassui-hero",children:[(0,o.jsx)("div",{className:"glassui-hero__art","aria-hidden":"true",style:{backgroundImage:ie(ot(p.wallpaper)??"bay",a)},children:(0,o.jsx)("span",{className:"glassui-hero__pane"})}),(0,o.jsxs)("div",{className:"glassui-hero__text",children:[(0,o.jsx)("h2",{className:"glassui-hero__title",children:s("title")}),(0,o.jsx)("p",{className:"glassui-hero__subtitle",children:s("subtitle")}),(0,o.jsx)("span",{className:"glassui-status","data-on":m.running,children:re})]})]}),e.save==="local"||e.save==="error"?(0,o.jsx)("p",{className:"glassui-banner",role:"status",children:s(e.save==="local"?"save.local":"save.error")}):null,(0,o.jsxs)("fieldset",{className:"glassui-settings-controls",disabled:e.updating||["settling","starting","preparing","installing"].includes(t.status),children:[(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${r}-material`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${r}-material`,children:s("section.material")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(be,{label:s("enable.label"),hint:s("enable.hint"),children:(0,o.jsx)(rt,{checked:p.enabled,label:s("enable.label"),onChange:h=>x("enabled",h)})}),(0,o.jsx)(Wt,{id:`${r}-tint`,label:s("tint.label"),value:p.tint,left:s("tint.clear"),right:s("tint.tinted"),field:"tint",controller:i.controller,scheme:a,previewLabel:s("tint.preview"),hint:s("slider.hint")})]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${r}-wallpaper`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${r}-wallpaper`,children:s("section.wallpaper")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(Fi,{value:p.wallpaper,scheme:a,t:s,onChange:n}),p.wallpaper==="auto"?(0,o.jsx)("p",{className:"glassui-note",children:s("wallpaper.auto.hint")}):null,p.wallpaper!=="auto"&&ye(ot(p.wallpaper)??"bay")?(0,o.jsx)("p",{className:"glassui-note",children:s("wallpaper.live.hint")}):null,p.wallpaper==="custom"?(0,o.jsx)(be,{label:s("wallpaper.url.label"),htmlFor:`${r}-url`,children:(0,o.jsx)(jt,{id:`${r}-url`,value:p.wallpaperUrl,placeholder:s("wallpaper.url.placeholder"),invalid:p.wallpaperUrl!==""&&!ve(p.wallpaperUrl),message:s("wallpaper.url.invalid"),validate:ve,onCommit:h=>x("wallpaperUrl",h)})}):null]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${r}-layout`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${r}-layout`,children:s("section.layout")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsx)(be,{label:s("sidebar.label"),children:(0,o.jsx)(Vt,{label:s("sidebar.label"),value:p.sidebar,options:[{value:"floating",label:s("sidebar.floating")},{value:"docked",label:s("sidebar.docked")}],onChange:h=>x("sidebar",h)})}),(0,o.jsx)(be,{label:s("code.label"),hint:s("code.hint"),children:(0,o.jsx)(Vt,{label:s("code.label"),value:p.codeBlocks,options:[{value:"glass",label:s("code.glass")},{value:"solid",label:s("code.solid")}],onChange:h=>x("codeBlocks",h)})}),(0,o.jsxs)("div",{className:"glassui-inline-settings",children:[(0,o.jsx)(Wt,{id:`${r}-inline-opacity`,label:s("inline.label"),value:p.inlineCodeOpacity,left:s("tint.clear"),right:s("inline.readable"),describedBy:`${r}-inline-hint`,field:"inlineCodeOpacity",controller:i.controller,scheme:a,previewLabel:s("inline.preview"),hint:s("slider.hint")}),(0,o.jsx)("p",{className:"glassui-note",id:`${r}-inline-hint`,children:s("inline.hint")}),(0,o.jsx)("div",{className:"glassui-inline-preview","aria-label":s("inline.preview"),children:(0,o.jsxs)("p",{children:[s("inline.example")," ",(0,o.jsx)("code",{children:"grep"})," \xB7 ",(0,o.jsx)("code",{children:"path"})," \xB7 ",(0,o.jsx)("code",{children:"@deepseek-ai/dsh"})]})})]}),(0,o.jsx)(be,{label:s("refraction.label"),hint:i.refractionSupported?s("refraction.hint"):s("refraction.unavailable"),children:(0,o.jsx)(rt,{checked:p.refraction&&i.refractionSupported,label:s("refraction.label"),disabled:!i.refractionSupported,onChange:h=>x("refraction",h)})}),(0,o.jsx)(be,{label:s("highlights.label"),hint:s("highlights.hint"),children:(0,o.jsx)(rt,{checked:p.highlights,label:s("highlights.label"),onChange:h=>x("highlights",h)})})]})]}),(0,o.jsxs)("section",{className:"glassui-section","aria-labelledby":`${r}-compat`,children:[(0,o.jsx)("h3",{className:"glassui-section__title",id:`${r}-compat`,children:s("section.compat")}),(0,o.jsxs)("div",{className:"glassui-card",children:[(0,o.jsxs)("div",{className:"glassui-stack",children:[(0,o.jsx)("label",{className:"glassui-row__label",htmlFor:`${r}-exclude`,children:s("exclude.label")}),(0,o.jsx)("span",{className:"glassui-row__hint",children:s("exclude.hint")}),(0,o.jsx)(jt,{id:`${r}-exclude`,value:p.exclude,placeholder:s("exclude.placeholder"),invalid:m.invalidExclude,message:s("exclude.invalid"),onCommit:h=>x("exclude",h)})]}),(0,o.jsxs)("div",{className:"glassui-stack",children:[(0,o.jsx)("span",{className:"glassui-row__label",children:s("diag.title")}),(0,o.jsx)(Ui,{state:e,t:s,version:i.version})]})]})]})]}),(0,o.jsx)(zi,{controller:i.updates,t:s}),(0,o.jsx)("footer",{className:"glassui-footer",children:e.save==="saving"?s("save.saving"):s("footer",{version:i.version})})]});return(0,o.jsx)("div",{className:"glassui-mount",ref:l,children:(0,o.jsx)("div",{className:d?"glassui-narrow":void 0,children:(0,o.jsxs)("div",{ref:c,className:d?"glassui-narrow__dialog":void 0,role:d?"dialog":void 0,"aria-modal":d?!0:void 0,"aria-label":d?s("title"):void 0,onKeyDown:h=>{if(!d||(h.key==="Escape"&&(h.stopPropagation(),g()),h.key!=="Tab"))return;let y=[...h.currentTarget.querySelectorAll("button:not(:disabled),input:not(:disabled),a[href],textarea:not(:disabled)")].filter(lt=>lt.tabIndex>=0&&lt.getClientRects().length>0),H=y[0],me=y.at(-1);h.shiftKey&&document.activeElement===H?(h.preventDefault(),me?.focus()):!h.shiftKey&&document.activeElement===me&&(h.preventDefault(),H?.focus())},children:[d?(0,o.jsxs)("div",{className:"glassui-narrow__header",children:[(0,o.jsx)("strong",{children:s("title")}),(0,o.jsx)("button",{type:"button",className:"glassui-button",onClick:g,children:s("settings.close")})]}):null,B]})})})}var Xt=`/* Settings page of dsh-glassui. Every color comes from DSH's theme tokens, so the
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

.glassui-mount {
  min-width: 0;
}

.glassui-slider-preview {
  margin-top: 12px;
  padding: 8px;
  border-radius: 10px;
  background-size: cover;
  contain: layout paint;
}
.glassui-slider-preview__pane {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(12px);
  background-color: rgb(255 255 255 / max(var(--glassui-floor, 0), calc(0.16 + var(--glassui-preview-opacity) * 0.62)));
}
.glassui-slider-preview[data-scheme='dark'] .glassui-slider-preview__pane {
  background-color: rgb(40 40 44 / max(var(--glassui-floor, 0), calc(0.16 + var(--glassui-preview-opacity) * 0.62)));
}
.glassui-slider-preview[data-kind='inlineCodeOpacity'] .glassui-slider-preview__pane {
  background: transparent;
  backdrop-filter: none;
}
.glassui-slider-preview code {
  padding: 3px 6px;
  border-radius: 4px;
  background-color: rgb(245 246 248 / max(var(--glassui-preview-opacity), var(--glassui-floor, 0)));
}
.glassui-slider-preview[data-scheme='dark'] code {
  background-color: rgb(48 48 54 / max(var(--glassui-preview-opacity), var(--glassui-floor, 0)));
}
.glassui-narrow {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--dsw-alias-bg-layer-1);
  border-radius: inherit;
  overflow: auto;
  overscroll-behavior: contain;
}
.glassui-narrow__dialog {
  padding: 16px;
  min-width: 0;
}
.glassui-narrow__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
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
`;var Jt=require("react/jsx-runtime"),Bi=Ke,Hi=[],Oe="__DSH_GLASSUI_DEBUG__",Wi=880;function Vi(){let i=globalThis[ct];return typeof i=="object"&&i!==null&&"settings"in i?Y(i.settings):{...oe}}function ji(){let i=document.createElement("style");return i.setAttribute("data-glassui-settings-style",""),i.textContent=Xt,document.head.append(i),()=>i.remove()}function qi(i){if(typeof document>"u")return;let e=Gt(window),t="0.2.6",s={},a=new De(window,e,()=>s.controller?.refreshDiagnostics()),n=new xe(a,Vi());s.controller=n;let r=new we(void 0,()=>n.settleForUpdate(),()=>n.getSnapshot().settings);i.effect(()=>()=>r.dispose(),"dsh-glassui: update state"),i.inject(["connection"],l=>{l.effect(()=>r.attach(l.connection),"dsh-glassui: update connection"),l.on?.("connection/reset",()=>{r.load()})}),i.effect(()=>{let l={version:t,settings:()=>n.getSnapshot().settings,diagnostics:()=>a.diagnostics()};return globalThis[Oe]=l,()=>{n.dispose(),a.dispose(),globalThis[Oe]===l&&Reflect.deleteProperty(globalThis,Oe)}},"dsh-glassui: engine"),i.inject(["configForms"],l=>{l.effect(()=>n.attach(l.configForms.get(Ke)),"dsh-glassui: settings sync")}),i.inject(["slots","locale"],l=>{l.effect(()=>l.locale.register(nt,{en:Me,ja:Bt,zh:Ht}),"dsh-glassui: copy"),l.effect(ji,"dsh-glassui: settings styles");let c=l.locale.bind(nt),d=(g,p)=>c(g,p),u={subscribe:g=>l.locale.subscribe(g),revision:()=>l.locale.getSnapshot().revision,translate:d};l.slots.inject("settings.section",()=>l.slots.register({name:"settings.section",id:"glassui",order:Wi,label:()=>d("title")},g=>(0,Jt.jsx)(Yt,{controller:n,updates:r,locale:u,version:t,refractionSupported:e.refraction,close:typeof g.close=="function"?g.close:void 0})))})}

return module.exports;}});
