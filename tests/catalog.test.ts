import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../server/store.ts';
const ficha={pais:'Costa Rica',institucion:'Editor',fecha:'2026-10-26',alcance:'Prueba',facilitador:'Facilitadora'};
const question=(id='q_nueva')=>({id,number:1,text:'¿Cómo se gestionan los datos?',area:'Datos',domain:'Gobernanza',type:'madurez',levels:[1,2,3,4,5].map(value=>({value,text:`Descriptor ${value}`})),source:null});
function setup(t:any){const s=new Store(':memory:');t.after(()=>s.close());return s;}
test('catálogo permite guardar borrador incompleto pero exige cinco descriptores y contenido al publicar',t=>{
 const s=setup(t);let v=s.catalog.create('Nuevo instrumento');assert.equal(v.status,'draft');
 const q=question();q.levels[2].text='';
 v=s.catalog.save(v.versionId,{name:'Nuevo instrumento',questions:[q],editRevision:v.editRevision});
 assert.equal(v.instrument.questions[0].levels[2].text,'');
 assert.throws(()=>s.catalog.publish(v.versionId,v.editRevision),/descriptor/i);
 q.levels[2].text='Descriptor completo';v=s.catalog.save(v.versionId,{name:'Nuevo instrumento',questions:[q],editRevision:v.editRevision});
 const p=s.catalog.publish(v.versionId,v.editRevision);assert.equal(p.status,'published');
 assert.throws(()=>s.catalog.save(p.versionId,{name:'Cambiar publicada',questions:[q],editRevision:p.editRevision}),/publicad/i);
});
test('escala fija se valida también en borrador y IDs duplicados se rechazan',t=>{
 const s=setup(t);const v=s.catalog.create('Validación');
 for(const levels of [question().levels.slice(0,4),[...question().levels,{value:6,text:'Seis'}],question().levels.map(l=>({...l,value:l.value===1?0:l.value})),question().levels.toReversed()])
  assert.throws(()=>s.catalog.save(v.versionId,{name:'Validación',questions:[{...question(),levels}],editRevision:0}),/cinco|niveles|escala/i);
 assert.throws(()=>s.catalog.save(v.versionId,{name:'Validación',questions:[question(),question()],editRevision:0}),/identificador/i);
 assert.throws(()=>s.catalog.save(v.versionId,{name:'Validación',questions:[{...question(),type:'texto'}],editRevision:0}),/madurez/i);
});
test('dos editores no sobrescriben cambios; reintentos de publicar y crear borrador no duplican versiones',t=>{
 const s=setup(t);let v=s.catalog.create('Inicial');
 v=s.catalog.save(v.versionId,{name:'Cambio guardado',questions:[question()],editRevision:0});
 assert.throws(()=>s.catalog.save(v.versionId,{name:'Obsoleto',questions:[],editRevision:0}),/otra pestaña/i);
 assert.equal(s.catalog.get(v.versionId).instrument.name,'Cambio guardado');
 assert.throws(()=>s.catalog.publish(v.versionId,0),/otra pestaña/i);
 const pub=s.catalog.publish(v.versionId,v.editRevision);
 assert.equal(s.catalog.publish(pub.versionId,pub.editRevision).versionId,pub.versionId);
 const d=s.catalog.draft(pub.versionId);assert.notEqual(d.versionId,pub.versionId);
 assert.equal(s.catalog.draft(pub.versionId).versionId,d.versionId);assert.equal(d.instrument.questions[0].id,'q_nueva');
});
test('nuevos talleres usan la publicación elegida y los anteriores conservan sus instantáneas',t=>{
 const s=setup(t);let v=s.catalog.create('Instrumento propio');
 v=s.catalog.save(v.versionId,{name:'Instrumento propio',questions:[question('q_uno'),{...question('q_dos'),text:'Segunda pregunta'}],editRevision:0});
 assert.throws(()=>s.createWorkshop({...ficha,instrumentVersionId:v.versionId}),/publicad/i);
 const pub=s.catalog.publish(v.versionId,v.editRevision),w=s.createWorkshop({...ficha,instrumentVersionId:pub.versionId});
 const d=s.catalog.draft(pub.versionId);const changed={...d.instrument.questions[0],text:'Pregunta revisada'};
 const saved=s.catalog.save(d.versionId,{name:'Instrumento revisado',questions:[changed],editRevision:d.editRevision});const p2=s.catalog.publish(saved.versionId,saved.editRevision);
 const state=s.state(w.code,{role:'admin'});assert.equal(state.question.text,'¿Cómo se gestionan los datos?');assert.equal(state.questions.length,2);assert.equal(state.instrument.name,'Instrumento propio');assert.equal(state.instrument.version,'1.0.0');
 const w2=s.createWorkshop({...ficha,instrumentVersionId:p2.versionId});assert.equal(s.state(w2.code,{role:'admin'}).question.text,'Pregunta revisada');
 assert.throws(()=>s.createWorkshop({...ficha,instrumentVersionId:'no-existe'}),/instrumento/i);
});
test('catálogo, borradores y credenciales sobreviven a reinicio y migra versión anterior',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-catalog-')),'db.sqlite');let s=new Store(path);t.after(()=>s.close());
 const w=s.createWorkshop(ficha),p=s.join(w.code);const token=s.issueAdmin();
 const v=s.catalog.create('En elaboración');s.catalog.save(v.versionId,{name:'Guardado',questions:[question()],editRevision:0});
 s.db.exec('PRAGMA user_version=1');s.close();s=new Store(path);
 assert.equal((s.db.prepare('PRAGMA user_version').get() as any).user_version,3);assert.equal(s.catalog.get(v.versionId).instrument.name,'Guardado');assert.equal(s.state(w.code,{role:'participant',token:p.token}).questions.length,3);assert.equal(s.adminValid(token),true);
 assert.equal(s.catalog.list().filter(x=>x.instrumentId==='is4h-piloto-fuentes').length,1);
});
test('reordenar conserva identificadores y números consecutivos; eliminar pregunta no altera publicación anterior',t=>{
 const s=setup(t);let v=s.catalog.create('Orden');v=s.catalog.save(v.versionId,{name:'Orden',questions:[question('q_a'),question('q_b')],editRevision:0});const p=s.catalog.publish(v.versionId,v.editRevision);let d=s.catalog.draft(p.versionId);
 d=s.catalog.save(d.versionId,{name:'Reordenado',questions:[d.instrument.questions[1],d.instrument.questions[0]],editRevision:d.editRevision});
 assert.deepEqual(d.instrument.questions.map(q=>[q.id,q.number]),[['q_b',1],['q_a',2]]);
 d=s.catalog.save(d.versionId,{name:'Una',questions:[d.instrument.questions[0]],editRevision:d.editRevision});
 assert.equal(s.catalog.get(p.versionId).instrument.questions.length,2);assert.equal(d.instrument.questions.length,1);
});
test('migración real E1 sin tabla de catálogo conserva votos, consenso y credenciales',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-migrate-')),'e1.sqlite');let s=new Store(path);t.after(()=>s.close());
 const room=s.createWorkshop(ficha),p=s.join(room.code),admin=s.issueAdmin();const q=s.state(room.code,{role:'admin'}).question.id;
 s.transition(room.code,'open');s.vote(room.code,p.token,{questionId:q,round:1,value:4,requestId:'migracion-envio'});s.transition(room.code,'close');s.transition(room.code,'discuss');s.consensus(room.code,{questionId:q,level:3,justification:'Acuerdo previo a la migración'},ficha.facilitador);
 const before=s.state(room.code,{role:'participant',token:p.token});s.db.exec('DROP TABLE instrument_versions; PRAGMA user_version=1;');s.close();s=new Store(path);
 assert.deepEqual(s.state(room.code,{role:'participant',token:p.token}),before);assert.equal(s.adminValid(admin),true);assert.equal(s.catalog.list().length,1);assert.equal(s.catalog.list()[0].status,'published');assert.equal((s.db.prepare('PRAGMA user_version').get() as any).user_version,3);
});
