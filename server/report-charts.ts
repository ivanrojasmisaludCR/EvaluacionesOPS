import {Resvg} from '@resvg/resvg-js';
import {fileURLToPath} from 'node:url';
import type {WorkshopReport} from './report-data.ts';
export const reportFonts={regular:fileURLToPath(new URL('./assets/fonts/LiberationSans-Regular.ttf',import.meta.url)),bold:fileURLToPath(new URL('./assets/fonts/LiberationSans-Bold.ttf',import.meta.url))};
type Axis={label:string;value:number|null;complete:boolean};
export type ReportChart={title:string;png:Buffer;width:number;height:number};
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function lines(text:string,max=72):string[]{
 const out:string[]=[];let row='';
 for(const word of text.split(/\s+/)){if(row.length+word.length+1>max&&row){out.push(row);row='';}for(let i=0;i<word.length;i+=max){const chunk=word.slice(i,i+max);if(i){if(row)out.push(row);row=chunk;}else row+=(row?' ':'')+chunk;}}
 if(row)out.push(row);return out;
}
function render(title:string,axes:Axis[],radar:boolean):ReportChart{
 const width=900;let y=36;const parts:string[]=[];
 const text=(value:string,x:number,top:number,size=18,color='#15324c',anchor='start')=>parts.push(`<text x="${x}" y="${top}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escape(value)}</text>`);
 for(const line of lines(title,65)){text(line,30,y,23);y+=28;}
 text('Escala 1 a 5 · puntos huecos = parcial · pendiente sin valor',30,y,16);y+=28;
 if(radar){
  const cx=450,cy=y+190,r=160;
  const point=(i:number,n:number)=>{const angle=-Math.PI/2+i*Math.PI*2/axes.length;return [cx+Math.cos(angle)*r*n,cy+Math.sin(angle)*r*n];};
  const p=(v:number[])=>v.map(n=>n.toFixed(2)).join(',');
  for(let level=1;level<=5;level++){parts.push(`<polygon points="${axes.map((_,i)=>p(point(i,level/5))).join(' ')}" fill="none" stroke="#cadce9"/>`);text(String(level),cx+8,cy-r*level/5+5,15);}
  axes.forEach((axis,i)=>{const [x,z]=point(i,1),label=point(i,1.16);parts.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${z}" stroke="#cadce9"/>`);text(String(i+1),label[0],label[1]+5,20,'#15324c','middle');});
  if(axes.every(a=>a.value!==null))parts.push(`<polygon points="${axes.map((a,i)=>p(point(i,a.value!/5))).join(' ')}" fill="#0076c822" stroke="#0076c8" stroke-width="3"/>`);
  else axes.forEach((axis,i)=>{const next=axes[(i+1)%axes.length];if(axis.value===null||next.value===null)return;const a=point(i,axis.value/5),b=point((i+1)%axes.length,next.value/5);parts.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#0076c8" stroke-width="3" stroke-dasharray="6 4"/>`);});
  axes.forEach((a,i)=>{if(a.value===null)return;const [x,z]=point(i,a.value/5);parts.push(`<circle cx="${x}" cy="${z}" r="6" fill="${a.complete?'#0076c8':'white'}" stroke="#0076c8" stroke-width="3"/>`);});
  y=cy+215;
 }else{
  axes.forEach((a,i)=>{text(String(i+1),35,y+20,19);parts.push(`<rect x="75" y="${y}" width="650" height="23" rx="5" fill="#e7eff5"/>`);if(a.value!==null)parts.push(`<rect x="75" y="${y}" width="${650*a.value/5}" height="23" rx="5" fill="${a.complete?'#0076c8':'#37a7b8'}"/>`);text(a.value===null?'Pendiente':a.value.toFixed(1),745,y+19,17);y+=38;});y+=12;
 }
 axes.forEach((axis,i)=>{const label=`${i+1}. ${axis.label} - ${axis.value===null?'Pendiente':axis.value.toLocaleString('es-CR',{maximumFractionDigits:1})+(axis.complete?' · Completo':' · Parcial')}`;for(const line of lines(label,82)){text(line,30,y,18);y+=23;}y+=5;});
 const height=y+15;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="Liberation Sans">${parts.join('')}</g></svg>`;
 const png=Buffer.from(new Resvg(svg,{font:{fontFiles:[reportFonts.regular,reportFonts.bold],loadSystemFonts:false,defaultFontFamily:'Liberation Sans'}}).render().asPng());
 return {title,png,width,height};
}
export function reportCharts(report:WorkshopReport):ReportChart[]{
 const charts:ReportChart[]=[];
 const add=(title:string,axes:Axis[])=>{const radar=axes.length>=3&&axes.length<=12;for(let i=0;i<axes.length;i+=8){const subset=axes.slice(i,i+8);charts.push(render(title+(axes.length>8?` (${i+1}-${i+subset.length})`:''),subset,radar&&subset.length>=3));}};
 add('Perfil por área',report.results.areas.map(a=>({label:a.area,value:a.currentScore,complete:a.complete})));
 for(const area of report.results.areas)add('Dominios de '+area.area,report.results.domains.filter(d=>d.area===area.area).map(d=>({label:d.domain,value:d.currentScore,complete:d.complete})));
 return charts;
}
