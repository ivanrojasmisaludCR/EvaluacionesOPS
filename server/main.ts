import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp, lanAddresses } from './app.ts';
import { randomUUID } from 'node:crypto';
import { TunnelManager } from './tunnel.ts';
const directory=resolve(process.env.AGORA_DATA_DIR||'data');mkdirSync(directory,{recursive:true,mode:0o700});
const port=Number(process.env.PORT||3000);
const password=process.env.AGORA_ADMIN_PASSWORD||'';
if(password.length<12){console.error('Configure AGORA_ADMIN_PASSWORD (mínimo 12 caracteres). Para preparar acceso local ejecute npm run prepare:local.');process.exit(1);}
const connection=process.env.AGORA_TUNNEL_ENABLED==='true'?new TunnelManager({origin:`http://127.0.0.1:${port}`,instanceId:randomUUID(),binary:process.env.AGORA_CLOUDFLARED_PATH}):undefined;
const app=createApp({dbPath:resolve(directory,'agora.sqlite'),password,publicUrl:process.env.AGORA_PUBLIC_URL,port,connection,container:process.env.AGORA_CONTAINER==='true'});
await app.start(port,process.env.HOST||'0.0.0.0');
console.log(`Ágora E1: http://localhost:${port}`);
console.log('Direcciones posibles para el teléfono:',lanAddresses(port).join(', ')||'No se detectó una interfaz LAN.');
console.log('Facilitador: contraseña en la configuración local .env.');
let closing=false;
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,async()=>{if(closing)return;closing=true;await app.close();process.exit(0);});
