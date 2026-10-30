import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { createApp } from '../server/app.ts';
import { sampleBytes,sampleWorkbook,xlsxBytes } from './helpers/excel.ts';
import {spawn} from 'node:child_process';
import {request as httpRequest} from 'node:http';
import {TunnelManager,probeUrl} from '../server/tunnel.ts';
const ficha={pais:'Costa Rica',institucion:'Prueba HTTP',fecha:'2026-10-26',alcance:'Piloto',facilitador:'Facilitadora'};
test('Cloudflare: QR solo comprobado, no IP Docker anterior, permisos y HTTPS/WS válidos',async t=>{
 let base='',good=false,launches=0;
 const tunnel=new TunnelManager({origin:'http://127.0.0.1:3000',instanceId:'integration-one',intervalMs:100000,launch:()=>spawn(process.execPath,[new URL('./helpers/tunnel-child.mjs',import.meta.url).pathname,`integration-${++launches}.trycloudflare.com`]),probe:()=>good?probeUrl(base,'integration-one'):Promise.resolve(false)});
 const app=createApp({dbPath:':memory:',password:'solo-pruebas-seguras',connection:tunnel,container:true});const address=await app.start(0,'127.0.0.1');base=`http://127.0.0.1:${address.port}`;t.after(()=>app.close());
 app.store.setSetting('publicUrl','http://172.21.0.2:3000');const room=app.store.createWorkshop(ficha);
 const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'solo-pruebas-seguras'})});const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 const read=async(path:string)=>await(await fetch(base+path,{headers:{cookie}})).json();
 const config=await read('/api/config');assert.equal(config.connection?.mode,'cloudflare');assert.deepEqual(config.suggestions,[]);
 let state=await read(`/api/salas/${room.code}/estado`);assert.equal(state.joinUrl,null);assert.equal(state.qr,null);
 assert.equal((await fetch(base+'/api/conexion/generar',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"requestId":"not-admin-123"}'})).status,401);
 const deadline=Date.now()+3000;while(!tunnel.snapshot().url){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,10));}
 good=true;await tunnel.check();state=await read(`/api/salas/${room.code}/estado`);assert.match(state.joinUrl,/^https:\/\/integration-1.trycloudflare.com\/participar\//);assert.match(state.qr,/^data:image\/png/);
 const projectionToken=state.projectionToken;
 const projection=async()=>await(await fetch(base+`/api/salas/${room.code}/estado`,{headers:{Authorization:`Bearer ${projectionToken}`}})).json();
 const visible=await projection();assert.equal(visible.joinUrl,state.joinUrl);assert.equal(visible.qr,state.qr);assert.equal('connection' in visible,false);
 const publicHost='integration-1.trycloudflare.com';const headers={'Content-Type':'application/json',Host:publicHost,'X-Forwarded-Proto':'https',Origin:`https://${publicHost}`};
 // Node fetch does not forward an overridden Host header. Use HTTP as the proxy does.
 const forwarded=(path:string,extra:Record<string,string>={})=>new Promise<{status:number;cookie:string[]}>((resolve,reject)=>{const req=httpRequest(base+path,{method:'POST',headers:{...headers,...extra}},res=>{res.resume();res.once('end',()=>resolve({status:res.statusCode!,cookie:res.headers['set-cookie']||[]}));});req.on('error',reject);req.end(JSON.stringify({password:'solo-pruebas-seguras',requestId:'public-renew-123'}));});
 const secure=await forwarded('/api/admin/login');assert.equal(secure.status,200);assert.match(secure.cookie[0],/; Secure/);
 assert.equal((await forwarded('/api/admin/login',{Origin:'https://other.example'})).status,403);
 assert.equal((await forwarded('/api/conexion/generar',{Cookie:cookie})).status,409);
 const ws=new WebSocket(base.replace('http','ws')+`/api/salas/${room.code}/ws`,{origin:`https://${publicHost}`,headers:{Host:publicHost,'X-Forwarded-Proto':'https',Cookie:cookie}});t.after(()=>ws.terminate());
 const notification=await new Promise<string>((resolve,reject)=>{ws.on('error',reject);ws.on('open',()=>ws.send('{}'));ws.once('message',v=>resolve(v.toString()));});assert.deepEqual(JSON.parse(notification),{type:'actualizar'});
 good=false;await tunnel.check();state=await read(`/api/salas/${room.code}/estado`);assert.equal(state.joinUrl,null);assert.equal(state.qr,null);
 const unavailable=await projection();assert.equal(unavailable.joinUrl,null);assert.equal(unavailable.qr,null);
 const regenerate=()=>fetch(base+'/api/conexion/generar',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:'{"requestId":"same-id-12345"}'});
 assert.equal((await regenerate()).status,202);assert.equal((await regenerate()).status,202);assert.equal(launches,2);
 assert.equal((await fetch(base+'/api/config',{method:'PATCH',headers:{cookie,'Content-Type':'application/json'},body:'{"publicUrl":"http://192.168.1.2:3000"}'})).status,409);
});
test('LAN: dirección guardada de otra red no genera un QR obsoleto',async t=>{
 const app=createApp({dbPath:':memory:',password:'solo-pruebas-seguras'});const address=await app.start(0,'127.0.0.1');t.after(()=>app.close());
 app.store.setSetting('publicUrl','http://203.0.113.44:3000');const room=app.store.createWorkshop(ficha);
 const login=await fetch(`http://127.0.0.1:${address.port}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'solo-pruebas-seguras'})});const cookie=login.headers.getSetCookie()[0].split(';')[0];
 const state=await(await fetch(`http://127.0.0.1:${address.port}/api/salas/${room.code}/estado`,{headers:{cookie}})).json();assert.equal(state.qr,null);assert.equal(state.connection.status,'stale');
});
async function setup(t:any){
 const app=createApp({dbPath:':memory:',password:'solo-pruebas-seguras',publicUrl:'http://192.168.1.20:3000'});
 const address=await app.start(0,'127.0.0.1'); t.after(()=>app.close());
 const base=`http://127.0.0.1:${address.port}`;
 async function call(path:string,body?:any,cookie='',method?:string,extra:Record<string,string>={}) {
  const res=await fetch(base+path,{method:method||(body===undefined?'GET':'POST'),headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await res.json();return {status:res.status,data,cookie:res.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
 }
 const login=await call('/api/admin/login',{password:'solo-pruebas-seguras'});
 const admin=login.cookie;const created=await call('/api/talleres',ficha,admin);
 return {app,base,call,admin,code:created.data.code};
}
test('HTTP protege administración, limita contraseña y rechaza origen cruzado',async t=>{
 const {call,admin}=await setup(t);
 assert.equal((await call('/api/talleres')).status,401);
 assert.equal((await call('/api/admin/login',{password:'incorrecta'})).status,401);
 assert.equal((await call('/api/talleres',ficha,admin,undefined,{Origin:'http://otro.example'})).status,403);
 assert.equal((await call('/api/talleres',{...ficha,fecha:'ayer'},admin)).status,400);
 assert.equal((await call('/api/admin/session',undefined,admin)).data.authenticated,true);
 assert.equal((await call('/api/admin/logout',{},admin)).status,200);
 assert.equal((await call('/api/talleres',undefined,admin)).status,401);
});
test('exportaciones requieren facilitador, validan formato y descargan archivos sin modificar la sala',async t=>{
 const {base,call,admin,code}=await setup(t);
 const joined=await call(`/api/salas/${code}/ingreso`,{});
 const before=(await call(`/api/salas/${code}/estado`,undefined,admin)).data;
 for(const format of ['xlsx','pdf']){
  assert.equal((await call(`/api/salas/${code}/exportar/${format}`)).status,401);
  assert.equal((await call(`/api/salas/${code}/exportar/${format}`,undefined,joined.cookie)).status,401);
  assert.equal((await call(`/api/salas/${code}/exportar/${format}`,undefined,'',undefined,{Authorization:`Bearer ${before.projectionToken}`})).status,401);
  const result=await fetch(`${base}/api/salas/${code}/exportar/${format}`,{headers:{Cookie:admin}});
  assert.equal(result.status,200);assert.match(result.headers.get('content-disposition')!,new RegExp(`attachment; filename="agora-${code}-.*\\.${format}"`));
  assert.equal(result.headers.get('cache-control'),'no-store');const bytes=Buffer.from(await result.arrayBuffer());
  assert.equal(bytes.subarray(0,format==='pdf'?5:2).toString(),format==='pdf'?'%PDF-':'PK');
 }
 assert.equal((await call(`/api/salas/${code}/exportar/csv`,undefined,admin)).status,400);
 assert.equal((await call('/api/salas/AAAAAA/exportar/pdf',undefined,admin)).status,404);
 const after=(await call(`/api/salas/${code}/estado`,undefined,admin)).data;assert.deepEqual(after,before);
 const simultaneous=await Promise.all(['xlsx','xlsx'].map(async format=>{const response=await fetch(`${base}/api/salas/${code}/exportar/${format}`,{headers:{Cookie:admin}});await response.arrayBuffer();return response.status;}));
 assert.deepEqual(simultaneous.sort(),[200,503]);
 assert.equal((await fetch(`${base}/api/salas/${code}/exportar/pdf`,{headers:{Cookie:admin}})).status,200);
});
test('participante recupera identidad, solo recibe su estado y QR usa LAN',async t=>{
 const {call,admin,code}=await setup(t);
 const joined=await call(`/api/salas/${code}/ingreso`,{});assert.equal(joined.status,200);
 const cookie=joined.cookie;
 assert.equal((await call(`/api/salas/${code}/ingreso`,{},cookie)).status,200);
 const state=await call(`/api/salas/${code}/estado`,undefined,cookie);assert.equal(state.data.participantCount,1);assert.equal('projectionToken' in state.data,false);
 assert.equal((await call(`/api/salas/${code}/accion`,{action:'open'},cookie)).status,401);
 assert.equal((await call(`/api/salas/${code}/estado`)).status,403);
 const adminState=await call(`/api/salas/${code}/estado`,undefined,admin);
 assert.match(adminState.data.joinUrl,/^http:\/\/192\.168\.1\.20:3000\/participar\//);
 assert.match(adminState.data.qr,/^data:image\/png;base64,/);
 const other=await call('/api/talleres',ficha,admin);
 assert.equal((await call(`/api/salas/${other.data.code}/estado`,undefined,cookie)).status,403);
 assert.equal(state.data.results.completedQuestions,0);assert.ok(state.data.results.areas.every((a:any)=>a.currentScore===null));
 assert.equal((await call('/api/config',{publicUrl:'http://localhost:3000'},admin,'PATCH')).status,400);
});
test('voto/cierre por HTTP: ningún voto confirmado se pierde y reintento mantiene acuse',async t=>{
 const {call,admin,code}=await setup(t);const joined=await call(`/api/salas/${code}/ingreso`,{});const cookie=joined.cookie;
 const s=(await call(`/api/salas/${code}/estado`,undefined,cookie)).data;
 await call(`/api/salas/${code}/accion`,{action:'open'},admin);
 const input={questionId:s.question.id,round:1,value:4,requestId:randomUUID()};
 const [vote,closed]=await Promise.all([call(`/api/salas/${code}/votos`,input,cookie),call(`/api/salas/${code}/accion`,{action:'close'},admin)]);
 assert.equal(closed.status,200);assert.ok([201,409].includes(vote.status));
 const state=(await call(`/api/salas/${code}/estado`,undefined,cookie)).data;
 assert.equal(state.responseCount,vote.status===201?1:0);
 if(vote.status===201)assert.deepEqual((await call(`/api/salas/${code}/votos`,input,cookie)).data,vote.data);
 assert.equal((await call(`/api/salas/${code}/votos`,{...input,requestId:randomUUID()},cookie)).status,409);
});
test('proyector solo lectura, WebSocket autenticado avisa sin enviar distribución',async t=>{
 const {base,call,admin,code}=await setup(t);
 const state=(await call(`/api/salas/${code}/estado`,undefined,admin)).data;
 const token=state.projectionToken;
 const projector=await call(`/api/salas/${code}/estado`,undefined,'',undefined,{Authorization:`Bearer ${token}`});
 assert.equal(projector.status,200);assert.equal('projectionToken' in projector.data,false);
 assert.equal(projector.data.joinUrl,`http://192.168.1.20:3000/participar/${code}`);assert.match(projector.data.qr,/^data:image\/png;base64,/);
 assert.equal('connection' in projector.data,false);
 assert.equal((await call(`/api/salas/${code}/accion`,{action:'open'},'',undefined,{Authorization:`Bearer ${token}`})).status,401);
 const ws=new WebSocket(base.replace('http','ws')+`/api/salas/${code}/ws`,{origin:base});t.after(()=>ws.terminate());
 const initial=await new Promise<string>((resolve,reject)=>{ws.on('error',reject);ws.on('open',()=>ws.send(JSON.stringify({token})));ws.once('message',data=>resolve(data.toString()));});
 assert.deepEqual(JSON.parse(initial),{type:'actualizar'});
 const notification=new Promise<string>(resolve=>ws.once('message',d=>resolve(d.toString())));
 await call(`/api/salas/${code}/accion`,{action:'open'},admin);
 assert.deepEqual(JSON.parse(await notification),{type:'actualizar'});
});
test('cuerpos inválidos, códigos desconocidos y sesión expirada fallan sin filtrar datos',async t=>{
 const {call,admin,code,app}=await setup(t);
 assert.equal((await call('/api/talleres',null,admin)).status,400);
 assert.equal((await call('/api/salas/AAAAAA/ingreso',{})).status,404);
 const joined=await call(`/api/salas/${code}/ingreso`,{});
 assert.equal((await call(`/api/salas/${code}/votos`,{},joined.cookie)).status,400);
 app.store.db.exec('UPDATE admin_sessions SET expires=0');
 assert.equal((await call('/api/talleres',undefined,admin)).status,401);
});
test('facilitador puede entrar como participante en el mismo navegador con estado propio',async t=>{
 const {call,admin,code}=await setup(t);
 assert.equal((await call(`/api/salas/${code}/estado?view=participant`,undefined,admin)).status,403);
 const joined=await call(`/api/salas/${code}/ingreso`,{},admin);const both=admin+'; '+joined.cookie;
 const s=(await call(`/api/salas/${code}/estado?view=participant`,undefined,both)).data;
 assert.equal('projectionToken' in s,false);
 await call(`/api/salas/${code}/accion`,{action:'open'},admin);
 const vote=await call(`/api/salas/${code}/votos`,{questionId:s.question.id,round:1,value:2,requestId:randomUUID()},both);
 assert.equal(vote.status,201);
 const own=(await call(`/api/salas/${code}/estado?view=participant`,undefined,both)).data;
 assert.equal(own.ownVote.value,2);
});
test('editor HTTP protege catálogo y permite publicar y elegir instrumento de taller',async t=>{
 const {call,admin,code}=await setup(t);
 assert.equal((await call('/api/instrumentos')).status,401);
 const joined=await call(`/api/salas/${code}/ingreso`,{});
 assert.equal((await call('/api/instrumentos',{name:'No autorizado'},joined.cookie)).status,401);
 const created=await call('/api/instrumentos',{name:'Prueba de catálogo'},admin);assert.equal(created.status,201);
 const id=created.data.versionId;
 assert.equal((await call(`/api/instrumentos/${id}/publicar`,{editRevision:0},admin)).status,400);
 const q={id:'q_http',text:'Pregunta personalizada',area:'Área propia',domain:'Dominio propio',type:'madurez',number:1,source:null,levels:[1,2,3,4,5].map(value=>({value,text:`Nivel descrito ${value}`}))};
 const saved=await call(`/api/instrumentos/${id}`,{name:'Prueba de catálogo',questions:[q],editRevision:0},admin,'PUT');assert.equal(saved.status,200);
 assert.equal((await call(`/api/instrumentos/${id}`,{name:'Obsoleto',questions:[],editRevision:0},admin,'PUT')).status,409);
 const pub=await call(`/api/instrumentos/${id}/publicar`,{editRevision:1},admin);assert.equal(pub.status,200);
 const workshop=await call('/api/talleres',{...ficha,instrumentVersionId:id},admin);assert.equal(workshop.status,201);
 const state=(await call(`/api/salas/${workshop.data.code}/estado`,undefined,admin)).data;assert.equal(state.question.text,'Pregunta personalizada');assert.equal(state.questions.length,1);assert.equal(state.instrument.version,'1.0.0');
 const draft=await call(`/api/instrumentos/${id}/borrador`,{},admin);assert.equal(draft.status,201);assert.equal(draft.data.status,'draft');
 assert.equal((await call(`/api/instrumentos/${id}`,{name:'Inmutable',questions:[q],editRevision:1},admin,'PUT')).status,409);
 assert.equal((await call(`/api/instrumentos/${id}`,undefined,joined.cookie)).status,401);
 assert.equal((await call(`/api/instrumentos/no-existe`,undefined,admin)).status,404);
});

test('importación HTTP: descarga, permisos, vista previa sin escritura y confirmación idempotente',async t=>{
 const {base,call,admin,app}=await setup(t);const bytes=await sampleBytes();
 const upload=async(action:string,cookie=admin,headers:Record<string,string>={})=>{
  const r=await fetch(base+'/api/instrumentos/importacion/'+action,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','X-File-Name':'prueba.xlsx',...headers},body:new Uint8Array(bytes)});return {status:r.status,data:await r.json()};
 };
 assert.equal((await fetch(base+'/api/instrumentos/plantilla.xlsx')).status,401);
 const download=await fetch(base+'/api/instrumentos/plantilla.xlsx',{headers:{Cookie:admin}});assert.equal(download.status,200);assert.match(download.headers.get('content-type')||'',/spreadsheetml/);assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0,2).toString(),'PK');
 assert.equal((await upload('validar','')).status,401);const count=app.store.catalog.list().length;
 const preview=await upload('validar');assert.equal(preview.status,200);assert.equal(preview.data.canImport,true);assert.equal(preview.data.metadata.edition,'2027');assert.equal(app.store.catalog.list().length,count);
 const requestId=randomUUID();assert.equal((await upload('guardar',admin,{'X-Preview-Hash':'a'.repeat(64),'X-Import-Request-Id':requestId})).status,409);
 const headers={'X-Preview-Hash':preview.data.fileHash,'X-Import-Request-Id':requestId};const imported=await upload('guardar',admin,headers);assert.equal(imported.status,201);assert.equal(imported.data.status,'draft');
 assert.equal((await upload('guardar',admin,headers)).data.versionId,imported.data.versionId);assert.equal(app.store.catalog.list().length,count+1);
 const pub=await call(`/api/instrumentos/${imported.data.versionId}/publicar`,{editRevision:imported.data.editRevision},admin);assert.equal(pub.status,200);
 const next=await upload('validar',admin,{'X-Base-Version-Id':pub.data.versionId});assert.equal(next.data.changes.retained,2);
 const newer=await upload('guardar',admin,{'X-Base-Version-Id':pub.data.versionId,'X-Preview-Hash':preview.data.fileHash,'X-Import-Request-Id':randomUUID()});assert.equal(newer.status,201);assert.equal(newer.data.instrumentId,imported.data.instrumentId);
});
test('importación inválida no crea instrumentos y rechaza formatos y cuerpos ajenos',async t=>{
 const {base,admin,app}=await setup(t);const w=await sampleWorkbook();w.getWorksheet('Preguntas')!.getCell('E6').value=null;const bytes=await xlsxBytes(w);const count=app.store.catalog.list().length;
 const send=async(path:string,name='prueba.xlsx',body:Uint8Array=new Uint8Array(bytes))=>{const r=await fetch(base+'/api/instrumentos/importacion/'+path,{method:'POST',headers:{Cookie:admin,'Content-Type':'application/octet-stream','X-File-Name':name,'X-Import-Request-Id':randomUUID(),'X-Preview-Hash':'a'.repeat(64)},body:new Uint8Array(body)});return {status:r.status,data:await r.json()};};
 const p=await send('validar');assert.equal(p.data.canImport,false);assert.ok(p.data.errors.some((e:any)=>e.cell==='E6'));
 assert.equal((await send('guardar')).status,422);assert.equal((await send('validar','otra.xls')).status,415);assert.equal((await send('validar','a.xlsx',new Uint8Array([1,2,3]))).status,400);
 assert.equal(app.store.catalog.list().length,count);
});
