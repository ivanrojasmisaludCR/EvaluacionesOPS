export class Problem extends Error {
 status:number;
 code:string;
 constructor(status:number,code:string,message:string){super(message);this.status=status;this.code=code;}
}
export const fail=(status:number,code:string,message:string):never=>{throw new Problem(status,code,message);};
export function text(value:unknown,name:string,max=200):string {
 if(typeof value!=='string'||!value.trim()||value.length>max)return fail(400,'VALIDACION',`${name}: campo obligatorio (máximo ${max} caracteres).`);
 return value.trim();
}
