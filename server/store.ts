import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { groupResults } from './groups.ts';
import { summarizeResults } from './results.ts';
import { readReport } from './report-data.ts';

import { fail, text } from './errors.ts';
export { Problem, fail, text } from './errors.ts';
import { Catalog, type Instrument, type Question } from './catalog.ts';
export type { Instrument, Question } from './catalog.ts';
export const secret=()=>randomBytes(32).toString('base64url');
export const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
function level(v:unknown) {if(typeof v!=='number'||!Number.isInteger(v)||v<1||v>5) fail(400,'NIVEL_INVALIDO','El nivel debe ser un entero de 1 a 5.');return v as number;}
export type Identity={role:'admin'|'participant'|'projector';token?:string};
export type WorkshopInput={pais:string;institucion:string;fecha:string;alcance:string;facilitador:string;instrumentVersionId?:string};
export type VoteInput={questionId:string;round:number;value:number;requestId:string};
export type ConsensusInput={questionId:string;level:unknown;justification:string};
type Workshop=WorkshopInput & {id:string;code:string;active_question:string;instrument:string;projection_token:string;created_at:string};
type Round={id:string;phase:string;question_id:string;number:number};
export class Store {
 db:DatabaseSync;
 instrument:Instrument;
 catalog:Catalog;
 constructor(path:string) {
  this.instrument=JSON.parse(readFileSync(new URL('../instruments/piloto.json',import.meta.url),'utf8'));
  for(const q of this.instrument.questions) {
   if(q.levels.length!==5||q.levels.some((l,i)=>l.value!==i+1||!l.text.trim())) fail(500,'INSTRUMENTO_INVALIDO','Instrumento sin los cinco descriptores obligatorios.');
  }
  this.db=new DatabaseSync(path);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;`);
  const version=(this.db.prepare('PRAGMA user_version').get() as any).user_version;
  if(version>3) {this.db.close();throw new Error('Base de datos de una versión posterior.');}
  if(version===0)this.db.exec(`
   CREATE TABLE IF NOT EXISTS workshops(id TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL,pais TEXT NOT NULL,institucion TEXT NOT NULL,fecha TEXT NOT NULL,alcance TEXT NOT NULL,facilitador TEXT NOT NULL,active_question TEXT NOT NULL,instrument TEXT NOT NULL,projection_token TEXT NOT NULL,created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS rounds(id TEXT PRIMARY KEY,workshop_id TEXT NOT NULL REFERENCES workshops(id),question_id TEXT NOT NULL,number INTEGER NOT NULL DEFAULT 1,phase TEXT NOT NULL,UNIQUE(workshop_id,question_id,number));
   CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY,workshop_id TEXT NOT NULL REFERENCES workshops(id),token_hash TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS submissions(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,round_id TEXT NOT NULL REFERENCES rounds(id),participant_id TEXT NOT NULL REFERENCES participants(id),request_id TEXT NOT NULL,value INTEGER NOT NULL CHECK(value BETWEEN 1 AND 5),received_at TEXT NOT NULL,UNIQUE(participant_id,request_id));
   CREATE TABLE IF NOT EXISTS current_votes(round_id TEXT NOT NULL REFERENCES rounds(id),participant_id TEXT NOT NULL REFERENCES participants(id),submission_id TEXT NOT NULL REFERENCES submissions(id),PRIMARY KEY(round_id,participant_id));
   CREATE TABLE IF NOT EXISTS consensuses(id TEXT PRIMARY KEY,round_id TEXT NOT NULL REFERENCES rounds(id),level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5),justification TEXT NOT NULL,author TEXT NOT NULL,created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS admin_sessions(token_hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   PRAGMA user_version=1;
  `);
  this.catalog=new Catalog(this.db,this.instrument);
 }
 close(){this.db.close();}
 transaction<T>(f:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const result=f();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 workshop(code:string):Workshop {return this.db.prepare('SELECT * FROM workshops WHERE code=?').get(code) as Workshop||fail(404,'SALA_NO_EXISTE','No se encontró esa sala.');}
 round(w:Workshop):Round {return this.db.prepare('SELECT * FROM rounds WHERE workshop_id=? AND question_id=? AND number=1').get(w.id,w.active_question) as Round;}
 participant(w:Workshop,token?:string):any {if(!token) return fail(403,'CREDENCIAL_INVALIDA','Credencial de participante requerida.');return this.db.prepare('SELECT id FROM participants WHERE workshop_id=? AND token_hash=?').get(w.id,hash(token))||fail(403,'CREDENCIAL_INVALIDA','Credencial no válida para esta sala.');}
 authorize(code:string,who:Identity) {const w=this.workshop(code);if(who.role==='participant')this.participant(w,who.token);else if(who.role==='projector'&&who.token!==w.projection_token)fail(403,'CREDENCIAL_INVALIDA','Credencial de proyección no válida.');return w;}
 createWorkshop(input:WorkshopInput) {
  const ficha:WorkshopInput={pais:text(input.pais,'País'),institucion:text(input.institucion,'Institución'),fecha:text(input.fecha,'Fecha',10),alcance:text(input.alcance,'Alcance',1000),facilitador:text(input.facilitador,'Facilitador')};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(ficha.fecha)||!Number.isFinite(Date.parse(ficha.fecha))||new Date(ficha.fecha).toISOString().slice(0,10)!==ficha.fecha)fail(400,'FECHA_INVALIDA','Fecha no válida.');
  return this.transaction(()=>{
   const id=randomUUID();let code:string;
   do {code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(this.db.prepare('SELECT id FROM workshops WHERE code=?').get(code));
   const chosen=this.catalog.get(input.instrumentVersionId===undefined?this.catalog.defaultVersionId:text(input.instrumentVersionId,'Versión del instrumento',120));
   if(chosen.status!=='published')fail(409,'VERSION_NO_PUBLICADA','El taller requiere una versión publicada del instrumento.');
   const instrument=chosen.instrument;
   const active=instrument.questions[0].id;
   this.db.prepare('INSERT INTO workshops VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,code,ficha.pais,ficha.institucion,ficha.fecha,ficha.alcance,ficha.facilitador,active,JSON.stringify(instrument),secret(),new Date().toISOString());
   for(const q of instrument.questions)this.db.prepare('INSERT INTO rounds VALUES(?,?,?,?,?)').run(randomUUID(),id,q.id,1,'preparacion');
   return {id,code};
  });
 }
 list(){return this.db.prepare('SELECT code,institucion,pais,fecha,facilitador FROM workshops ORDER BY created_at DESC').all();}
 join(code:string,existing?:string) {
  const w=this.workshop(code);
  if(existing){this.participant(w,existing);return {token:existing};}
  const token=secret();this.db.prepare('INSERT INTO participants VALUES(?,?,?,?)').run(randomUUID(),w.id,hash(token),new Date().toISOString());return {token};
 }
 transition(code:string,action:string,questionId?:string) {
  return this.transaction(()=>{
   const w=this.workshop(code);const r=this.round(w);
   if(action==='select') {
    const inst:Instrument=JSON.parse(w.instrument);
    if(!inst.questions.some(q=>q.id===questionId))fail(400,'PREGUNTA_INVALIDA','Pregunta inexistente.');
    if(questionId!==w.active_question&&r.phase!=='consenso')fail(409,'CONSENSO_REQUERIDO','Registre el consenso antes de cambiar de pregunta.');
    this.db.prepare('UPDATE workshops SET active_question=? WHERE id=?').run(questionId!,w.id);return;
   }
   const next:Record<string,[string,string]>={open:['preparacion','votacion-abierta'],close:['votacion-abierta','cerrado'],discuss:['cerrado','discusion']};
   const step=next[action];if(!step||r.phase!==step[0])fail(409,'TRANSICION_INVALIDA','Transición no permitida para el estado actual.');
   this.db.prepare('UPDATE rounds SET phase=? WHERE id=?').run(step[1],r.id);
  });
 }
 vote(code:string,token:string,input:VoteInput) {
  return this.transaction(()=>{
   const w=this.workshop(code),p=this.participant(w,token);level(input.value);
   const requestId=text(input.requestId,'Identificador de envío',80);
   if(!/^[a-zA-Z0-9_-]{8,80}$/.test(requestId))fail(400,'ENVIO_INVALIDO','Identificador de envío no válido.');
   const previous=this.db.prepare('SELECT s.*,r.question_id,r.number FROM submissions s JOIN rounds r ON r.id=s.round_id WHERE participant_id=? AND request_id=?').get(p.id,requestId) as any;
   if(previous) {
    if(previous.question_id!==input.questionId||previous.number!==input.round||previous.value!==input.value)fail(409,'IDEMPOTENCIA_CONFLICTO','El identificador de envío ya tiene otro contenido.');
    return {voteId:previous.id,received:true,value:previous.value,receivedAt:previous.received_at};
   }
   const r=this.round(w);
   if(input.questionId!==w.active_question||input.round!==r.number)fail(409,'RONDA_DESACTUALIZADA','La pregunta o ronda ya cambió. Actualice la sala.');
   if(r.phase!=='votacion-abierta')fail(409,'RONDA_CERRADA','La votación está cerrada.');
   const voteId=randomUUID(),receivedAt=new Date().toISOString();
   this.db.prepare('INSERT INTO submissions(id,round_id,participant_id,request_id,value,received_at) VALUES(?,?,?,?,?,?)').run(voteId,r.id,p.id,requestId,input.value,receivedAt);
   this.db.prepare('INSERT INTO current_votes VALUES(?,?,?) ON CONFLICT(round_id,participant_id) DO UPDATE SET submission_id=excluded.submission_id').run(r.id,p.id,voteId);
   return {voteId,received:true,value:input.value,receivedAt};
  });
 }
 consensus(code:string,input:ConsensusInput,author:string) {
  return this.transaction(()=>{
   const w=this.workshop(code),r=this.round(w);
   if(input.questionId!==w.active_question)fail(409,'RONDA_DESACTUALIZADA','La pregunta ya cambió.');
   if(r.phase!=='discusion')fail(409,'DISCUSION_REQUERIDA','Abra la discusión antes de registrar el consenso.');
   const v=level(input.level),justification=text(input.justification,'Justificación',10000);
   this.db.prepare('INSERT INTO consensuses VALUES(?,?,?,?,?,?)').run(randomUUID(),r.id,v,justification,author,new Date().toISOString());
   this.db.prepare("UPDATE rounds SET phase='consenso' WHERE id=?").run(r.id);
  });
 }
 state(code:string,who:Identity):any {
  const w=this.authorize(code,who),r=this.round(w),inst:Instrument=JSON.parse(w.instrument);
  const votes=this.db.prepare('SELECT s.value FROM current_votes c JOIN submissions s ON s.id=c.submission_id WHERE c.round_id=?').all(r.id) as {value:number}[];
  const participantCount=(this.db.prepare('SELECT COUNT(*) AS n FROM participants WHERE workshop_id=?').get(w.id) as any).n;
  const consensus=this.db.prepare('SELECT level,justification,author,created_at AS createdAt FROM consensuses WHERE round_id=? ORDER BY rowid DESC LIMIT 1').get(r.id)||null;
  let ownVote=null;
  const agreed=this.db.prepare(`SELECT r.question_id,c.level,c.created_at AS createdAt FROM rounds r JOIN consensuses c ON c.round_id=r.id
   WHERE r.workshop_id=? AND r.number=1 AND c.rowid=(SELECT MAX(latest.rowid) FROM consensuses latest WHERE latest.round_id=r.id)`).all(w.id) as {question_id:string;level:number;createdAt:string}[];
  const groups=groupResults(inst.questions,new Map(agreed.map(c=>[c.question_id,c.level])));
  const results=summarizeResults(inst.questions,new Map(agreed.map(c=>[c.question_id,c.level])));
  results.lastConsensusAt=agreed.map(c=>c.createdAt).sort().at(-1)||null;
  if(who.role==='participant') {
   const p=this.participant(w,who.token);
   ownVote=this.db.prepare('SELECT s.value,s.id AS voteId,s.received_at AS receivedAt FROM current_votes c JOIN submissions s ON s.id=c.submission_id WHERE c.round_id=? AND c.participant_id=?').get(r.id,p.id)||null;
  }
  return {groups,results,code:w.code,id:w.id,workshop:{pais:w.pais,institucion:w.institucion,fecha:w.fecha,alcance:w.alcance,facilitador:w.facilitador},instrument:{id:inst.id,version:inst.version,name:inst.name,partial:inst.partial,...(inst.metadata?{edition:inst.metadata.edition}:{})},question:inst.questions.find(q=>q.id===w.active_question),questions:inst.questions.map(q=>({id:q.id,number:q.number,text:q.text,phase:(this.db.prepare('SELECT phase FROM rounds WHERE workshop_id=? AND question_id=?').get(w.id,q.id) as any).phase})),phase:r.phase,round:r.number,participantCount,responseCount:votes.length,consensus,ownVote,...(['cerrado','discusion','consenso'].includes(r.phase)?{distribution:[1,2,3,4,5].map(n=>votes.filter(v=>v.value===n).length)}:{}),...(who.role==='admin'?{projectionToken:w.projection_token}:{})};
 }
 report(code:string){return readReport(this.db,code);}
 history(code:string){const w=this.workshop(code);return this.db.prepare('SELECT s.value,s.request_id AS requestId,s.received_at AS receivedAt FROM submissions s JOIN rounds r ON r.id=s.round_id WHERE r.workshop_id=? ORDER BY s.seq').all(w.id);}
 issueAdmin(){const token=secret();this.db.prepare('DELETE FROM admin_sessions WHERE expires<?').run(Date.now());this.db.prepare('INSERT INTO admin_sessions VALUES(?,?)').run(hash(token),Date.now()+12*60*60*1000);return token;}
 adminValid(token?:string){return !!(token&&this.db.prepare('SELECT 1 FROM admin_sessions WHERE token_hash=? AND expires>?').get(hash(token),Date.now()));}
 logout(token:string){this.db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(hash(token));}
 setting(key:string){return (this.db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any)?.value as string|undefined;}
 setSetting(key:string,value:string){this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value);}
}
