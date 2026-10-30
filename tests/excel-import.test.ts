import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../server/store.ts';
import { parseInstrumentXlsx } from '../server/excel-import.ts';
import { templatePath,sampleWorkbook,sampleBytes,xlsxBytes } from './helpers/excel.ts';

test('la plantilla entregada tiene estructura reconocida y vacíos que se deben completar',async()=>{
 const p=await parseInstrumentXlsx(readFileSync(templatePath),'plantilla.xlsx');
 assert.equal(p.canImport,false);assert.ok(p.errors.some(e=>e.cell==='B6'&&e.sheet==='Ficha'));assert.ok(p.errors.some(e=>e.cell==='B7'));assert.ok(p.errors.some(e=>e.sheet==='Preguntas'));
});
test('lee ficha, edición, códigos, orden y cinco descriptores sin perder textos',async()=>{
 const p=await parseInstrumentXlsx(await sampleBytes(),'instrumento.xlsx');
 assert.deepEqual(p.errors,[]);assert.equal(p.canImport,true);assert.equal(p.name,'Evaluación de ejemplo');assert.equal(p.metadata.edition,'2027');assert.equal(p.questions[0].code,'DAT.001');assert.equal(p.questions[1].text,'Pregunta 2');assert.equal(p.questions[0].levels[4].text,'Descriptor 5 de la pregunta 1');assert.match(p.fileHash,/^[a-f0-9]{64}$/);
});
test('errores por celda: descriptor faltante, código repetido y código numérico',async()=>{
 let w=await sampleWorkbook();w.getWorksheet('Preguntas')!.getCell('G6').value=null;let p=await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx');assert.ok(p.errors.some(e=>e.cell==='G6'));
 w=await sampleWorkbook();w.getWorksheet('Preguntas')!.getCell('A7').value='dat.001';p=await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx');assert.ok(p.errors.some(e=>e.cell==='A7'&&/repetido/i.test(e.message)));
 w=await sampleWorkbook();w.getWorksheet('Preguntas')!.getCell('A6').value=123;p=await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx');assert.ok(p.errors.some(e=>e.cell==='A6'&&/texto/i.test(e.message)));
});
test('fórmulas con caché, errores y filas ocultas no se importan como texto válido',async()=>{
 const w=await sampleWorkbook(),p=w.getWorksheet('Preguntas')!;p.getCell('E6').value={formula:'"Respuesta aparente"',result:'Respuesta aparente'};p.getCell('F6').value={error:'#REF!'};p.getRow(7).hidden=true;
 const result=await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx');assert.equal(result.canImport,false);for(const cell of ['E6','F6','A7'])assert.ok(result.errors.some(e=>e.cell===cell));
});
test('estructura errónea, idioma y niveles alterados se rechazan sin inferir columnas',async()=>{
 const w=await sampleWorkbook();w.getWorksheet('Ficha')!.getCell('B10').value='en';w.getWorksheet('Preguntas')!.getCell('I5').value='Nivel 6';
 const p=await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx');assert.equal(p.canImport,false);assert.ok(p.errors.some(e=>e.cell==='B10'));assert.ok(p.errors.some(e=>e.cell==='I5'));
 w.getWorksheet('Ficha')!.name='Otra';assert.ok((await parseInstrumentXlsx(await xlsxBytes(w),'a.xlsx')).errors.some(e=>e.sheet==='Ficha'));
});
test('archivos corruptos, formatos ajenos, carga grande y tamaños ZIP extremos se rechazan',async()=>{
 await assert.rejects(()=>parseInstrumentXlsx(Buffer.from('no es un excel'),'a.xlsx'),/Excel|comprimido|válido/i);
 await assert.rejects(()=>parseInstrumentXlsx(awaitBytesPlaceholder(),'a.xls'),/xlsx/i);
 await assert.rejects(()=>parseInstrumentXlsx(Buffer.alloc(2*1024*1024+1),'a.xlsx'),/2 MiB/i);
 const bytes=await sampleBytes();const changed=Buffer.from(bytes);let pos=changed.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));assert.ok(pos>=0);changed.writeUInt32LE(17*1024*1024,pos+24);
 await assert.rejects(()=>parseInstrumentXlsx(changed,'a.xlsx'),/tamaño|límite/i);
 function awaitBytesPlaceholder(){return Buffer.from('archivo');}
});
test('importación atómica como borrador y reintento persistente no duplican ni pisan edición posterior',async t=>{
 const path=join(mkdtempSync(join(tmpdir(),'agora-import-')),'db.sqlite');let s=new Store(path);t.after(()=>s.close());
 const parsed=await parseInstrumentXlsx(await sampleBytes(),'a.xlsx');const requestId=randomUUID();let v=s.catalog.importDraft(parsed,requestId);
 assert.equal(v.status,'draft');assert.equal(v.instrument.metadata?.edition,'2027');assert.equal(v.instrument.questions[0].code,'DAT.001');
 assert.equal(s.catalog.importDraft(parsed,requestId).versionId,v.versionId);const changed=[{...v.instrument.questions[0],text:'Cambio posterior'},v.instrument.questions[1]];v=s.catalog.save(v.versionId,{name:v.instrument.name,questions:changed,editRevision:v.editRevision});
 s.close();s=new Store(path);assert.equal(s.catalog.importDraft(parsed,requestId).instrument.questions[0].text,'Cambio posterior');assert.equal(s.catalog.list().length,2);
 const other=await sampleWorkbook();other.getWorksheet('Ficha')!.getCell('B7').value='2028';const p2=await parseInstrumentXlsx(await xlsxBytes(other),'a.xlsx');assert.throws(()=>s.catalog.importDraft(p2,requestId),/identificador/i);
 const bad={...parsed,canImport:false,errors:[{sheet:'Preguntas',cell:'E6',message:'Falta descriptor'}]};assert.throws(()=>s.catalog.importDraft(bad,randomUUID()),/errores/i);assert.equal(s.catalog.list().length,2);
});
test('nueva edición conserva IDs por código, agrega preguntas y no altera talleres previos',async t=>{
 const s=new Store(':memory:');t.after(()=>s.close());const parsed=await parseInstrumentXlsx(await sampleBytes(),'2027.xlsx');let pub=s.catalog.importDraft(parsed,randomUUID());pub=s.catalog.publish(pub.versionId,pub.editRevision);
 const room=s.createWorkshop({pais:'CR',institucion:'Equipo',fecha:'2026-10-26',alcance:'Prueba',facilitador:'Facilita',instrumentVersionId:pub.versionId});
 const w=await sampleWorkbook();w.getWorksheet('Ficha')!.getCell('B7').value='2028';w.getWorksheet('Preguntas')!.getCell('A6').value='dat.001';w.getWorksheet('Preguntas')!.getCell('D6').value='Pregunta revisada';w.getWorksheet('Preguntas')!.getCell('A7').value='DAT.003';
 const p2=await parseInstrumentXlsx(await xlsxBytes(w),'2028.xlsx');const next=s.catalog.importDraft(p2,randomUUID(),pub.versionId);
 assert.equal(next.instrumentId,pub.instrumentId);assert.equal(next.instrument.questions[0].id,pub.instrument.questions[0].id);assert.notEqual(next.instrument.questions[1].id,pub.instrument.questions[1].id);assert.equal(next.instrument.metadata?.edition,'2028');assert.equal(s.state(room.code,{role:'admin'}).question.text,'Pregunta 1');
 assert.throws(()=>s.catalog.importDraft(p2,randomUUID(),pub.versionId),/borrador/i);
 assert.equal((s.db.prepare('PRAGMA user_version').get() as any).user_version,3);
});
test('rechaza rangos combinados en el XML antes de cargar el modelo Excel',async()=>{
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.resolve('exceljs'));const JSZip=require('jszip');const zip=await JSZip.loadAsync(await sampleBytes());
 const xml=await zip.file('xl/worksheets/sheet2.xml').async('string');zip.file('xl/worksheets/sheet2.xml',xml.replace('</worksheet>','<mergeCells count="1"><mergeCell ref="A6:B6"/></mergeCells></worksheet>'));
 const bytes=await zip.generateAsync({type:'nodebuffer'});await assert.rejects(()=>parseInstrumentXlsx(bytes,'combinado.xlsx'),/combinad/i);
});
test('rechaza contenido que no podría guardarse posteriormente en el editor',async()=>{
 const w=await sampleWorkbook(),s=w.getWorksheet('Preguntas')!;for(let i=0;i<200;i++)s.getRow(i+6).values=[`Q${i}`,'Área','Dominio',...Array(6).fill('a'.repeat(10000))];
 const p=await parseInstrumentXlsx(await xlsxBytes(w),'contenido-grande.xlsx');assert.equal(p.canImport,false);assert.ok(p.errors.some(e=>/contenido.*3 MiB/i.test(e.message)));
});
test('un rango combinado patológico se rechaza con memoria acotada sin terminar el proceso',async()=>{
 const {createRequire}=await import('node:module'),{spawnSync}=await import('node:child_process'),{writeFileSync}=await import('node:fs');
 const require=createRequire(import.meta.resolve('exceljs')),JSZip=require('jszip'),zip=await JSZip.loadAsync(await sampleBytes());const xml=await zip.file('xl/worksheets/sheet2.xml').async('string');
 zip.file('xl/worksheets/sheet2.xml',xml.replace('</worksheet>','<mergeCells count="1"><mergeCell ref="A6:XFD1048576"/></mergeCells></worksheet>'));
 const path=join(mkdtempSync(join(tmpdir(),'agora-range-')),'range.xlsx');writeFileSync(path,await zip.generateAsync({type:'nodebuffer'}));
 const moduleUrl=new URL('../server/excel-import.ts',import.meta.url).href;
 const script=`import {readFileSync} from 'node:fs';import {parseInstrumentXlsx} from ${JSON.stringify(moduleUrl)};try{await parseInstrumentXlsx(readFileSync(process.argv[1]),'range.xlsx');process.exit(2);}catch(e){console.log(e.code);}`;
 const result=spawnSync(process.execPath,['--max-old-space-size=96','--input-type=module','-e',script,path],{encoding:'utf8',timeout:5000,maxBuffer:4096});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/EXCEL_LIMITES/);
});
test('referencias pegadas como hipervínculos se conservan como texto sin abrir conexiones',async()=>{
 const w=await sampleWorkbook();w.getWorksheet('Ficha')!.getCell('B9').value={text:'Documento del instrumento',hyperlink:'https://example.org/instrumento.pdf'};
 const result=await parseInstrumentXlsx(await xlsxBytes(w),'referencia.xlsx');assert.equal(result.canImport,true);assert.match(result.metadata.reference,/https:\/\/example.org\/instrumento.pdf/);
});
