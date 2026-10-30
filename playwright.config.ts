import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({testDir:'./tests',testMatch:'browser.spec.ts',timeout:40000,workers:1,use:{baseURL:'http://127.0.0.1:3105',headless:true,launchOptions:{executablePath:process.env.AGORA_BROWSER_EXECUTABLE},screenshot:'only-on-failure'},webServer:{command:'npm start',url:'http://127.0.0.1:3105/api/health',reuseExistingServer:false,env:{PORT:'3105',HOST:'127.0.0.1',AGORA_ADMIN_PASSWORD:'solo-pruebas-seguras',AGORA_DATA_DIR:mkdtempSync(join(tmpdir(),'agora-browser-'))}}});
