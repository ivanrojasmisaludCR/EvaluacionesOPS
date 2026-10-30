import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,type ChildProcess} from 'node:child_process';
import {TunnelManager,probeUrl} from '../server/tunnel.ts';

async function until(check:()=>boolean){const end=Date.now()+3000;while(!check()){if(Date.now()>end)throw Error('Estado no alcanzado');await new Promise(r=>setTimeout(r,10));}}
async function fixture(t:any){
 let response:any={status:'ok',instanceId:'current-instance'},status=200,hang=false;
 const server=createServer((_req,res)=>{if(!hang){res.writeHead(status,{'Content-Type':'application/json'});res.end(typeof response==='string'?response:JSON.stringify(response));}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${(server.address() as any).port}`;
 t.after(()=>new Promise<void>(r=>{server.close(()=>r());server.closeAllConnections();}));
 return {origin,set:(data:any,code=200,wait=false)=>{response=data;status=code;hang=wait;}};
}
test('dirección de la API en un error de Cloudflare no se confunde con un túnel',async t=>{
 let probes=0;const tunnel=new TunnelManager({origin:'http://127.0.0.1:3000',instanceId:'test',launch:()=>spawn(process.execPath,[new URL('./helpers/tunnel-child.mjs',import.meta.url).pathname,'api-error']),probe:async()=>{probes++;return false;}});
 t.after(()=>tunnel.close());await tunnel.start();await until(()=>tunnel.snapshot().status==='offline');assert.equal(tunnel.snapshot().url,null);assert.equal(probes,0);
});
test('sonda HTTP real verifica instancia, rechaza errores, redirecciones, HTML y timeout',async t=>{
 const f=await fixture(t);assert.equal(await probeUrl(f.origin,'current-instance',100),true);
 for(const [body,status]of [[{status:'ok',instanceId:'other'},200],[{status:'ok',instanceId:'current-instance'},502],['<html>fallo</html>',200],['redirect',302]]as const){f.set(body,status);assert.equal(await probeUrl(f.origin,'current-instance',100),false);}
 f.set({},200,true);assert.equal(await probeUrl(f.origin,'current-instance',40),false);
});
test('enlace no comprobado nunca es público; recupera misma URL y regeneración idempotente',async t=>{
 const f=await fixture(t);f.set({status:'ok',instanceId:'wrong'});let launches=0;let child:ChildProcess;
 const tunnel=new TunnelManager({origin:f.origin,instanceId:'current-instance',intervalMs:100000,launch:()=>{launches++;child=spawn(process.execPath,[new URL('./helpers/tunnel-child.mjs',import.meta.url).pathname,`test-${launches}.trycloudflare.com`]);return child;},probe:()=>probeUrl(f.origin,'current-instance',100)});
 t.after(()=>tunnel.close());tunnel.restorePrevious('https://old.trycloudflare.com');
 await tunnel.start();await until(()=>tunnel.snapshot().url!==null);await tunnel.check();
 assert.equal(tunnel.publicUrl(),null);assert.equal(tunnel.snapshot().lastUrl,'https://old.trycloudflare.com');
 f.set({status:'ok',instanceId:'current-instance'});await tunnel.check();
 assert.equal(tunnel.publicUrl(),'https://test-1.trycloudflare.com');
 f.set('Cloudflare unavailable',502);await tunnel.check();assert.equal(tunnel.publicUrl(),null);assert.equal(tunnel.snapshot().status,'offline');
 f.set({status:'ok',instanceId:'current-instance'});await tunnel.check();assert.equal(tunnel.publicUrl(),'https://test-1.trycloudflare.com');assert.equal(launches,1);
 await tunnel.generate('same-request-123');await tunnel.generate('same-request-123');await until(()=>tunnel.snapshot().url==='https://test-2.trycloudflare.com');await tunnel.check();assert.equal(launches,2);
 child!.kill('SIGTERM');await until(()=>tunnel.snapshot().status==='offline');assert.equal(tunnel.publicUrl(),null);
});
test('resultado tardío del enlace anterior no habilita QR tras regenerar',async t=>{
 let release:()=>void=()=>{};let delayed=false,launches=0;
 const tunnel=new TunnelManager({origin:'http://127.0.0.1:3000',instanceId:'one',intervalMs:100000,launch:()=>spawn(process.execPath,[new URL('./helpers/tunnel-child.mjs',import.meta.url).pathname,`generation-${++launches}.trycloudflare.com`]),probe:async()=>{if(!delayed){delayed=true;return new Promise<boolean>(r=>{release=()=>r(true);});}return false;}});
 t.after(()=>tunnel.close());await tunnel.start();await until(()=>delayed);
 await tunnel.generate('new-generation-1');await until(()=>tunnel.snapshot().url==='https://generation-2.trycloudflare.com');await tunnel.check();release();await new Promise(r=>setTimeout(r,20));
 assert.equal(tunnel.publicUrl(),null);assert.notEqual(tunnel.snapshot().status,'online');
});
