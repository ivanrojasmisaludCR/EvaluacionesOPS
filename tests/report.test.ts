import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import ExcelJS from 'exceljs';
import {Store} from '../server/store.ts';

function fixture(t:any){
 const store=new Store(':memory:');t.after(()=>store.close());
 const {code}=store.createWorkshop({pais:'Costa Rica',institucion:'=SUM(1,2)',fecha:'2026-10-29',alcance:'Informe de prueba',facilitador:'Facilitadora'});
 const questionId=store.instrument.questions[0].id,token=store.join(code).token;
 store.transition(code,'open');
 store.vote(code,token,{questionId,round:1,value:1,requestId:randomUUID()});
 store.vote(code,token,{questionId,round:1,value:4,requestId:randomUUID()});
 return {store,code,questionId,token};
}
test('informe conserva pendientes y oculta valoraciones abiertas; no cuenta cambios de voto dos veces',t=>{
 const {store,code,questionId,token}=fixture(t);
 const before=store.state(code,{role:'admin'});
 const open=store.report(code);
 assert.equal(open.questions.length,3);assert.equal(open.questions[0].distribution,null);assert.equal(open.questions[0].consensus,null);
 assert.equal(open.results.completedQuestions,0);assert.equal(open.results.domains[0].currentAverage,null);
 store.transition(code,'close');store.transition(code,'discuss');
 store.consensus(code,{questionId,level:3,justification:'Evidencia revisada; desacuerdo observado.'},'Facilitadora');
 const result=store.report(code);
 assert.deepEqual(result.questions[0].distribution,[0,0,0,1,0]);assert.equal(result.questions[0].responseCount,1);
 assert.equal(result.questions[0].consensus?.level,3);assert.equal(result.questions[0].consensus?.justification,'Evidencia revisada; desacuerdo observado.');
 assert.equal(result.questions[1].consensus,null);assert.equal(result.questions[0].levels.length,5);
 assert.equal(result.results.domains[0].currentAverage,3);assert.equal(result.results.complete,false);
 const snapshot=store.state(code,{role:'admin'});store.report(code);assert.deepEqual(store.state(code,{role:'admin'}),snapshot);
 assert.equal(snapshot.question.id,before.question.id);assert.equal(JSON.stringify(result).includes(token),false);
});

test('Excel exportado contiene preguntas, descriptores, observaciones, valores numéricos e imágenes sin fórmulas ejecutables',async t=>{
 const {store,code,questionId}=fixture(t);store.transition(code,'close');store.transition(code,'discuss');store.consensus(code,{questionId,level:3,justification:'=HYPERLINK("https://ejemplo.invalid","literal")'},'Facilitadora');
 const {exportReport}=await import('../server/report-files.ts');
 const bytes=await exportReport(store.report(code),'xlsx');
 const book=new ExcelJS.Workbook();await book.xlsx.load(bytes as any);
 assert.deepEqual(book.worksheets.map(s=>s.name),['Resumen','Dominios','Preguntas','Gráficos']);
 assert.equal(book.getWorksheet('Resumen')!.getCell('B4').value,'=SUM(1,2)');
 const sheet=book.getWorksheet('Preguntas')!,rows=sheet.getSheetValues() as any[];
 const first=rows[6];assert.equal(first[1],1);assert.equal(first[13],3);assert.match(first[15],/^=HYPERLINK/);assert.equal(sheet.getCell('O6').type,ExcelJS.ValueType.String);
 assert.equal(sheet.getCell('M7').value,null);assert.equal(sheet.getCell('S6').value,store.instrument.questions[0].levels[0].text);
 assert.equal(book.getWorksheet('Gráficos')!.getImages().length,2);
 assert.ok(bytes.length>10000);
});

test('PDF conserva el texto final y el estilo normal en continuaciones de observaciones largas',async t=>{
 const {store,code,questionId}=fixture(t);store.transition(code,'close');store.transition(code,'discuss');store.consensus(code,{questionId,level:5,justification:'Observación extensa. '.repeat(450)+'FIN-OBSERVACION'},'Facilitadora');
 const {exportReport}=await import('../server/report-files.ts');const bytes=await exportReport(store.report(code),'pdf');
 assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>20000);
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const loading=getDocument({data:new Uint8Array(bytes),useSystemFonts:false,disableFontFace:true});const pdf=await loading.promise;
 try{
  let text='';let continuation=false;
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i),content=await page.getTextContent();
   const items=content.items.filter((x:any)=>'str' in x) as {str:string;fontName:string}[];text+=items.map(x=>x.str).join(' ');
   const observations=items.filter(x=>x.str.startsWith('Observación extensa.'));
   const body=items.find(x=>x.str.includes('INFORME PRELIMINAR - sujeto a revisión humana.'));
   if(body)(pdf as any).reportBodyFont=body.fontName;
   if(observations.length>5){continuation=true;assert.ok(observations.every(x=>x.fontName===(pdf as any).reportBodyFont),'La continuación conserva fuente de cuerpo, sin estilo de encabezado');}
  }
  assert.ok(continuation);assert.match(text,/FIN-OBSERVACION/);assert.match(text,/Resultado parcial/);assert.match(text,/Pregunta 3/);
 }finally{await loading.destroy();}
});
test('Excel divide observaciones de muchas líneas cortas sin recortar las líneas finales',async t=>{
 const {store,code,questionId}=fixture(t);store.transition(code,'close');store.transition(code,'discuss');const observation=('línea\n'.repeat(80))+'FIN-MULTILINEA';
 store.consensus(code,{questionId,level:3,justification:observation},'Facilitadora');const {exportReport}=await import('../server/report-files.ts');
 const book=new ExcelJS.Workbook();await book.xlsx.load(await exportReport(store.report(code),'xlsx') as any);
 const parts:string[]=[];book.getWorksheet('Preguntas')!.getColumn('O').eachCell((cell,row)=>{if(row>5&&typeof cell.value==='string')parts.push(cell.value);});
 assert.ok(parts.length>1,'La observación con más líneas que una fila se divide en continuaciones');assert.equal(parts.join(''),observation);
});
