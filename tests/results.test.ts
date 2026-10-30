import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeResults} from '../server/results.ts';
const questions=[{id:'a',area:'DMIT',domain:'Fuentes'},{id:'b',area:'DMIT',domain:'Fuentes'},{id:'c',area:'DMIT',domain:'Fuentes'},{id:'d',area:'DMIT',domain:'Productos'},{id:'e',area:'MAGO',domain:'Fuentes'}];
test('resultados vacíos son pendientes y no niveles cero',()=>{
 const r=summarizeResults(questions,new Map());assert.equal(r.totalQuestions,5);assert.equal(r.totalDomains,3);assert.equal(r.totalAreas,2);assert.equal(r.complete,false);assert.equal(r.completedQuestions,0);
 assert.ok(r.domains.every(d=>d.currentScore===null&&d.currentAverage===null));assert.ok(r.areas.every(a=>a.currentScore===null));
});
test('avance usa suma y media de consensos disponibles, conservando resultado definitivo pendiente',()=>{
 const r=summarizeResults(questions,new Map([['a',2],['b',3]]));const d=r.domains[0];
 assert.equal(d.sum,5);assert.equal(d.completed,2);assert.equal(d.total,3);assert.equal(d.currentAverage,2.5);assert.equal(d.currentScore,3);assert.equal(d.average,null);assert.equal(d.score,null);
 assert.equal(r.areas[0].currentScore,3);assert.equal(r.areas[0].complete,false);assert.equal(r.areas[1].currentScore,null);assert.equal(r.consensusSum,5);assert.equal(r.completedDomains,0);
});
test('área da igual peso a cada dominio, no a cada pregunta',()=>{
 const r=summarizeResults(questions,new Map([['a',1],['b',1],['c',1],['d',5]]));
 assert.equal(r.areas[0].currentScore,3);assert.equal(r.areas[0].complete,true);assert.equal(r.complete,false);assert.equal(r.completedAreas,1);assert.equal(r.completedDomains,2);
 assert.equal(r.areas[1].currentScore,null);
});
test('redondea dominios a entero antes de promediar el área a un decimal',()=>{
 const q=[{id:'a',area:'A',domain:'Uno'},{id:'b',area:'A',domain:'Uno'},{id:'c',area:'A',domain:'Dos'},{id:'d',area:'A',domain:'Tres'}];
 const r=summarizeResults(q,new Map([['a',1],['b',2],['c',3],['d',3]]));
 assert.equal(r.domains[0].currentAverage,1.5);assert.equal(r.domains[0].currentScore,2);assert.equal(r.areas[0].currentScore,2.7);assert.equal(r.complete,true);
});
test('dominios homónimos en áreas distintas permanecen independientes y respuestas ajenas se ignoran',()=>{
 const r=summarizeResults(questions,new Map([['a',2],['e',5],['unknown',1]]));assert.equal(r.areas[0].currentScore,2);assert.equal(r.areas[1].currentScore,5);assert.equal(r.completedQuestions,2);assert.equal(r.consensusSum,7);
});
test('el redondeo de área en mitad exacta sube sin errores de punto flotante',()=>{
 const q=Array.from({length:20},(_,i)=>({id:String(i),area:'A',domain:'D'+i}));
 const values=new Map(q.map((x,i)=>[x.id,i<9?3:2]));
 assert.equal(summarizeResults(q,values).areas[0].currentScore,2.5);
});
