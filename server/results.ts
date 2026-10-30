import {groupResults,type QuestionGroup} from './groups.ts';
type ResultQuestion={id:string;area:string;domain:string};
export type DomainResult=QuestionGroup&{sum:number;currentAverage:number|null;currentScore:number|null};
export type AreaResult={id:string;area:string;domains:string[];totalQuestions:number;completedQuestions:number;totalDomains:number;completedDomains:number;domainsWithResults:number;consensusSum:number;currentScore:number|null;complete:boolean};
export type ResultsSummary={totalQuestions:number;completedQuestions:number;totalDomains:number;completedDomains:number;totalAreas:number;completedAreas:number;consensusSum:number;complete:boolean;lastConsensusAt:string|null;domains:DomainResult[];areas:AreaResult[]};
// Scores are positive integers; round the integer ratio to avoid floating point ties.
const roundRatio=(sum:number,count:number,decimals=0)=>Math.floor((2*sum*10**decimals+count)/(2*count))/10**decimals;
export function summarizeResults(questions:readonly ResultQuestion[],consensuses:ReadonlyMap<string,number>):ResultsSummary{
 const domains:DomainResult[]=groupResults(questions,consensuses).map(group=>{
  const sum=group.questionIds.reduce((total,id)=>total+(consensuses.get(id)??0),0);
  return {...group,sum,currentAverage:group.completed?sum/group.completed:null,currentScore:group.completed?roundRatio(sum,group.completed):null};
 });
 const areaMap=new Map<string,DomainResult[]>();
 for(const domain of domains){const entries=areaMap.get(domain.area)||[];entries.push(domain);areaMap.set(domain.area,entries);}
 const areas:AreaResult[]=[...areaMap.entries()].map(([area,entries])=>{
  const values=entries.filter(d=>d.currentScore!==null);
  const totalQuestions=entries.reduce((n,d)=>n+d.total,0),completedQuestions=entries.reduce((n,d)=>n+d.completed,0);
  return {id:area,area,domains:entries.map(d=>d.id),totalQuestions,completedQuestions,totalDomains:entries.length,completedDomains:entries.filter(d=>d.complete).length,domainsWithResults:values.length,consensusSum:entries.reduce((n,d)=>n+d.sum,0),currentScore:values.length?roundRatio(values.reduce((n,d)=>n+d.currentScore!,0),values.length,1):null,complete:completedQuestions===totalQuestions};
 });
 const completedQuestions=domains.reduce((n,d)=>n+d.completed,0);
 return {totalQuestions:questions.length,completedQuestions,totalDomains:domains.length,completedDomains:domains.filter(d=>d.complete).length,totalAreas:areas.length,completedAreas:areas.filter(a=>a.complete).length,consensusSum:areas.reduce((n,a)=>n+a.consensusSum,0),complete:questions.length>0&&completedQuestions===questions.length,lastConsensusAt:null,domains,areas};
}
