import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from '../server/store.ts';
const ficha = { pais:'Costa Rica', institucion:'Taller de prueba', fecha:'2026-10-26', alcance:'Piloto', facilitador:'Facilitadora' };
function setup(t: any) {
 const db = new Store(':memory:'); t.after(()=>db.close());
 const room=db.createWorkshop(ficha); const p=db.join(room.code); const q=db.state(room.code,{role:'admin'}).question.id;
 const send=(value:any,requestId=randomUUID())=>({questionId:q,round:1,value,requestId});
 return {db,room,p,q,send};
}
test('escala y descriptores: rechaza niveles inválidos sin guardar respuestas', t=>{
 const {db,room,p,send}=setup(t); db.transition(room.code,'open');
 for(const v of [0,6,3.5,'3',null,true]) assert.throws(()=>db.vote(room.code,p.token,send(v)),/nivel/i);
 assert.equal(db.state(room.code,{role:'admin'}).responseCount,0);
});
test('un cambio conserva historial y cuenta una respuesta; reintento posterior al cierre recupera acuse',t=>{
 const {db,room,p,send}=setup(t); db.transition(room.code,'open');
 const first=send(2); const ack=db.vote(room.code,p.token,first);
 assert.deepEqual(db.vote(room.code,p.token,first),ack);
 db.vote(room.code,p.token,send(4));
 assert.equal(db.state(room.code,{role:'admin'}).responseCount,1);
 assert.equal(db.history(room.code).length,2);
 db.transition(room.code,'close');
 assert.deepEqual(db.vote(room.code,p.token,first),ack);
 assert.throws(()=>db.vote(room.code,p.token,send(3)),/cerrada/i);
 assert.throws(()=>db.vote(room.code,p.token,{...first,value:5}),/identificador/i);
 assert.deepEqual(db.state(room.code,{role:'admin'}).distribution,[0,0,0,1,0]);
});
test('distribución ausente durante votación y respuesta propia solo para su participante',t=>{
 const {db,room,p,send}=setup(t); const other=db.join(room.code); db.transition(room.code,'open');db.vote(room.code,p.token,send(3));
 const own=db.state(room.code,{role:'participant',token:p.token});
 assert.equal('distribution' in own,false);assert.equal(own.ownVote.value,3);
 const spectator=db.state(room.code,{role:'participant',token:other.token});
 assert.equal(spectator.ownVote,null);assert.equal('projectionToken' in spectator,false);
 assert.equal(JSON.stringify(spectator).includes(p.token),false);
 assert.equal(spectator.results.completedQuestions,0);assert.ok(spectator.results.areas.every((a:any)=>a.currentScore===null));
});
test('transiciones inválidas, cambio de pregunta durante voto y credencial de otra sala rechazados',t=>{
 const {db,room,p,send}=setup(t); assert.throws(()=>db.transition(room.code,'close'),/transición/i);
 db.transition(room.code,'open'); const state=db.state(room.code,{role:'admin'});
 assert.throws(()=>db.transition(room.code,'select',state.questions[1].id),/cerrar|consenso/i);
 assert.throws(()=>db.vote(room.code,p.token,{...send(3),questionId:state.questions[1].id}),/pregunta/i);
 const other=db.createWorkshop(ficha); assert.throws(()=>db.vote(other.code,p.token,send(3)),/credencial/i);
});
test('consenso exige discusión, nivel y justificación; no reescribe votos',t=>{
 const {db,room,p,send}=setup(t);db.transition(room.code,'open');db.vote(room.code,p.token,send(2));db.transition(room.code,'close');
 assert.throws(()=>db.consensus(room.code,{questionId:send(3).questionId,level:4,justification:'Evidencia'},'Facilitadora'),/discusión/i);
 db.transition(room.code,'discuss');
 for(const level of [0,6,2.5,'4']) assert.throws(()=>db.consensus(room.code,{questionId:send(3).questionId,level,justification:'Evidencia'},'Facilitadora'),/nivel/i);
 assert.throws(()=>db.consensus(room.code,{questionId:send(3).questionId,level:4,justification:'  '},'Facilitadora'),/justificación/i);
 db.consensus(room.code,{questionId:send(3).questionId,level:4,justification:'Evidencia documental'},'Facilitadora');
 const s=db.state(room.code,{role:'admin'});assert.equal(s.phase,'consenso');assert.equal(s.consensus.level,4);assert.equal(db.history(room.code)[0].value,2);
 db.transition(room.code,'select',s.questions[1].id);assert.throws(()=>db.vote(room.code,p.token,send(3)),/pregunta/i);
});
test('reiniciar conserva taller, instantánea, voto, identidad y consenso',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-')),'test.db');let db=new Store(path);t.after(()=>db.close());
 const room=db.createWorkshop(ficha);const p=db.join(room.code); const q=db.state(room.code,{role:'admin'}).question.id;
 db.transition(room.code,'open');const input={questionId:q,round:1,value:5,requestId:randomUUID()};const ack=db.vote(room.code,p.token,input);
 db.transition(room.code,'close');db.transition(room.code,'discuss');db.consensus(room.code,{questionId:q,level:3,justification:'Acuerdo registrado'},'Facilitadora');
 db.close();db=new Store(path);const s=db.state(room.code,{role:'participant',token:p.token});
 assert.equal(s.consensus.level,3);assert.equal(s.ownVote.value,5);assert.equal(s.question.levels.length,5);assert.equal(db.join(room.code,p.token).token,p.token);assert.equal(s.participantCount,1);assert.deepEqual(db.vote(room.code,p.token,input),ack);
});
test('ficha y publicación incompletas se rechazan',t=>{
 const {db}=setup(t);assert.throws(()=>db.createWorkshop({...ficha,fecha:'2026-02-30'}),/fecha/i);
 assert.throws(()=>db.createWorkshop({...ficha,facilitador:''}),/facilitador/i);
});
test('agrupamientos: solo consensos, resultado completo compartido y persistente',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-groups-')),'test.db');let db=new Store(path);t.after(()=>db.close());
 const room=db.createWorkshop(ficha),p=db.join(room.code);
 const initial=db.state(room.code,{role:'admin'});assert.equal(initial.groups.length,1);assert.equal(initial.groups[0].score,null);
 for(const [i,q] of initial.questions.entries()){
  if(i)db.transition(room.code,'select',q.id);
  db.transition(room.code,'open');db.vote(room.code,p.token,{questionId:q.id,round:1,value:1,requestId:randomUUID()});
  assert.equal(db.state(room.code,{role:'participant',token:p.token}).groups[0].score,null);
  db.transition(room.code,'close');db.transition(room.code,'discuss');
  db.consensus(room.code,{questionId:q.id,level:[2,3,5][i],justification:'Acuerdo basado en evidencia'},'Facilitadora');
  const g=db.state(room.code,{role:'admin'}).groups[0];assert.equal(g.completed,i+1);assert.equal(g.score,i===2?3:null);
 }
 const expected=db.state(room.code,{role:'admin'}).groups;
 assert.equal(expected[0].average,10/3);assert.deepEqual(db.state(room.code,{role:'projector',token:initial.projectionToken}).groups,expected);
 db.close();db=new Store(path);assert.deepEqual(db.state(room.code,{role:'participant',token:p.token}).groups,expected);
});
test('resultados parciales se recuperan al reiniciar sin alterar pregunta, fases o votos',t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-results-')),'test.db');let db=new Store(path);t.after(()=>db.close());
 const room=db.createWorkshop(ficha),person=db.join(room.code),question=db.state(room.code,{role:'admin'}).question.id;
 db.transition(room.code,'open');db.vote(room.code,person.token,{questionId:question,round:1,value:5,requestId:randomUUID()});db.transition(room.code,'close');db.transition(room.code,'discuss');db.consensus(room.code,{questionId:question,level:2,justification:'El grupo acuerda nivel dos'},'Facilitadora');
 const before=db.state(room.code,{role:'admin'});assert.equal(before.results.consensusSum,2);assert.equal(before.results.completedQuestions,1);assert.equal(before.results.areas[0].currentScore,2);assert.equal(before.results.complete,false);assert.ok(before.results.lastConsensusAt);
 assert.deepEqual(db.state(room.code,{role:'participant',token:person.token}).results,before.results);assert.deepEqual(db.state(room.code,{role:'projector',token:before.projectionToken}).results,before.results);
 db.close();db=new Store(path);const after=db.state(room.code,{role:'admin'});assert.deepEqual(after.results,before.results);assert.equal(after.question.id,question);assert.equal(after.phase,'consenso');assert.equal(db.history(room.code).length,1);assert.equal(db.history(room.code)[0].value,5);assert.equal(after.groups[0].score,null);
});
