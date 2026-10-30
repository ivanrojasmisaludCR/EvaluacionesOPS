import type {DatabaseSync} from 'node:sqlite';
import type {Instrument,Question} from './catalog.ts';
import {summarizeResults,type ResultsSummary} from './results.ts';
import {fail} from './errors.ts';
export type ReportConsensus={level:number;justification:string;author:string;createdAt:string};
export type ReportQuestion=Question&{phase:string;round:number;responseCount:number;distribution:number[]|null;consensus:ReportConsensus|null};
export type WorkshopReport={code:string;generatedAt:string;workshop:{pais:string;institucion:string;fecha:string;alcance:string;facilitador:string};instrument:{id:string;name:string;version:string;edition:string};participantCount:number;results:ResultsSummary;questions:ReportQuestion[]};
export function readReport(db:DatabaseSync,code:string):WorkshopReport{
 db.exec('BEGIN');
 try{
  const w=db.prepare('SELECT * FROM workshops WHERE code=?').get(code) as any;
  if(!w)fail(404,'SALA_NO_EXISTE','No se encontró esa sala.');
  const instrument:Instrument=JSON.parse(w.instrument);
  const rounds=db.prepare('SELECT id,question_id,number,phase FROM rounds WHERE workshop_id=? AND number=1').all(w.id) as any[];
  const agreed=db.prepare(`SELECT r.question_id,c.level,c.justification,c.author,c.created_at AS createdAt FROM rounds r JOIN consensuses c ON c.round_id=r.id
   WHERE r.workshop_id=? AND r.number=1 AND c.rowid=(SELECT MAX(last.rowid) FROM consensuses last WHERE last.round_id=r.id)`).all(w.id) as (ReportConsensus&{question_id:string})[];
  const votes=db.prepare(`SELECT r.question_id,s.value,COUNT(*) AS n FROM rounds r JOIN current_votes v ON v.round_id=r.id JOIN submissions s ON s.id=v.submission_id
   WHERE r.workshop_id=? AND r.number=1 GROUP BY r.question_id,s.value`).all(w.id) as {question_id:string;value:number;n:number}[];
  const questions:ReportQuestion[]=instrument.questions.map(q=>{
   const round=rounds.find(r=>r.question_id===q.id)!;
   const visible=['cerrado','discusion','consenso'].includes(round.phase);
   const distribution=visible?[1,2,3,4,5].map(value=>votes.find(v=>v.question_id===q.id&&v.value===value)?.n||0):null;
   const c=agreed.find(c=>c.question_id===q.id);
   return {...q,phase:round.phase,round:round.number,responseCount:votes.filter(v=>v.question_id===q.id).reduce((n,v)=>n+v.n,0),distribution,consensus:c?{level:c.level,justification:c.justification,author:c.author,createdAt:c.createdAt}:null};
  });
  const results=summarizeResults(instrument.questions,new Map(agreed.map(c=>[c.question_id,c.level])));
  results.lastConsensusAt=agreed.map(c=>c.createdAt).sort().at(-1)||null;
  const report:WorkshopReport={code,generatedAt:new Date().toISOString(),workshop:{pais:w.pais,institucion:w.institucion,fecha:w.fecha,alcance:w.alcance,facilitador:w.facilitador},instrument:{id:instrument.id,name:instrument.name,version:instrument.version,edition:instrument.metadata?.edition||''},participantCount:(db.prepare('SELECT COUNT(*) AS n FROM participants WHERE workshop_id=?').get(w.id) as any).n,results,questions};
  db.exec('COMMIT');return report;
 }catch(e){db.exec('ROLLBACK');throw e;}
}
