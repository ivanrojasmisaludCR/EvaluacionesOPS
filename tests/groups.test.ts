import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupResults } from '../server/groups.ts';
const questions=[{id:'a',area:'DMIT',domain:'Fuentes'},{id:'b',area:'DMIT',domain:'Fuentes'},{id:'c',area:'DMIT',domain:'Fuentes'},{id:'d',area:'MAGO',domain:'Fuentes'},{id:'e',area:'DMIT',domain:'Productos'}];
test('agrupa por área y dominio, incluso preguntas no consecutivas, sin mezclar áreas',()=>{
 const groups=groupResults([questions[0],questions[3],questions[1],questions[4],questions[2]],new Map());
 assert.equal(groups.length,3);assert.deepEqual(groups[0].questionIds,['a','b','c']);
 assert.equal(groups[0].average,null);assert.equal(groups[0].score,null);assert.equal(groups[0].completed,0);
});
test('no publica promedio hasta completar todos los consensos; pendientes no cuentan como cero',()=>{
 const results=new Map([['a',2],['b',3]]);
 let group=groupResults(questions,results)[0];
 assert.equal(group.completed,2);assert.equal(group.total,3);assert.equal(group.complete,false);assert.equal(group.average,null);
 results.set('c',5);group=groupResults(questions,results)[0];
 assert.equal(group.complete,true);assert.equal(group.average,10/3);assert.equal(group.score,3);
});
test('redondea .5 hacia arriba y evita colisiones entre nombres de grupos',()=>{
 const qs=[{id:'a',area:'A|B',domain:'C'},{id:'b',area:'A|B',domain:'C'},{id:'c',area:'A',domain:'B|C'}];
 const groups=groupResults(qs,new Map([['a',2],['b',3],['c',5]]));
 assert.equal(groups.length,2);assert.equal(groups[0].average,2.5);assert.equal(groups[0].score,3);assert.equal(groups[1].score,5);
});
