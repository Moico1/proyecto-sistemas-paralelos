const API = `${window.location.protocol}//${window.location.hostname}:3000`;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const money = (value) => `Bs. ${Number(value).toFixed(2)}`;

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.mensaje || 'No se pudo completar la operación');
  return data;
}

function selectView(view) {
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active-view', section.id === `view-${view}`));
  document.querySelectorAll('.mode-button').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.view)));

document.querySelectorAll('[data-fill]').forEach((button) => button.addEventListener('click', () => {
  $('#access-ci').value = button.dataset.fill;
  $('#access-form').requestSubmit();
}));

$('#access-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const ci = $('#access-ci').value.trim();
  const result = $('#access-result');
  try {
    const data = await request('/api/asistencia/validar', { method: 'POST', body: JSON.stringify({ ci }) });
    result.className = 'access-result allowed';
    result.innerHTML = `<span class="result-symbol">OK</span><p class="kicker">Acceso permitido</p><h2>Bienvenido ${escapeHtml(data.usuario.nombre)}</h2><p>${escapeHtml(data.mensaje)} / ${data.membresia.dias_restantes} dias restantes.</p>`;
  } catch (error) {
    result.className = 'access-result denied';
    result.innerHTML = `<span class="result-symbol">NO</span><p class="kicker">Acceso denegado</p><h2>Revisar membresia</h2><p>${escapeHtml(error.message)}</p>`;
  }
});

$('#client-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const ci = $('#client-ci').value.trim();
  try {
    const [account, content] = await Promise.all([request(`/api/cliente/${ci}`), request('/api/publico')]);
    const membership = account.membresia;
    const days = membership ? Math.max(0, Math.ceil((new Date(membership.fecha_fin) - Date.now()) / 86400000)) : 0;
    $('#client-status').textContent = `Cuenta cargada: ${account.usuario.nombre} ${account.usuario.apellido}`;
    $('#client-dashboard').innerHTML = `
      <section class="account-card"><p class="kicker">Tarjeta virtual</p><h2>${escapeHtml(account.usuario.nombre)} ${escapeHtml(account.usuario.apellido)}</h2><p>C.I. ${escapeHtml(account.usuario.ci)} / Estado: <strong>${escapeHtml(account.usuario.estado)}</strong></p><div class="membership-meter"><span style="width:${Math.min(100, days / 30 * 100)}%"></span></div><p class="metric"><b>${days}</b> dias restantes</p></section>
      <section class="panel"><div class="panel-head"><div><p class="kicker">Comprobante</p><h2>Registrar un pago</h2></div></div><form id="payment-form" class="stack-form"><select name="metodo"><option value="QR">Pago QR</option><option value="EFECTIVO">Efectivo en recepcion</option></select><input name="comprobante_url" placeholder="URL o nombre del comprobante"><button class="primary" type="submit">Enviar a revision</button></form></section>
      <section class="panel wide"><div class="panel-head"><div><p class="kicker">Tienda Mar-Yen</p><h2>Suplementos</h2></div></div><div class="product-grid">${content.productos.map((product) => `<article class="product"><img src="${escapeHtml(product.imagen_url)}" alt=""><div><h3>${escapeHtml(product.nombre)}</h3><p>${escapeHtml(product.descripcion)}</p><strong>${money(product.precio)}</strong><small>${product.stock} disponibles</small></div></article>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><div><p class="kicker">Buzon privado</p><h2>Dejanos una sugerencia</h2></div></div><form id="complaint-form" class="stack-form"><textarea name="mensaje" rows="4" placeholder="Escribe tu mensaje" required></textarea><button class="primary" type="submit">Enviar sugerencia</button></form><div class="history">${account.quejas.map((item) => `<p><b>${escapeHtml(item.estado)}</b> / ${escapeHtml(item.mensaje)}</p>`).join('') || '<p>Sin sugerencias anteriores.</p>'}</div></section>`;
    $('#payment-form').addEventListener('submit', async (formEvent) => { formEvent.preventDefault(); const formData = new FormData(formEvent.target); try { await request('/api/pagos', { method: 'POST', body: JSON.stringify({ ci, metodo: formData.get('metodo'), comprobante_url: formData.get('comprobante_url') }) }); $('#client-status').textContent = 'Comprobante enviado para aprobación.'; } catch (error) { $('#client-status').textContent = error.message; } });
    $('#complaint-form').addEventListener('submit', async (formEvent) => { formEvent.preventDefault(); const formData = new FormData(formEvent.target); try { await request('/api/quejas', { method: 'POST', body: JSON.stringify({ ci, mensaje: formData.get('mensaje') }) }); $('#client-status').textContent = 'Sugerencia enviada correctamente.'; formEvent.target.reset(); } catch (error) { $('#client-status').textContent = error.message; } });
  } catch (error) { $('#client-status').textContent = error.message; $('#client-dashboard').innerHTML = ''; }
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ usuario: $('#login-user').value, password: $('#login-password').value }) }); $('#admin-login').classList.add('hidden'); await loadAdmin(); } catch (error) { $('#admin-login').querySelector('small').textContent = error.message; }
});

async function loadAdmin() {
  const data = await request('/api/admin/resumen');
  $('#admin-dashboard').classList.remove('hidden');
  $('#admin-dashboard').innerHTML = `<div class="stats"><div><b>${data.usuarios.length}</b><span>Usuarios</span></div><div><b>${data.pagos.length}</b><span>Pagos pendientes</span></div><div><b>${data.quejas.length}</b><span>Mensajes</span></div><div><b>${data.asistencias}</b><span>Asistencias</span></div></div><div class="admin-columns"><section class="panel"><div class="panel-head"><div><p class="kicker">Revisión</p><h2>Pagos pendientes</h2></div></div><div class="admin-list">${data.pagos.map((payment) => `<div class="admin-row"><div><strong>${escapeHtml(payment.usuario.nombre)} ${escapeHtml(payment.usuario.apellido)}</strong><small>${payment.metodo} / ${escapeHtml(payment.comprobante_url || 'Sin comprobante')}</small></div><button class="small-button" data-approve="${payment.id}">Aprobar</button></div>`).join('') || '<p>No hay pagos pendientes.</p>'}</div></section><section class="panel"><div class="panel-head"><div><p class="kicker">Comunidad</p><h2>Quejas recibidas</h2></div></div><div class="admin-list">${data.quejas.map((item) => `<div class="admin-row"><div><strong>${escapeHtml(item.usuario.nombre)} / ${escapeHtml(item.estado)}</strong><small>${escapeHtml(item.mensaje)}</small></div><button class="small-button" data-close="${item.id}">Atendida</button></div>`).join('') || '<p>Sin mensajes.</p>'}</div></section></div><div class="admin-columns"><section class="panel"><div class="panel-head"><div><p class="kicker">Inventario</p><h2>Nuevo producto</h2></div></div><form id="product-form" class="stack-form"><input name="nombre" placeholder="Nombre" required><input name="precio" type="number" placeholder="Precio" required><input name="stock" type="number" placeholder="Stock" required><textarea name="descripcion" placeholder="Descripcion"></textarea><button class="primary">Crear producto</button></form></section><section class="panel"><div class="panel-head"><div><p class="kicker">Comunicacion</p><h2>Nuevo aviso</h2></div></div><form id="post-form" class="stack-form"><input name="titulo" placeholder="Titulo" required><textarea name="contenido" placeholder="Contenido" required></textarea><button class="primary">Publicar aviso</button></form></section></div>`;
  document.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/admin/pagos/${button.dataset.approve}`, { method: 'PATCH', body: JSON.stringify({ estado: 'APROBADO' }) }); loadAdmin(); }));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/admin/quejas/${button.dataset.close}`, { method: 'PATCH', body: JSON.stringify({ estado: 'ATENDIDA' }) }); loadAdmin(); }));
  $('#product-form').addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); await request('/api/admin/productos', { method: 'POST', body: JSON.stringify(data) }); event.target.reset(); loadAdmin(); });
  $('#post-form').addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); await request('/api/admin/publicaciones', { method: 'POST', body: JSON.stringify(data) }); event.target.reset(); });
}

$('#clock').textContent = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
