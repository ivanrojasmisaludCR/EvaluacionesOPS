import ExcelJS from 'exceljs';
import { fromBuffer } from 'yauzl';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import type { Readable } from 'node:stream';
import { SaxesParser } from 'saxes';
import { Problem, fail } from './errors.ts';

export type ImportIssue={sheet:string;cell:string;message:string};
export type ImportMetadata={edition:string;description:string;reference:string;language:string};
export type ImportQuestion={code:string;row:number;text:string;area:string;domain:string;levels:{value:number;text:string}[]};
export type ExcelImport={fileName:string;fileHash:string;name:string;metadata:ImportMetadata;questions:ImportQuestion[];errors:ImportIssue[];warnings:string[];canImport:boolean};
const MAX_FILE=2*1024*1024,MAX_ENTRY=16*1024*1024,MAX_EXPANDED=32*1024*1024;

async function validateArchive(bytes:Buffer){
 await new Promise<void>((resolve,reject)=>{
  fromBuffer(bytes,{lazyEntries:true,validateEntrySizes:true,autoClose:true},(error,zip)=>{
   if(error||!zip){reject(new Problem(400,'EXCEL_INVALIDO','El archivo Excel no es válido o está comprimido incorrectamente.'));return;}
   let count=0,total=0,finished=false,currentStream:Readable|undefined;
   const abort=(message:string)=>{if(finished)return;finished=true;currentStream?.destroy();zip.close();reject(new Problem(400,'EXCEL_LIMITES',message));};
   zip.on('error',()=>abort('El archivo Excel está corrupto o su tamaño comprimido no coincide.'));
   zip.on('entry',entry=>{
    count++;total+=entry.uncompressedSize;
    if(count>256||entry.uncompressedSize>MAX_ENTRY||total>MAX_EXPANDED){abort('El tamaño descomprimido del Excel excede el límite permitido.');return;}
    if(/vbaProject\.bin|(?:^|\/)externalLinks\//i.test(entry.fileName)){abort('Use un archivo .xlsx sin macros ni vínculos externos de Excel.');return;}
    if(entry.fileName.endsWith('/')){zip.readEntry();return;}
    zip.openReadStream(entry,(err,stream)=>{
     if(err||!stream){abort('No se pudo leer el contenido comprimido del Excel.');return;}
     currentStream=stream;
     let actual=0;
     const xml=/^xl\/worksheets\/[^/]+\.xml$/i.test(entry.fileName)?new SaxesParser({xmlns:true}):undefined;
     const decoder=xml?new TextDecoder('utf-8',{fatal:true}):undefined;
     let rows=0,cells=0;
     if(xml){
      xml.on('error',()=>abort('El XML de la hoja no es válido.'));
      xml.on('doctype',()=>abort('No se admiten declaraciones externas en el Excel.'));
      xml.on('opentag',node=>{
       if(finished)return;
       const attr=(name:string)=>{const value=node.attributes[name];return typeof value==='object'?value.value:String(value||'');};
       if(node.local==='mergeCell'){abort('No se admiten celdas combinadas en la plantilla. Descombine las celdas antes de importar.');return;}
       if(node.local==='row'){
        rows++;const r=attr('r');if(rows>2005||(r&&(!/^\d+$/.test(r)||Number(r)>2005)))abort('La hoja excede el límite de filas de la plantilla.');
       }
       if(node.local==='c'){
        cells++;const coordinate=attr('r').match(/^([A-Z]+)([0-9]+)$/i);
        let col=0;if(coordinate)for(const ch of coordinate[1].toUpperCase())col=col*26+ch.charCodeAt(0)-64;
        if(cells>20000||(coordinate&&(Number(coordinate[2])>2005||col>64)))abort('La hoja excede el límite de celdas o columnas de la plantilla.');
       }
       if(node.local==='col'&&Number(attr('max'))>64)abort('La hoja excede el límite de columnas de la plantilla.');
      });
     }
     stream.on('data',(chunk:Buffer)=>{actual+=chunk.length;if(actual>MAX_ENTRY){abort('El tamaño de una entrada del Excel excede el límite permitido.');return;}if(xml&&!finished){try{xml.write(decoder!.decode(chunk,{stream:true}));}catch{abort('El XML de la hoja no es válido.');}}});
     stream.on('error',()=>abort('El archivo Excel está corrupto o su tamaño no coincide.'));
     stream.on('end',()=>{if(xml&&!finished){try{xml.write(decoder!.decode()).close();}catch{abort('El XML de la hoja no es válido.');}}if(!finished)zip.readEntry();});
    });
   });
   zip.on('end',()=>{if(!finished){finished=true;resolve();}});
   zip.readEntry();
  });
 });
}
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
export async function parseInstrumentXlsx(bytes:Buffer,fileName:string):Promise<ExcelImport>{
 const safeName=basename(fileName.replaceAll('\\','/'));
 if(!/\.xlsx$/i.test(safeName)||safeName.length>180)fail(415,'FORMATO_NO_ADMITIDO','Seleccione un archivo .xlsx de la plantilla de Ágora.');
 if(bytes.length>MAX_FILE)fail(413,'ARCHIVO_GRANDE','El archivo Excel no puede superar 2 MiB.');
 await validateArchive(bytes);
 const workbook=new ExcelJS.Workbook();
 try{await workbook.xlsx.load(bytes as any);}catch{fail(400,'EXCEL_INVALIDO','No se pudo leer el Excel. Use la plantilla de Ágora y guarde como .xlsx.');}
 const errors:ImportIssue[]=[],warnings:string[]=[];
 const issue=(sheet:string,cell:string,message:string)=>{if(errors.length<100&&!errors.some(e=>e.sheet===sheet&&e.cell===cell&&e.message===message))errors.push({sheet,cell,message});};
 function read(cell:ExcelJS.Cell,required:boolean,max:number,allowNumber=false):string{
  const sheet=cell.worksheet.name,where=cell.address;let result='';const value=cell.value;
  if(cell.isMerged){issue(sheet,where,'No combine celdas en los campos de importación.');return '';}
  if(value===null||value===undefined)result='';
  else if(typeof value==='string')result=value.trim();
  else if(allowNumber&&typeof value==='number'&&Number.isFinite(value))result=String(value);
  else if(typeof value==='object'&&'richText' in value)result=value.richText.map(p=>p.text).join('').trim();
  else if(typeof value==='object'&&'hyperlink' in value){const label=String(value.text||'').trim(),url=String(value.hyperlink||'').trim();result=sheet==='Ficha'&&where==='B9'&&url&&url!==label?`${label} (${url})`:label||url;}
  else if(typeof value==='object'&&('formula' in value||'sharedFormula' in value)){issue(sheet,where,'No se admiten fórmulas, aunque tengan un resultado guardado. Pegue solo el texto.');return '';}
  else{issue(sheet,where,'Escriba texto en esta celda; no use números, fechas ni errores de Excel.');return '';}
  if(required&&!result)issue(sheet,where,'Este campo es obligatorio.');
  if(result.length>max)issue(sheet,where,`El texto supera el máximo de ${max} caracteres.`);
  return result;
 }
 const ficha=workbook.getWorksheet('Ficha'),sheet=workbook.getWorksheet('Preguntas');
 for(const [name,s]of [['Ficha',ficha],['Preguntas',sheet]] as const){if(!s)issue(name,'A1',`Falta la hoja ${name}. Use la plantilla de Ágora.`);else if(s.state!=='visible')issue(name,'A1','La hoja debe estar visible para revisar su contenido.');}
 for(const s of workbook.worksheets)if(!['Ficha','Preguntas'].includes(s.name))issue(s.name,'A1','El archivo debe contener únicamente las hojas Ficha y Preguntas.');
 let name='';const metadata:ImportMetadata={edition:'',description:'',reference:'',language:'es'};
 if(ficha){
  const fields=[['Nombre',200,true],['Edición',80,true],['Descripción',2000,false],['Documento de referencia',2000,false],['Idioma',10,true],['Formato',40,true]] as const;
  const values=fields.map(([label,max,required],i)=>{
   const row=i+6;if(normalized(read(ficha.getCell(row,1),true,100))!==normalized(label))issue('Ficha',`A${row}`,`Mantenga la etiqueta «${label}» en esta fila.`);
   if(ficha.getRow(row).hidden||ficha.getColumn(2).hidden)issue('Ficha',`B${row}`,'Los campos importados deben estar visibles.');
   return read(ficha.getCell(row,2),required,max,i===1);
  });
  name=values[0];metadata.edition=values[1];metadata.description=values[2];metadata.reference=values[3];metadata.language=values[4].toLowerCase();
  if(metadata.language!=='es')issue('Ficha','B10','Esta versión de la plantilla admite el idioma es.');
  if(values[5]!=='AGORA-INSTRUMENTO-1')issue('Ficha','B11','Conserve el formato AGORA-INSTRUMENTO-1.');
 }
 const questions:ImportQuestion[]=[];
 if(sheet){
  const headers=['Código','Área','Dominio','Pregunta','Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5'];
  headers.forEach((header,i)=>{
   if(normalized(read(sheet.getCell(5,i+1),true,100))!==normalized(header))issue('Preguntas',`${String.fromCharCode(65+i)}5`,`La columna debe llamarse «${header}».`);
   if(sheet.getColumn(i+1).hidden)issue('Preguntas',`${String.fromCharCode(65+i)}5`,'No oculte columnas del instrumento.');
  });
  if(sheet.getRow(5).hidden)issue('Preguntas','A5','La fila de encabezados debe estar visible.');
  if(sheet.rowCount>2005)issue('Preguntas','A6','Elimine las filas sobrantes; se admiten hasta 200 preguntas y 2000 filas de preparación.');
  const codes=new Set<string>();
  for(let r=6;r<=Math.min(sheet.rowCount,2005);r++){
   const row=sheet.getRow(r);let populated=false;
   row.eachCell(cell=>{const v=cell.value;if(v!==null&&v!==undefined&&(typeof v!=='string'||!!v.trim()))populated=true;});
   if(!populated)continue;
   if(questions.length>=200){issue('Preguntas',`A${r}`,'Se admiten como máximo 200 preguntas.');break;}
   row.eachCell((cell,col)=>{if(col>9&&cell.value!==null)issue('Preguntas',cell.address,'No añada columnas de datos fuera de Código a Nivel 5.');});
   if(row.hidden)issue('Preguntas',`A${r}`,'Esta pregunta está oculta. Muestre la fila para importarla.');
   const code=read(row.getCell(1),true,80);
   if(code&&!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/.test(code))issue('Preguntas',`A${r}`,'Use un código de letras, números, punto, guion o guion bajo, sin espacios.');
   const key=code.toUpperCase();if(key&&codes.has(key))issue('Preguntas',`A${r}`,'Código repetido; no se distinguen mayúsculas de minúsculas.');codes.add(key);
   questions.push({code,row:r,area:read(row.getCell(2),true,200),domain:read(row.getCell(3),true,200),text:read(row.getCell(4),true,10000),levels:[1,2,3,4,5].map(value=>({value,text:read(row.getCell(value+4),true,10000)}))});
  }
  sheet.getRow(5).eachCell((cell,col)=>{if(col>9&&cell.value!==null)issue('Preguntas',cell.address,'No cambie la escala ni añada columnas a la plantilla.');});
  if(!questions.length)issue('Preguntas','A6','Añada al menos una pregunta con sus cinco descriptores desde la fila 6.');
 }
 const contentBytes=Buffer.byteLength(JSON.stringify({name,metadata,questions}),'utf8');
 if(contentBytes>3*1024*1024)issue('Preguntas','A6','El contenido completo del instrumento supera 3 MiB. Reduzca el texto antes de importar para poder editarlo después.');
 return {fileName:safeName,fileHash:createHash('sha256').update(bytes).digest('hex'),name,metadata,questions,errors,warnings,canImport:errors.length===0};
}
