import {useId} from 'react';
export type RadarAxis={id:string;label:string;value:number|null;complete:boolean};
function labelLines(label:string){
 const words=label.split(/\s+/);const lines:string[]=[];let line='';
 for(const raw of words){const word=raw.length>16?raw.slice(0,15)+'…':raw;if(line&&(line+' '+word).length>16){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
 if(line)lines.push(line);return lines.length>3?[...lines.slice(0,2),lines[2].slice(0,16)+'…']:lines;
}
export function Radar({title,axes}:{title:string;axes:RadarAxis[]}){
 const id=useId(),format=(value:number)=>value.toLocaleString('es-CR',{maximumFractionDigits:1});
 const hasData=axes.some(a=>a.value!==null);
 if(axes.length<3||axes.length>12)return <figure className="results-chart"><figcaption>{title}</figcaption><p className="muted">{axes.length===1?'Este resumen contiene un solo eje.':'Comparación de los ejes disponibles.'}</p><div className="results-bars">{axes.map(a=><div key={a.id}><span>{a.label}</span>{a.value===null?<small>Sin consensos</small>:<><progress value={a.value} max={5} aria-label={`${a.label}: nivel ${format(a.value)}${a.complete?'':' parcial'}`}/><strong>{format(a.value)}</strong></>}</div>)}</div></figure>;
 const width=axes.some(a=>a.label.length>24)?640:560,cx=width/2,cy=246,radius=145;
 const point=(i:number,scale:number)=>{const angle=-Math.PI/2+i*2*Math.PI/axes.length;return [cx+Math.cos(angle)*radius*scale,cy+Math.sin(angle)*radius*scale];};
 const position=(p:number[])=>p.map(n=>n.toFixed(2)).join(',');
 const completePolygon=axes.every(a=>a.value!==null);
 const missing=axes.filter(a=>a.value===null);
 return <figure className="results-chart"><figcaption>{title}</figcaption><svg viewBox={`0 0 ${width} 500`} role="img" aria-labelledby={id+'-title'} aria-describedby={id+'-description'}>
  <title id={id+'-title'}>{title}</title><desc id={id+'-description'}>{axes.map(a=>`${a.label}: ${a.value===null?'sin consensos':`nivel ${format(a.value)}${a.complete?'':' parcial'}`}`).join('. ')}</desc>
  {[1,2,3,4,5].map(level=><g key={level}><polygon points={axes.map((_,i)=>position(point(i,level/5))).join(' ')} fill="none" stroke="#d5e2ed"/><text x={cx+6} y={cy-radius*level/5+5} className="radar-tick">{level}</text></g>)}
  {axes.map((a,i)=>{const end=point(i,1),label=point(i,1.28),lines=labelLines(a.label);return <g key={a.id}><line x1={cx} y1={cy} x2={end[0]} y2={end[1]} stroke="#d5e2ed"/><text x={label[0]} y={label[1]} textAnchor={Math.abs(label[0]-cx)<5?'middle':label[0]>cx?'start':'end'} className="radar-label"><title>{a.label}</title>{lines.map((line,j)=><tspan x={label[0]} dy={j===0?-(lines.length-1)*7:15} key={j}>{line}</tspan>)}</text></g>;})}
  {completePolygon&&hasData&&<polygon points={axes.map((a,i)=>position(point(i,a.value!/5))).join(' ')} fill="#0076c822" stroke="#0076c8" strokeWidth="2.5"/>}
  {!completePolygon&&axes.map((a,i)=>{const next=(i+1)%axes.length;if(a.value===null||axes[next].value===null)return null;const p=point(i,a.value/5),q=point(next,axes[next].value!/5);return <line key={a.id} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#0076c8" strokeWidth="2.5" strokeDasharray="6 4"/>;})}
  {axes.map((a,i)=>{if(a.value===null)return null;const p=point(i,a.value/5);return <circle key={a.id} cx={p[0]} cy={p[1]} r={5} fill={a.complete?'#0076c8':'#fff'} stroke="#0076c8" strokeWidth="2.5"><title>{`${a.label}: ${format(a.value)}${a.complete?'':' · parcial'}`}</title></circle>;})}
 </svg><p className="radar-key"><span>● Con todos los consensos</span><span>○ Con avance parcial</span></p>{missing.length>0&&<p className="muted radar-missing">Ejes sin consensos: {missing.map(a=>a.label).join(', ')}. No se representan como cero.</p>}</figure>;
}
