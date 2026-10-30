import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
export const templatePath=new URL('../../public/templates/plantilla-instrumentos-agora.xlsx',import.meta.url);
export async function sampleWorkbook(){
 const w=new ExcelJS.Workbook();await w.xlsx.load(readFileSync(templatePath) as any);
 const f=w.getWorksheet('Ficha')!;f.getCell('B6').value='Evaluación de ejemplo';f.getCell('B7').value='2027';f.getCell('B8').value='Instrumento de prueba';f.getCell('B9').value='Documento de referencia del equipo';
 const p=w.getWorksheet('Preguntas')!;
 for(const [i,code]of ['DAT.001','DAT.002'].entries())p.getRow(6+i).values=[code,'Datos','Gobernanza',`Pregunta ${i+1}`,...[1,2,3,4,5].map(n=>`Descriptor ${n} de la pregunta ${i+1}`)];
 return w;
}
export async function xlsxBytes(w:ExcelJS.Workbook){return Buffer.from(await w.xlsx.writeBuffer());}
export async function sampleBytes(){return xlsxBytes(await sampleWorkbook());}
