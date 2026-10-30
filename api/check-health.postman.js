// Reusable assertions for: postman request URL/api/health --script-post-request <script>
pm.test('HTTP 200',()=>pm.expect(pm.response.code).to.equal(200));
pm.test('Aplicación disponible',()=>pm.expect(pm.response.json().status).to.equal('ok'));
pm.test('Instancia identificada',()=>pm.expect(pm.response.json().instanceId).to.be.a('string').and.not.empty);
