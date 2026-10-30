import {spawn,type ChildProcess} from 'node:child_process';

export type TunnelStatus={enabled:true;mode:'cloudflare';status:'starting'|'checking'|'online'|'offline'|'error';url:string|null;lastUrl:string|null;checkedAt:string|null;error:string|null};
export function cloudflareUrl(value:string){return /^https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(value)&&!['https://api.trycloudflare.com','https://www.trycloudflare.com'].includes(value)?value:null;}
export async function probeUrl(url:string,instanceId:string,timeoutMs=5000):Promise<boolean>{
 try{
  const response=await fetch(url+'/api/health',{redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{'Cache-Control':'no-cache'}});
  if(!response.ok){await response.body?.cancel();return false;}
  const reader=response.body?.getReader();if(!reader)return false;
  const decoder=new TextDecoder();let bytes=0,body='';
  for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>4096){await reader.cancel();return false;}body+=decoder.decode(chunk.value,{stream:true});}
  body+=decoder.decode();const health=JSON.parse(body);
  return health.status==='ok'&&health.instanceId===instanceId;
 }catch{return false;}
}
type Options={origin:string;instanceId:string;binary?:string;intervalMs?:number;launch?:()=>ChildProcess;probe?:(url:string,instanceId:string)=>Promise<boolean>};
export class TunnelManager{
 readonly instanceId:string;
 private options:Options;
 private state:TunnelStatus={enabled:true,mode:'cloudflare',status:'starting',url:null,lastUrl:null,checkedAt:null,error:null};
 private child:ChildProcess|null=null;
 private epoch=0;
 private timer?:ReturnType<typeof setInterval>;
 private startupTimer?:ReturnType<typeof setTimeout>;
 private pending:Promise<void>|null=null;
 private checking:{epoch:number;promise:Promise<TunnelStatus>}|null=null;
 private requests=new Set<string>();
 private listeners=new Set<()=>void>();
 private closed=false;
 constructor(options:Options){this.options=options;this.instanceId=options.instanceId;}
 snapshot():TunnelStatus{return {...this.state};}
 restorePrevious(url?:string){this.state.lastUrl=url?cloudflareUrl(url):null;}
 subscribe(fn:()=>void){this.listeners.add(fn);return ()=>{this.listeners.delete(fn);};}
 private update(patch:Partial<TunnelStatus>){Object.assign(this.state,patch);for(const fn of this.listeners)fn();}
 publicUrl(){return this.state.status==='online'?this.state.url:null;}
 async start(){
  if(!this.timer){this.timer=setInterval(()=>void this.check(),this.options.intervalMs??15000);this.timer.unref();}
  return this.generate('initial-startup');
 }
 async generate(requestId:string):Promise<TunnelStatus>{
  if(this.closed)throw Error('El supervisor de conexión está cerrado.');
  if(this.requests.has(requestId))return this.snapshot();
  this.requests.add(requestId);if(this.requests.size>100)this.requests.delete(this.requests.values().next().value!);
  if(this.pending){await this.pending;return this.snapshot();}
  const epoch=++this.epoch;this.checking=null;clearTimeout(this.startupTimer);
  this.update({status:'starting',url:null,checkedAt:null,error:null});
  const previous=this.child;this.child=null;
  this.pending=(async()=>{
   await this.stopChild(previous);
   if(this.closed||epoch!==this.epoch)return;
   let child:ChildProcess;
   try{child=this.options.launch?.()??spawn(this.options.binary||'cloudflared',['tunnel','--no-autoupdate','--protocol','http2','--url',this.options.origin],{stdio:['ignore','pipe','pipe'],shell:false});}
   catch{this.update({status:'error',error:'No se pudo iniciar Cloudflare. Comprueba la instalación.'});return;}
   this.child=child;let buffer='';
   const output=(data:Buffer)=>{
    if(epoch!==this.epoch||this.closed||this.state.url)return;
    buffer=(buffer+data.toString()).slice(-4096);
    const found=[...buffer.matchAll(/https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com\b/g)].map(match=>cloudflareUrl(match[0])).find(Boolean);
    if(found){clearTimeout(this.startupTimer);this.update({url:found,status:'checking',error:null});void this.check();}
   };
   child.stdout?.on('data',output);child.stderr?.on('data',output);
   child.once('error',()=>{if(epoch===this.epoch&&!this.closed)this.update({status:'error',error:'No se pudo ejecutar Cloudflare. Comprueba que el binario esté instalado.'});});
   child.once('exit',()=>{if(epoch===this.epoch&&!this.closed){this.child=null;clearTimeout(this.startupTimer);this.update({status:'offline',error:'El enlace de Cloudflare se detuvo. Puedes generar uno nuevo.'});}});
   this.startupTimer=setTimeout(()=>{if(epoch===this.epoch&&!this.state.url)this.update({status:'error',error:'Cloudflare no devolvió una dirección. Comprueba Internet y genera otro enlace.'});},90000);this.startupTimer.unref();
  })();
  try{await this.pending;}finally{this.pending=null;}
  return this.snapshot();
 }
 async check():Promise<TunnelStatus>{
  const epoch=this.epoch,url=this.state.url;
  if(!url||!this.child||this.closed)return this.snapshot();
  if(this.checking?.epoch===epoch)return this.checking.promise;
  const promise=(async()=>{
   const ok=await (this.options.probe??probeUrl)(url,this.instanceId).catch(()=>false);
   if(epoch!==this.epoch||url!==this.state.url||!this.child||this.closed)return this.snapshot();
   const checkedAt=new Date().toISOString();
   if(ok)this.update({status:'online',checkedAt,lastUrl:url,error:null});
   else this.update({status:this.state.lastUrl===url?'offline':'checking',checkedAt,error:'El enlace aún no responde desde esta instalación. Se volverá a comprobar; también puedes generar otro.'});
   return this.snapshot();
  })();
  this.checking={epoch,promise};
  try{return await promise;}finally{if(this.checking?.promise===promise)this.checking=null;}
 }
 private async stopChild(child:ChildProcess|null){
  if(!child||child.exitCode!==null||child.signalCode!==null)return;
  await new Promise<void>(resolve=>{
   let done=false;const finish=()=>{if(!done){done=true;clearTimeout(timer);resolve();}};
   const timer=setTimeout(()=>{child.kill('SIGKILL');finish();},2000);
   child.once('exit',finish);child.once('error',finish);child.kill('SIGTERM');
  });
 }
 async close(){this.closed=true;++this.epoch;clearInterval(this.timer);clearTimeout(this.startupTimer);await this.pending;const child=this.child;this.child=null;await this.stopChild(child);this.state.status='offline';}
}
