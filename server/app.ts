import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer, type IncomingMessage } from 'node:http';
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import { registerInstrumentImports } from './import-routes.ts';
import { Store, Problem, fail, type Identity } from './store.ts';
import type { TunnelManager } from './tunnel.ts';
import { exportReport } from './report-files.ts';

function cookies(req:IncomingMessage):Record<string,string> {
 return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')).filter(v=>v.length===2));
}
function validateUrl(value:unknown):string {
 if(typeof value!=='string'||value.length>250)fail(400,'URL_INVALIDA','Indique una dirección LAN completa.');
 let u:URL;try {u=new URL(value as string);}catch{return fail(400,'URL_INVALIDA','La dirección debe comenzar por http:// o https://.');}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(u.hostname))fail(400,'URL_INVALIDA','Use la dirección de la computadora accesible desde el teléfono, sin rutas ni localhost.');
 return u.origin;
}
export function lanAddresses(port:number){return Object.values(networkInterfaces()).flatMap(v=>v||[]).filter(a=>a.family==='IPv4'&&!a.internal).map(a=>`http://${a.address}:${port}`);}
const loopback=(ip:string)=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip);
export function createApp(options:{dbPath:string;password:string;publicUrl?:string;port?:number;connection?:TunnelManager;container?:boolean}) {
 if(options.password.length<12)throw new Error('AGORA_ADMIN_PASSWORD debe tener al menos 12 caracteres.');
 const store=new Store(options.dbPath);const app=express();const server=createServer(app);
 const wss=new WebSocketServer({noServer:true,maxPayload:2048});
 const clients=new Map<WebSocket,{code:string;who:Identity;adminToken?:string}>();
 const passwordHash=createHash('sha256').update(options.password).digest();
 const attempts=new Map<string,{count:number;until:number}>();
 app.disable('x-powered-by');
 // cloudflared runs in this container and connects through loopback only.
 app.set('trust proxy',loopback);
 app.use((req,res,next)=>{
  res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"});
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`)return next(new Problem(403,'ORIGEN_INVALIDO','Origen de la solicitud no permitido.'));
  next();
 });
 const admin=(req:Request,res:Response,next:NextFunction)=>{if(!store.adminValid(cookies(req).agora_admin))return next(new Problem(401,'ACCESO_REQUERIDO','Ingrese como facilitador para continuar.'));next();};
 registerInstrumentImports(app,store.catalog,admin);
 app.use('/api/instrumentos',express.json({limit:'4mb'}));
 app.use(express.json({limit:'24kb'}));
 app.use('/api',(req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)&&(req.body===null||Array.isArray(req.body)||typeof req.body!=='object'))return next(new Problem(400,'CUERPO_INVALIDO','Se requiere un objeto JSON.'));
  next();
 });
 const roomCode=(req:Request)=>String(req.params.code).toUpperCase();
 let exporting=false;
 app.get('/api/salas/:code/exportar/:format',admin,async(req,res)=>{
  const format=String(req.params.format);
  if(format!=='xlsx'&&format!=='pdf')return fail(400,'FORMATO_INVALIDO','Elige Excel o PDF para exportar los resultados.');
  if(exporting){res.set('Retry-After','3');fail(503,'EXPORTACION_OCUPADA','Se está preparando otro informe. Vuelve a intentarlo en unos segundos.');}
  exporting=true;
  try{
   const report=store.report(roomCode(req));
   const buffer=await exportReport(report,format);
   const filename=`agora-${report.code}-${report.generatedAt.replace(/[:.]/g,'-')}.${format}`;
   res.type(format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf').set('Content-Disposition',`attachment; filename="${filename}"`).send(buffer);
  }finally{exporting=false;}
 });
 const identity=(req:IncomingMessage,code:string,projectionToken?:string,participantView=false):Identity=>{
  const c=cookies(req);
  if(projectionToken)return {role:'projector',token:projectionToken};
  if(!participantView&&store.adminValid(c.agora_admin))return {role:'admin'};
  return {role:'participant',token:c[`agora_p_${code}`]};
 };
 function notify(code:string){for(const [ws,c] of clients){if(c.code!==code)continue;try{if(c.who.role==='admin'&&!store.adminValid(c.adminToken))throw Error('expired');store.authorize(code,c.who);if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'actualizar'}));}catch{ws.close(1008,'Acceso vencido');}}}
 const cookieOptions=(req:Request)=>({httpOnly:true,sameSite:'strict' as const,secure:req.secure,path:'/'});
 const instanceId=options.connection?.instanceId||randomUUID();
 function configuration(){
  const suggestions=options.container?[]:lanAddresses(options.port||3000);
  const manualUrl=options.publicUrl?validateUrl(options.publicUrl):(store.setting('publicUrl')||'');
  let stale=false;
  if(manualUrl&&!options.publicUrl&&!options.container){try{const host=new URL(manualUrl).hostname;stale=isIP(host)===4&&!suggestions.some(url=>new URL(url).hostname===host);}catch{stale=true;}}
  const manualConnection={enabled:false,mode:'manual',status:stale?'stale':manualUrl?'configured':'disabled',url:stale?null:manualUrl||null,lastUrl:manualUrl||null,checkedAt:null,error:stale?'La dirección guardada pertenece a otra red. Actualízala antes de compartir el QR.':null};
  return {publicUrl:options.connection?(options.connection.publicUrl()||''):(stale?'':manualUrl),manualUrl,suggestions,urlLocked:!!options.publicUrl||!!options.connection,connection:{...(options.connection?.snapshot()||manualConnection),application:'online',runtime:options.container?'docker':'local'}};
 }
 options.connection?.restorePrevious(store.setting('cloudflareLastUrl'));
 const unsubscribe=options.connection?.subscribe(()=>{const url=options.connection!.publicUrl();if(url&&store.setting('cloudflareLastUrl')!==url)store.setSetting('cloudflareLastUrl',url);for(const w of store.list() as any[])notify(w.code);});
 app.get('/api/health',(_req,res)=>res.json({status:'ok',delivery:'E1',instanceId}));
 app.post('/api/admin/login',(req,res)=>{
  const ip=req.ip||req.socket.remoteAddress||'local';const now=Date.now();
  for(const [key,a]of attempts)if(a.until<now)attempts.delete(key);
  const attempt=attempts.get(ip)||{count:0,until:now+15*60*1000};
  if(attempt.count>=10)return fail(429,'DEMASIADOS_INTENTOS','Demasiados intentos. Espere 15 minutos.');
  attempt.count++;attempts.set(ip,attempt);
  const candidate=typeof req.body.password==='string'?req.body.password:'';
  if(!timingSafeEqual(passwordHash,createHash('sha256').update(candidate).digest()))return fail(401,'CLAVE_INVALIDA','La contraseña no es correcta.');
  attempts.delete(ip);
  res.cookie('agora_admin',store.issueAdmin(),{...cookieOptions(req),maxAge:12*60*60*1000});res.json({authenticated:true});
 });
 app.get('/api/admin/session',(req,res)=>res.json({authenticated:store.adminValid(cookies(req).agora_admin)}));
 app.post('/api/admin/logout',admin,(req,res)=>{store.logout(cookies(req).agora_admin);res.clearCookie('agora_admin',cookieOptions(req));res.json({ok:true});});
 app.get('/api/config',admin,(_req,res)=>res.json(configuration()));
 app.post('/api/conexion/comprobar',admin,async(_req,res)=>{await options.connection?.check();res.json(configuration());});
 app.post('/api/conexion/generar',admin,async(req,res)=>{
  if(!options.connection)fail(409,'TUNEL_NO_HABILITADO','El enlace automático está disponible en la instalación Docker con Cloudflare habilitado.');
  if(req.hostname.endsWith('.trycloudflare.com'))fail(409,'REGENERACION_LOCAL','Genera otro enlace desde la dirección local de esta instalación para poder ver la nueva URL al cerrarse la anterior.');
  const id=req.body.requestId;if(typeof id!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(id))fail(400,'ENVIO_INVALIDO','Identificador de solicitud no válido.');
  await options.connection!.generate(id);res.status(202).json(configuration());
 });
 app.patch('/api/config',admin,(req,res)=>{const url=validateUrl(req.body.publicUrl);if(options.connection)fail(409,'URL_AUTOMATICA','Cloudflare administra la dirección del QR. Usa Comprobar conexión o Generar nuevo enlace.');if(options.publicUrl)fail(409,'URL_FIJADA','La dirección está fijada en AGORA_PUBLIC_URL. Cámbiela en la configuración de arranque.');store.setSetting('publicUrl',url);res.json(configuration());for(const w of store.list() as any[])notify(w.code);});
 app.get('/api/instrumentos',admin,(_req,res)=>res.json(store.catalog.list()));
 app.post('/api/instrumentos',admin,(req,res)=>res.status(201).json(store.catalog.create(req.body.name)));
 app.get('/api/instrumentos/:id',admin,(req,res)=>res.json(store.catalog.get(String(req.params.id))));
 app.put('/api/instrumentos/:id',admin,(req,res)=>res.json(store.catalog.save(String(req.params.id),req.body)));
 app.post('/api/instrumentos/:id/publicar',admin,(req,res)=>res.json(store.catalog.publish(String(req.params.id),req.body.editRevision)));
 app.post('/api/instrumentos/:id/borrador',admin,(req,res)=>res.status(201).json(store.catalog.draft(String(req.params.id))));
 app.get('/api/talleres',admin,(_req,res)=>res.json(store.list()));
 app.post('/api/talleres',admin,(req,res)=>{const room=store.createWorkshop(req.body);res.status(201).json(room);});
 app.post('/api/salas/:code/ingreso',(req,res)=>{
  const code=roomCode(req);const c=cookies(req),name=`agora_p_${code}`;
  const joined=store.join(code,c[name]);res.cookie(name,joined.token,{...cookieOptions(req),maxAge:30*24*60*60*1000});res.json({joined:true});notify(code);
 });
 app.get('/api/salas/:code/estado',async(req,res)=>{
  const code=roomCode(req);const bearer=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):undefined;
  const who=identity(req,code,bearer,req.query.view==='participant');const state=store.state(code,who);
  if(who.role==='admin'||who.role==='projector'){
   const config=configuration();if(who.role==='admin')state.connection=config.connection;
   state.joinUrl=config.publicUrl?`${config.publicUrl}/participar/${code}`:null;
   state.qr=state.joinUrl?await QRCode.toDataURL(state.joinUrl,{width:240,margin:2,errorCorrectionLevel:'M'}):null;
  }
  res.json(state);
 });
 app.post('/api/salas/:code/accion',admin,(req,res)=>{const code=roomCode(req);store.transition(code,req.body.action,req.body.questionId);notify(code);res.json({ok:true});});
 app.post('/api/salas/:code/votos',(req,res)=>{
  const code=roomCode(req);const token=cookies(req)[`agora_p_${code}`];
  const result=store.vote(code,token,req.body);notify(code);res.status(201).json(result);
 });
 app.post('/api/salas/:code/consenso',admin,(req,res)=>{
  const code=roomCode(req);const w=store.workshop(code);store.consensus(code,req.body,w.facilitador);notify(code);res.status(201).json({ok:true});
 });
 app.use('/api',(_req,res)=>res.status(404).json({error:{code:'RUTA_NO_EXISTE',message:'Ruta no encontrada.'}}));
 const dist=resolve('dist');
 if(existsSync(dist)) {app.use(express.static(dist,{index:false}));app.get(['/', '/facilitador','/resultados','/resultados/:code','/conexion','/instrumentos','/instrumentos/:id','/sala/:code','/participar','/participar/:code','/proyectar/:code'],(_req,res)=>res.sendFile(resolve(dist,'index.html')));}
 app.use((err:any,_req:Request,res:Response,_next:NextFunction)=>{
  const known=err instanceof Problem;const badJson=err.type==='entity.parse.failed';const tooLarge=err.type==='entity.too.large';
  if(!known&&!badJson&&!tooLarge)console.error('Error de aplicación:',err.message);
  res.status(known?err.status:badJson?400:tooLarge?413:500).json({error:{code:known?err.code:badJson?'JSON_INVALIDO':tooLarge?'CUERPO_GRANDE':'ERROR_INTERNO',message:known?err.message:badJson?'JSON no válido.':tooLarge?'La solicitud es demasiado grande.':'No se pudo guardar el cambio. Reintente.'}});
 });
 server.on('upgrade',(req,socket,head)=>{
  const path=new URL(req.url||'/', 'http://local').pathname;const match=path.match(/^\/api\/salas\/([A-F0-9]{6})\/ws$/);
  const scheme=loopback(req.socket.remoteAddress||'')&&req.headers['x-forwarded-proto']==='https'?'https':'http';
  if(!match||!req.headers.origin||req.headers.origin!==`${scheme}://${req.headers.host}`){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{
   const code=match[1];const timer=setTimeout(()=>ws.close(1008,'Autenticación requerida'),5000);
   ws.once('message',data=>{
    clearTimeout(timer);
    try {const message=JSON.parse(data.toString());const who=identity(req,code,message.token,message.view==='participant');store.authorize(code,who);clients.set(ws,{code,who,adminToken:cookies(req).agora_admin});ws.send(JSON.stringify({type:'actualizar'}));}
    catch{ws.close(1008,'Acceso denegado');}
   });
   ws.on('close',()=>{clearTimeout(timer);clients.delete(ws);});ws.on('error',()=>clients.delete(ws));
  });
 });
 return {app,store,server,
  start:(port=options.port||3000,host='0.0.0.0')=>new Promise<{port:number}>((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{void options.connection?.start();resolve(server.address() as any);});}),
  close:async()=>{await options.connection?.close();unsubscribe?.();for(const ws of wss.clients)ws.terminate();await new Promise<void>(resolve=>wss.close(()=>resolve()));await new Promise<void>(resolve=>{server.close(()=>resolve());server.closeAllConnections();});store.close();}
 };
}
