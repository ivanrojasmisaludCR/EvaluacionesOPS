import { test, expect } from '@playwright/test';
test('resultados: radar por áreas, avance parcial, actualización y consulta por participante/proyector',async({page,browser})=>{
 await page.goto('/facilitador');await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();await expect(page.getByRole('heading',{name:'Talleres de evaluación'})).toBeVisible();
 let version=await(await page.request.post('/api/instrumentos',{data:{name:'Radar de validación'}})).json();
 const fields=[['DMIT','Fuentes'],['DMIT','Fuentes'],['DMIT','Productos'],['DMIT','Calidad'],['Gestión y funciones organizacionales','Liderazgo'],['KMSH','Conocimiento'],['INNO','Innovación']];
 const questions=fields.map(([area,domain],i)=>({id:'radar-q'+i,number:i+1,text:'Pregunta de '+domain+' '+(i+1),area,domain,type:'madurez',source:null,levels:[1,2,3,4,5].map(value=>({value,text:'Descriptor del nivel '+value}))}));
 version=await(await page.request.put('/api/instrumentos/'+encodeURIComponent(version.versionId),{data:{name:'Radar de validación',questions,editRevision:version.editRevision}})).json();
 version=await(await page.request.post('/api/instrumentos/'+encodeURIComponent(version.versionId)+'/publicar',{data:{editRevision:version.editRevision}})).json();
 const room=await(await page.request.post('/api/talleres',{data:{pais:'Costa Rica',institucion:'Taller Radar resultados',fecha:'2026-10-28',alcance:'Validación del resumen durante el taller',facilitador:'Facilitadora',instrumentVersionId:version.versionId}})).json();
 await page.goto('/resultados');await page.getByRole('link',{name:/Taller Radar resultados/}).click();await expect(page.getByRole('heading',{name:'Resultados del taller',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Avance del instrumento'})).toContainText('0 / 7');await expect(page.getByRole('img',{name:'Radar de áreas',exact:true})).toBeVisible();
 const labelsFit=await page.getByRole('img',{name:'Radar de áreas',exact:true}).evaluate(svg=>{const width=(svg as unknown as SVGSVGElement).viewBox.baseVal.width;return Array.from(svg.querySelectorAll('text.radar-label')).every(label=>{const box=(label as SVGGraphicsElement).getBBox();return box.x>=0&&box.x+box.width<=width;});});expect(labelsFit).toBe(true);
 async function consensus(index:number,level:number){
  if(index!==0)expect((await page.request.post(`/api/salas/${room.code}/accion`,{data:{action:'select',questionId:questions[index].id}})).ok()).toBe(true);
  for(const action of ['open','close','discuss'])expect((await page.request.post(`/api/salas/${room.code}/accion`,{data:{action}})).ok()).toBe(true);
  expect((await page.request.post(`/api/salas/${room.code}/consenso`,{data:{questionId:questions[index].id,level,justification:'Acuerdo para validar resultados actuales'}})).ok()).toBe(true);
 }
 for(const [index,level]of [[0,2],[2,5],[4,3],[5,4],[6,1]])await consensus(index,level);
 await expect(page.getByRole('region',{name:'Avance del instrumento'})).toContainText('5 / 7');
 const dmit=page.locator('.area-score').filter({has:page.getByRole('heading',{name:'DMIT',exact:true})});await expect(dmit).toContainText('3,5');await expect(dmit).toContainText('Parcial');
 const table=page.getByRole('table',{name:'Resultados actuales por dominio'});await expect(table.getByRole('row',{name:/^Fuentes/})).toContainText('1 / 2');await expect(table.getByRole('row',{name:/^Calidad/})).toContainText('Pendiente');
 await expect(page.getByRole('img',{name:'Radar de dominios de DMIT',exact:true})).toBeVisible();await expect(page.getByText(/Ejes sin consensos: Calidad/)).toBeVisible();
 await page.screenshot({path:'test-results/resultados-parciales.png',fullPage:true});
 await page.getByRole('button',{name:'Exportar resultados',exact:true}).click();
 for(const format of ['Excel','PDF']){
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar '+format,exact:true}).click();
  const file=await download;expect(file.suggestedFilename()).toMatch(new RegExp(`agora-${room.code}-.*\\.${format==='Excel'?'xlsx':'pdf'}$`));await file.saveAs(`test-results/informe-parcial.${format==='Excel'?'xlsx':'pdf'}`);
 }
 await consensus(1,4);await expect(dmit).toContainText('4,0');await consensus(3,1);
 await expect(page.getByRole('region',{name:'Avance del instrumento'})).toContainText('7 / 7');await expect(page.getByText('Todos los consensos registrados',{exact:true})).toBeVisible();await expect(dmit).toContainText('3,0');await expect(dmit).toContainText('Completo');
 const state=await(await page.request.get(`/api/salas/${room.code}/estado`)).json();expect(state.question.id).toBe(questions[3].id);expect(state.phase).toBe('consenso');
 await page.getByLabel('Área a consultar').selectOption('Gestión y funciones organizacionales');await expect(table.getByRole('row',{name:/^Liderazgo/})).toBeVisible();await page.getByLabel('Área a consultar').selectOption('DMIT');
 await page.screenshot({path:'test-results/resultados-completos.png',fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/resultados-movil.png',fullPage:true});
 const participant=await browser.newContext(),projection=await browser.newContext();
 try{
  const p=await participant.newPage();await p.goto('/participar/'+room.code);await p.getByRole('button',{name:'Entrar a la sala'}).click();await p.getByRole('link',{name:'Ver resultados del taller'}).click();await expect(p.getByRole('region',{name:'Avance del instrumento'})).toContainText('7 / 7');await expect(p.getByRole('button',{name:'Exportar resultados',exact:true})).toHaveCount(0);
  const screen=await projection.newPage();await screen.goto(`/resultados/${room.code}?view=projector#${state.projectionToken}`);await expect(screen.getByRole('region',{name:'Avance del instrumento'})).toContainText('7 / 7');expect(screen.url()).not.toContain(state.projectionToken);await screen.reload();await expect(screen.getByText('Todos los consensos registrados',{exact:true})).toBeVisible();
 }finally{await participant.close();await projection.close();}
});
test('proyector: QR de participantes visible, código y recuperación tras perder conexión',async({page,browser})=>{
 await page.goto('/facilitador');await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();await expect(page.getByRole('heading',{name:'Talleres de evaluación'})).toBeVisible();
 const config=await(await page.request.get('/api/config')).json();await page.request.patch('/api/config',{data:{publicUrl:config.suggestions[0]}});
 const room=await(await page.request.post('/api/talleres',{data:{pais:'Costa Rica',institucion:'Validación QR proyectado',fecha:'2026-10-28',alcance:'QR en pantalla compartida',facilitador:'Facilitadora'}})).json();
 const state=await(await page.request.get(`/api/salas/${room.code}/estado`)).json();
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const screen=await context.newPage();
 try{
  await screen.goto(`/proyectar/${room.code}#${state.projectionToken}`);
  const invitation=screen.getByRole('region',{name:'Entrar al taller'});const qr=invitation.getByRole('img',{name:`QR para participar en la sala ${room.code}`});
  await expect(qr).toBeVisible();await expect(invitation).toContainText(room.code);await expect(invitation.getByRole('link')).toHaveAttribute('href',state.joinUrl);expect(screen.url()).not.toContain(state.projectionToken);
  await expect(screen.getByRole('button',{name:'Abrir votación'})).toHaveCount(0);await screen.screenshot({path:'test-results/proyector-qr.png',fullPage:true});
  await context.setOffline(true);await expect(qr).toHaveCount(0);await expect(invitation).toContainText('No se puede comprobar el enlace');
  await context.setOffline(false);await expect(qr).toBeVisible({timeout:15000});
  await screen.setViewportSize({width:390,height:844});expect(await screen.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screen.screenshot({path:'test-results/proyector-qr-movil.png',fullPage:true});
 }finally{await context.close();}
});
test('conexión: acceso protegido, estado local y configuración del QR sin perder el taller',async({page})=>{
 await page.goto('/conexion');await expect(page.getByRole('link',{name:'Ingresar como facilitador'})).toBeVisible();await page.getByRole('link',{name:'Ingresar como facilitador'}).click();
 await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();await expect(page.getByRole('heading',{name:'Talleres de evaluación'})).toBeVisible();
 await page.getByText('Menú',{exact:true}).click();await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:/^Conexión y QR/}).click();
 await expect(page.getByText('Aplicación disponible',{exact:true})).toBeVisible();
 await expect(page.getByText('El enlace automático de Cloudflare se habilita en la instalación Docker.')).toBeVisible();
 const config=await(await page.request.get('/api/config')).json();const url=config.suggestions[0];expect(url).toBeTruthy();
 await page.getByLabel('Dirección para compartir').fill(url);await page.getByRole('button',{name:'Guardar dirección LAN'}).click();await expect(page.getByText('Dirección LAN configurada',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Comprobar conexión'}).click();await expect(page.getByText('Aplicación disponible',{exact:true})).toBeVisible();
 await page.context().setOffline(true);await page.getByRole('button',{name:'Comprobar conexión'}).click();await expect(page.getByText('Aplicación sin conexión',{exact:true})).toBeVisible();
 await page.context().setOffline(false);await page.getByRole('button',{name:'Comprobar conexión'}).click();await expect(page.getByText('Aplicación disponible',{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/conexion-local.png',fullPage:true});
});
test('menú: navegación desde móvil, acceso a importación y enlace directo recuperable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByText('Menú',{exact:true}).click();
 const menu=page.getByRole('navigation',{name:'Navegación principal'});
 await menu.getByRole('link',{name:/^Participar/}).click();
 await expect(page).toHaveURL(/\/participar$/);await expect(page.getByLabel('Código de sala')).toBeVisible();
 await page.getByText('Menú',{exact:true}).click();await menu.getByRole('link',{name:/^Talleres/}).click();
 await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();
 await expect(page.getByRole('heading',{name:'Talleres de evaluación'})).toBeVisible();
 await page.getByText('Menú',{exact:true}).click();await menu.getByRole('link',{name:/^Importar Excel/}).click();
 await expect(page).toHaveURL(/\/instrumentos#importar$/);await expect(page.getByRole('heading',{name:'Importar instrumento',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Importar instrumento',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cerrar importación'}).click();await expect(page).toHaveURL(/\/instrumentos$/);
 await page.getByText('Menú',{exact:true}).click();await page.keyboard.press('Escape');await expect(menu).toBeHidden();
 await page.getByText('Menú',{exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/menu-movil.png',fullPage:true});
 await page.setViewportSize({width:320,height:800});
 const bounds=await menu.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(320);
 await page.setViewportSize({width:1280,height:800});await page.screenshot({path:'test-results/menu-escritorio.png',fullPage:true});
});
test('taller real: dos móviles, cambio de voto, resultados, consenso, otra pregunta y reconexión',async({browser,page})=>{
 await page.goto('/facilitador');await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();
 await page.getByRole('button',{name:'Crear taller'}).click();
 await page.getByLabel('País').fill('Costa Rica');await page.getByLabel('Institución').fill('Validación funcional');await page.getByLabel('Facilitador', {exact:true}).fill('Iván');await page.getByLabel('Alcance').fill('Piloto con dos participantes');
 await page.getByRole('button',{name:'Guardar y abrir sala'}).click();
 await expect(page.getByRole('button',{name:'Abrir votación'})).toBeVisible();
 const code=page.url().split('/').at(-1)!;
 const c1=await browser.newContext({viewport:{width:360,height:800}}),c2=await browser.newContext({viewport:{width:390,height:844}});
 const p1=await c1.newPage(),p2=await c2.newPage();
 for(const p of [p1,p2]){await p.goto('/participar/'+code);await p.getByRole('button',{name:'Entrar a la sala'}).click();await expect(p.getByText('Esperando la apertura')).toBeVisible();}
 await page.getByRole('button',{name:'Abrir votación'}).click();
 for(const [p,n]of [[p1,2],[p2,4]] as const){await p.getByRole('radio',{name:new RegExp(`^Nivel ${n}`)}).click();await p.getByRole('button',{name:'Enviar respuesta'}).click();await expect(p.getByText(`Respuesta guardada: nivel ${n}`)).toBeVisible();}
 await p1.getByRole('radio',{name:/^Nivel 5/}).click();await p1.getByRole('button',{name:'Enviar respuesta'}).click();await expect(p1.getByText('Respuesta guardada: nivel 5')).toBeVisible();
 await expect(page.getByTestId('response-count')).toHaveText('2');
 await expect(p1.getByRole('figure',{name:'Distribución de respuestas'})).toHaveCount(0);
 await page.getByRole('button',{name:'Cerrar votación'}).click();
 await expect(p1.getByRole('figure',{name:'Distribución de respuestas'})).toBeVisible();
 await page.getByRole('button',{name:'Abrir discusión'}).click();
 await page.getByLabel('Nivel acordado').selectOption('3');await page.getByLabel('Justificación del consenso').fill('El grupo revisó la evidencia disponible y acordó nivel tres.');await page.getByRole('button',{name:'Guardar consenso'}).click();
 await expect(page.getByText('Consenso registrado')).toBeVisible();await p1.reload();await expect(p1.getByText('Consenso registrado')).toBeVisible();
 expect(await p1.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await p1.screenshot({path:'test-results/participante-consenso.png',fullPage:true});await page.screenshot({path:'test-results/facilitador-consenso.png',fullPage:true});
 await page.getByRole('button',{name:/^2 Arquitectura/}).click();await expect(page.getByRole('button',{name:'Abrir votación'})).toBeVisible();
 await page.getByRole('button',{name:'Abrir votación'}).click();
 await expect(p1.getByRole('radio',{name:/^Nivel 1/})).toBeVisible();
 await c1.setOffline(true);await expect(p1.getByText('Sin conexión con la sala')).toBeVisible();
 await p1.getByRole('radio',{name:/^Nivel 1/}).click();await expect(p1.getByRole('button',{name:'Enviar respuesta'})).toBeDisabled();
 await c1.setOffline(false);await expect(p1.getByRole('button',{name:'Enviar respuesta'})).toBeEnabled({timeout:15000});
 await p1.getByRole('button',{name:'Enviar respuesta'}).click();await expect(p1.getByText('Respuesta guardada: nivel 1')).toBeVisible();
 await expect(page.getByRole('region',{name:'Resultados por agrupamiento'})).toContainText('1 de 3 preguntas con consenso');
 await expect(page.getByRole('region',{name:'Resultados por agrupamiento'})).toContainText('Promedio pendiente');
 await page.getByRole('button',{name:'Cerrar votación'}).click();await page.getByRole('button',{name:'Abrir discusión'}).click();
 await page.getByLabel('Nivel acordado').selectOption('2');await page.getByLabel('Justificación del consenso').fill('Segundo acuerdo');await page.getByRole('button',{name:'Guardar consenso'}).click();
 await page.getByRole('button',{name:/^3 /}).click();await page.getByRole('button',{name:'Abrir votación'}).click();await page.getByRole('button',{name:'Cerrar votación'}).click();await page.getByRole('button',{name:'Abrir discusión'}).click();
 await page.getByLabel('Nivel acordado').selectOption('5');await page.getByLabel('Justificación del consenso').fill('Tercer acuerdo');await page.getByRole('button',{name:'Guardar consenso'}).click();
 const results=page.getByRole('region',{name:'Resultados por agrupamiento'});
 await expect(results).toContainText('3 de 3 preguntas con consenso');await expect(results).toContainText('Nivel 3');await expect(results).toContainText(/Promedio: 3[,.]33/);
 await p1.reload();await expect(p1.getByRole('region',{name:'Resultados por agrupamiento'})).toContainText('Nivel 3');
 await page.screenshot({path:'test-results/agrupamientos-completos.png',fullPage:true});
 await c1.close();await c2.close();
});
test('editor: crear, guardar, publicar, elegir instrumento y conservar taller de versión anterior',async({page,browser})=>{
 await page.goto('/facilitador');await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();
 await page.getByRole('link',{name:'Instrumentos',exact:true}).click();
 await page.getByRole('button',{name:'Nuevo instrumento'}).click();await page.getByLabel('Nombre del nuevo instrumento').fill('Evaluación personalizada');await page.getByRole('button',{name:'Crear borrador'}).click();
 await expect(page.getByRole('heading',{name:'Evaluación personalizada',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Añadir pregunta',exact:true}).click();
 await page.getByLabel('Texto de la pregunta').fill('¿Existe un plan institucional?');await page.getByLabel('Área',{exact:true}).fill('Gobernanza');await page.getByLabel('Dominio',{exact:true}).fill('Planificación');
 for(let n=1;n<=5;n++)await page.getByLabel(`Descriptor del nivel ${n}`,{exact:true}).fill(`Descripción completa del nivel ${n}`);
 await page.getByRole('button',{name:'Guardar borrador'}).click();await expect(page.getByText('Borrador guardado')).toBeVisible();
 await page.getByRole('button',{name:'Vista previa'}).click();await expect(page.getByText('Descripción completa del nivel 5',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Volver al editor'}).click();
 await page.screenshot({path:'test-results/editor-instrumento.png',fullPage:true});
 await page.getByRole('button',{name:'Publicar versión'}).click();await expect(page.getByText('Versión publicada',{exact:true})).toBeVisible();
 const originalEditor=page.url();
 await page.getByRole('link',{name:'Talleres',exact:true}).click();await page.getByRole('button',{name:'Crear taller'}).click();
 await page.getByLabel('Instrumento y versión').selectOption({label:'Evaluación personalizada · v1.0.0'});
 await page.getByLabel('País').fill('Costa Rica');await page.getByLabel('Institución').fill('Taller con instrumento propio');await page.getByLabel('Facilitador',{exact:true}).fill('Iván');await page.getByLabel('Alcance').fill('Validación del editor');await page.getByRole('button',{name:'Guardar y abrir sala'}).click();
 await expect(page.getByRole('heading',{name:'¿Existe un plan institucional?',exact:true})).toBeVisible();const roomUrl=page.url();
 await page.goto(originalEditor);await page.getByRole('button',{name:'Crear nueva versión'}).click();
 await page.getByLabel('Texto de la pregunta').fill('¿El plan fue actualizado?');await page.getByRole('button',{name:'Publicar versión'}).click();await expect(page.getByText('Versión publicada',{exact:true})).toBeVisible();
 await page.goto(roomUrl);await expect(page.getByRole('heading',{name:'¿Existe un plan institucional?',exact:true})).toBeVisible();
 const mobile=await browser.newContext({viewport:{width:360,height:800}});const p=await mobile.newPage();await p.goto(roomUrl.replace('/sala/','/participar/'));await p.getByRole('button',{name:'Entrar a la sala'}).click();await page.getByRole('button',{name:'Abrir votación'}).click();
 await expect(p.getByRole('radio',{name:/^Nivel 5/})).toBeVisible();await p.getByRole('radio',{name:/^Nivel 5/}).click();await p.getByRole('button',{name:'Enviar respuesta'}).click();await expect(p.getByText('Respuesta guardada: nivel 5')).toBeVisible();
 await p.screenshot({path:'test-results/movil-instrumento-propio.png',fullPage:true});await mobile.close();
 await page.getByRole('link',{name:'Mis talleres'}).click();await page.getByRole('link',{name:'Instrumentos',exact:true}).click();await page.screenshot({path:'test-results/biblioteca-instrumentos.png',fullPage:true});
});
test('importación Excel: descargar, errores por celda, vista previa y nueva edición como borrador',async({page})=>{
 const {sampleWorkbook,xlsxBytes,templatePath}=await import('./helpers/excel.ts');const {readFileSync}=await import('node:fs');
 await page.goto('/facilitador');await page.getByLabel('Contraseña').fill('solo-pruebas-seguras');await page.getByRole('button',{name:'Ingresar como facilitador'}).click();await page.getByRole('link',{name:'Instrumentos',exact:true}).click();await page.getByRole('button',{name:'Importar instrumento',exact:true}).click();
 const downloading=page.waitForEvent('download');await page.getByRole('link',{name:'Descargar plantilla Excel'}).click();const download=await downloading;expect(download.suggestedFilename()).toBe('plantilla-instrumentos-agora.xlsx');
 await page.getByLabel('Archivo Excel (.xlsx)').setInputFiles({name:'plantilla.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:readFileSync(templatePath)});await page.getByRole('button',{name:'Revisar archivo'}).click();await expect(page.getByText('Corrige estos campos en el Excel y vuelve a revisarlo')).toBeVisible();await expect(page.getByRole('button',{name:'Importar como borrador'})).toBeDisabled();
 const workbook=await sampleWorkbook();const bytes=await xlsxBytes(workbook);
 await page.getByLabel('Archivo Excel (.xlsx)').setInputFiles({name:'instrumento-2027.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:bytes});await expect(page.getByText('Corrige estos campos en el Excel y vuelve a revisarlo')).toHaveCount(0);await page.getByRole('button',{name:'Revisar archivo'}).click();await expect(page.getByText('Listo para importar',{exact:true})).toBeVisible();
 await page.getByLabel('Preguntas de la vista previa').locator('summary').first().click();await expect(page.getByText('Descriptor 5 de la pregunta 1',{exact:false})).toBeVisible();await page.screenshot({path:'test-results/importacion-vista-previa.png',fullPage:true});
 await page.getByRole('button',{name:'Importar como borrador'}).click();await expect(page.getByRole('heading',{name:'Evaluación de ejemplo',exact:true})).toBeVisible();await expect(page.getByLabel('Texto de la pregunta')).toHaveValue('Pregunta 1');await expect(page.getByText('Edición:',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Publicar versión'}).click();await expect(page.getByText('Versión publicada',{exact:true})).toBeVisible();
 const baseId=decodeURIComponent(page.url().split('/').at(-1)!);await page.getByRole('link',{name:'Instrumentos',exact:true}).click();await page.getByRole('button',{name:'Importar instrumento',exact:true}).click();await page.getByLabel('Destino de la importación').selectOption(baseId);
 workbook.getWorksheet('Ficha')!.getCell('B7').value='2028';workbook.getWorksheet('Preguntas')!.getCell('D6').value='Pregunta 1 actualizada';
 await page.getByLabel('Archivo Excel (.xlsx)').setInputFiles({name:'instrumento-2028.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await xlsxBytes(workbook)});await page.getByRole('button',{name:'Revisar archivo'}).click();await expect(page.getByText(/2 códigos conservados/)).toBeVisible();await page.getByRole('button',{name:'Importar como borrador'}).click();await expect(page.getByLabel('Texto de la pregunta')).toHaveValue('Pregunta 1 actualizada');await expect(page.getByText('Borrador',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/importacion-borrador.png',fullPage:true});
});
