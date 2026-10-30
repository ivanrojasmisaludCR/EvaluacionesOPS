import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
if (!existsSync('.env')) {
 writeFileSync('.env',`AGORA_ADMIN_PASSWORD=${randomBytes(18).toString('base64url')}\nPORT=3000\n`,{mode:0o600,flag:'wx'});
 console.log('Acceso local preparado. La contraseña del facilitador está en .env (AGORA_ADMIN_PASSWORD).');
} else console.log('Se conserva la configuración .env existente.');
mkdirSync('data',{recursive:true,mode:0o700});
