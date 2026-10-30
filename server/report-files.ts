import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {reportCharts,reportFonts,type ReportChart} from './report-charts.ts';
import type {WorkshopReport,ReportQuestion} from './report-data.ts';
const blue='006EB8',ink='15324C';
const state=(value:{complete:boolean;currentScore:number|null})=>value.complete?'Completo':value.currentScore===null?'Pendiente':'Parcial';
const phases:Record<string,string>={preparacion:'Preparación','votacion-abierta':'Votación abierta',cerrado:'Votación cerrada',discusion:'Discusión',consenso:'Consenso'};
const method='Los puntajes usan consensos, no votos individuales. Dominio: media de consensos disponibles, redondeada a entero. Área: media de niveles de dominio con igual peso, redondeada a un decimal. Los pendientes no cuentan como cero. No hay un puntaje global único.';
const notice='INFORME PRELIMINAR - sujeto a revisión humana. Informe de Ágora; no sustituye la plantilla oficial ni certifica equivalencia con todas sus fórmulas. Los gráficos son una instantánea del momento de exportación.';
const fmt=(n:number|null,digits=1)=>n===null?'Pendiente':n.toLocaleString('es-CR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const literal=(value:unknown)=>typeof value==='string'?value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,''):value;
const response=(q:ReportQuestion)=>q.distribution?q.distribution.map((count,i)=>`Nivel ${i+1}: ${count}`).join(' · '):'Valoraciones ocultas hasta cerrar la votación';
function cellParts(value:string,width:number):string[]{
 const parts:string[]=[];let chunk='',line=1,column=0;const capacity=Math.max(10,width-4);
 for(const char of value){
  if(chunk.length>=700||line>20){parts.push(chunk);chunk='';line=1;column=0;}
  chunk+=char;if(char==='\n'){line++;column=0;}else if(++column>=capacity){line++;column=0;}
 }
 if(chunk||!parts.length)parts.push(chunk);return parts;
}

async function excel(report:WorkshopReport,charts:ReportChart[]):Promise<Buffer>{
 const book=new ExcelJS.Workbook();book.creator='Ágora';book.created=new Date(report.generatedAt);book.modified=book.created;
 function sheet(name:string,widths:number[]){const s=book.addWorksheet(name,{views:[{state:'frozen',ySplit:5}],pageSetup:{orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0}});s.columns=widths.map(width=>({width}));s.properties.defaultRowHeight=24;return s;}
 function row(s:ExcelJS.Worksheet,values:any[],header=false){const r=s.addRow(values.map(literal));r.eachCell({includeEmpty:true},(cell,index)=>{cell.font={name:'Liberation Sans',size:11,color:{argb:header?'FFFFFFFF':ink},bold:header};cell.alignment={vertical:'top',wrapText:true};if(header)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:blue}};if(typeof cell.value==='number')cell.numFmt=Number.isInteger(cell.value)?'0':'0.00';if(cell.value instanceof Date)cell.numFmt='yyyy-mm-dd hh:mm:ss';});
  const height=Math.max(24,...values.map((v,i)=>typeof v==='string'?v.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/Math.max(10,(s.getColumn(i+1).width||20)-4))),0)*15+10:24));r.height=Math.min(409,height);return r;}
 function title(s:ExcelJS.Worksheet,text:string,columns:number){s.mergeCells(1,1,1,columns);s.getCell('A1').value=text;s.getCell('A1').font={name:'Liberation Sans',size:20,bold:true,color:{argb:blue}};s.getRow(1).height=38;s.getCell('A1').alignment={wrapText:true,vertical:'middle'};}
 const summary=sheet('Resumen',[30,72,23,24,25,20,20,20]);title(summary,'Ágora · Resultados del taller',8);
 row(summary,[report.results.complete?'Todos los consensos registrados · Informe preliminar':'Resultado parcial · Informe preliminar']);summary.mergeCells('A2:H2');
 for(const item of [['Sala',report.code],['Institución',report.workshop.institucion],['País',report.workshop.pais],['Fecha del taller',report.workshop.fecha],['Facilitador',report.workshop.facilitador],['Alcance',report.workshop.alcance],['Instrumento',report.instrument.name],['Versión',report.instrument.version],['Edición',report.instrument.edition],['Exportado (UTC)',report.generatedAt],['Participantes registrados',report.participantCount],['Preguntas con consenso',`${report.results.completedQuestions} / ${report.results.totalQuestions}`],['Dominios completos',`${report.results.completedDomains} / ${report.results.totalDomains}`],['Áreas completas',`${report.results.completedAreas} / ${report.results.totalAreas}`]])row(summary,item);
 row(summary,[]);row(summary,['Área','Nivel actual','Consensos','Preguntas','Suma de consensos','Estado'],true);
 for(const area of report.results.areas)row(summary,[area.area,area.currentScore,area.completedQuestions,area.totalQuestions,area.completedQuestions?area.consensusSum:null,state(area)]);
 row(summary,[]);row(summary,['Cálculo',method]);row(summary,['Alcance del informe',notice]);row(summary,['Respuestas y observaciones','Se exportan valoraciones anónimas vigentes de rondas cerradas. Observaciones = justificación registrada del consenso; no hay comentarios individuales almacenados.']);
 const domains=sheet('Dominios',[30,58,20,20,20,24,20,20]);title(domains,'Resultados por dominio',8);row(domains,[notice]);domains.mergeCells('A2:H2');row(domains,[method]);domains.mergeCells('A3:H3');domains.getRow(2).height=50;domains.getRow(3).height=60;row(domains,[]);
 row(domains,['Área','Dominio','Consensos','Preguntas','Suma actual','Promedio actual','Nivel actual','Estado'],true);
 for(const d of report.results.domains)row(domains,[d.area,d.domain,d.completed,d.total,d.completed?d.sum:null,d.currentAverage,d.currentScore,state(d)]);
 domains.autoFilter={from:'A5',to:`H${domains.rowCount}`};
 const questions=sheet('Preguntas',[9,24,32,40,75,25,15,13,13,13,13,13,17,55,70,28,25,24,55,55,55,55,55]);title(questions,'Preguntas, respuestas, consensos y observaciones',23);
 row(questions,['Cada pregunta conserva su versión. Las valoraciones se cuentan por nivel; el consenso es el acuerdo registrado.']);questions.mergeCells('A2:W2');
 row(questions,['Textos extensos continúan en filas consecutivas con el mismo número. Los gráficos son imágenes estáticas.']);questions.mergeCells('A3:W3');row(questions,[]);
 row(questions,['N.º','Código','Área','Dominio','Pregunta','Fase','Respuestas recibidas','Votos nivel 1','Votos nivel 2','Votos nivel 3','Votos nivel 4','Votos nivel 5','Consenso (nivel)','Respuesta de consenso','Observaciones / justificación','Registrado por','Fecha consenso (UTC)','Estado del consenso','Descriptor nivel 1','Descriptor nivel 2','Descriptor nivel 3','Descriptor nivel 4','Descriptor nivel 5'],true);
 for(const q of report.questions){
  const values:any[]=[q.number,q.code||q.id,q.area,q.domain,q.text,phases[q.phase],q.responseCount,...(q.distribution||[null,null,null,null,null]),q.consensus?.level??null,q.consensus?q.levels.find(l=>l.value===q.consensus!.level)?.text||'':null,q.consensus?.justification||null,q.consensus?.author||null,q.consensus?new Date(q.consensus.createdAt):null,q.consensus?'Registrado':q.distribution?'Pendiente':'Pendiente; votos ocultos',...q.levels.map(l=>l.text)];
  const chunks=values.map((v,i)=>typeof v==='string'?cellParts(v,questions.getColumn(i+1).width||20):[v]);
  for(let i=0;i<Math.max(...chunks.map(c=>c.length));i++)row(questions,chunks.map((parts,index)=>index===0?q.number:parts[i]??null));
 }
 questions.autoFilter={from:'A5',to:`W${questions.rowCount}`};questions.pageSetup.printTitlesRow='1:5';
 const graphics=sheet('Gráficos',[18,18,18,18,18,18,18,18]);title(graphics,'Perfiles actuales por área y dominio',8);row(graphics,['Instantánea estática. Pendientes sin valor; puntos huecos indican resultado parcial.']);graphics.mergeCells('A2:H2');let top=4;
 for(const chart of charts){const id=book.addImage({buffer:chart.png as any,extension:'png'});const width=850,height=chart.height*width/chart.width;graphics.addImage(id,{tl:{col:0,row:top},ext:{width,height}});const count=Math.ceil(height/24)+2;for(let i=top;i<top+count;i++)graphics.getRow(i+1).height=18;top+=count;}
 return Buffer.from(await book.xlsx.writeBuffer());
}

async function pdf(report:WorkshopReport,charts:ReportChart[]):Promise<Buffer>{
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margins:{top:60,bottom:54,left:44,right:44},bufferPages:true,info:{Title:`Ágora · Resultados ${report.code}`,Author:'Ágora',Subject:'Informe preliminar de taller'}});
  const chunks:Buffer[]=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  doc.registerFont('Report',reportFonts.regular);doc.registerFont('ReportBold',reportFonts.bold);doc.font('Report');
  const width=doc.page.width-88;
  function text(value:string,size=10,bold=false,color='#15324c'){doc.font(bold?'ReportBold':'Report').fontSize(size).fillColor(color).text(value,{width,lineGap:3});doc.moveDown(0.45);}
  function space(height:number){if(doc.y+height>doc.page.height-60)doc.addPage();}
  function heading(title:string){space(85);text(title,17,true,'#006eb8');}
  function field(label:string,value:string){space(42);text(label,10,true);text(value||'No indicado',10);}
  try{
   text('Resultados del taller',26,true,'#006eb8');text(report.results.complete?'Todos los consensos registrados':'Resultado parcial',13,true);text(notice,10);doc.moveDown();
   for(const [label,value] of [['Institución',report.workshop.institucion],['País y fecha',`${report.workshop.pais} · ${report.workshop.fecha}`],['Facilitador',report.workshop.facilitador],['Alcance',report.workshop.alcance],['Instrumento',`${report.instrument.name} · v${report.instrument.version}${report.instrument.edition?' · '+report.instrument.edition:''}`],['Exportado (UTC)',report.generatedAt]])field(label,value);
   text(`${report.results.completedQuestions} / ${report.results.totalQuestions} preguntas con consenso · ${report.results.completedDomains} / ${report.results.totalDomains} dominios completos · ${report.participantCount} participantes registrados`,11,true);
   text(method,10);text('Respuestas = distribución anónima de valoraciones vigentes de rondas cerradas. Observaciones = justificación del consenso. No se incluyen comentarios individuales ni identidades de participantes.',10);
   doc.addPage();heading('Resumen por área');
   for(const area of report.results.areas){space(65);text(area.area,12,true);text(`Nivel actual: ${fmt(area.currentScore)} · ${area.completedQuestions}/${area.totalQuestions} consensos · Suma: ${area.completedQuestions?area.consensusSum:'Pendiente'} · ${state(area)}`,10);}
   heading('Resumen por dominio');
   for(const d of report.results.domains){space(75);text(`${d.area} / ${d.domain}`,11,true);text(`Consensos: ${d.completed}/${d.total} · Suma: ${d.completed?d.sum:'Pendiente'} · Promedio: ${fmt(d.currentAverage,2)} · Nivel: ${fmt(d.currentScore,0)} · ${state(d)}`,10);}
   for(const chart of charts){doc.addPage();const maxHeight=doc.page.height-125;const scale=Math.min(width/chart.width,maxHeight/chart.height);doc.image(chart.png,44,60,{width:chart.width*scale,height:chart.height*scale});}
   doc.addPage();heading('Preguntas, respuestas y consensos');
   for(const q of report.questions){
    space(120);text(`Pregunta ${q.number}${q.code?' · '+q.code:''}`,15,true,'#006eb8');text(`${q.area} / ${q.domain}`,10,true);text(q.text,11);
    text(`Ronda ${q.round} · ${phases[q.phase]} · ${q.responseCount} respuestas recibidas`,10);field('Valoraciones recibidas',response(q));
    field('Consenso',q.consensus?`Nivel ${q.consensus.level} - ${q.levels.find(l=>l.value===q.consensus!.level)?.text||''}`:'Pendiente de consenso');
    field('Observaciones / justificación',q.consensus?.justification||'Sin observaciones de consenso registradas.');
    if(q.consensus)text(`Registrado por ${q.consensus.author} · ${q.consensus.createdAt} (UTC)`,9);
    for(const level of q.levels)field(`Descriptor de respuesta · Nivel ${level.value}`,level.text);
    doc.moveDown(1);
   }
   const range=doc.bufferedPageRange();
   for(let i=range.start;i<range.start+range.count;i++){doc.switchToPage(i);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.font('ReportBold').fontSize(10).fillColor('#006eb8').text(`ÁGORA  |  SALA ${report.code}  |  INFORME PRELIMINAR`,44,25,{width,lineBreak:false});doc.font('Report').fontSize(8).fillColor('#48647b').text(`${report.code} · Preliminar · ${i+1} / ${range.count}`,44,doc.page.height-30,{width,align:'right',lineBreak:false});doc.page.margins.bottom=bottom;}
   doc.end();
  }catch(error){doc.destroy();reject(error);}
 });
}
export async function exportReport(report:WorkshopReport,format:'xlsx'|'pdf'):Promise<Buffer>{
 const charts=reportCharts(report);return format==='xlsx'?excel(report,charts):pdf(report,charts);
}
