type GroupQuestion={id:string;area:string;domain:string};
export type QuestionGroup={id:string;area:string;domain:string;questionIds:string[];total:number;completed:number;complete:boolean;average:number|null;score:number|null};
// Membership uses the immutable workshop snapshot, not the live catalog.
export function groupResults(questions:readonly GroupQuestion[],consensuses:ReadonlyMap<string,number>):QuestionGroup[]{
 const groups=new Map<string,QuestionGroup>();
 for(const q of questions){
  const id=JSON.stringify([q.area,q.domain]);
  let group=groups.get(id);
  if(!group){group={id,area:q.area,domain:q.domain,questionIds:[],total:0,completed:0,complete:false,average:null,score:null};groups.set(id,group);}
  group.questionIds.push(q.id);group.total++;
 }
 return [...groups.values()].map(group=>{
  const values=group.questionIds.map(id=>consensuses.get(id)).filter((v):v is number=>v!==undefined);
  group.completed=values.length;group.complete=group.completed===group.total;
  if(group.complete){group.average=values.reduce((sum,v)=>sum+v,0)/group.total;group.score=Math.round(group.average);}
  return group;
 });
}
