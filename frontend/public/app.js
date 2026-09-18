const API = `${window.location.protocol}//${window.location.hostname}:3000`;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const money = (value) => `Bs. ${Number(value).toFixed(2)}`;
const fileAsDataUrl = (file) => new Promise((resolve, reject) => { if (!file || !file.size) return resolve(null); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
const imagePreview = (value, label) => value && (/^data:image\//.test(value) || /^https?:\/\//.test(value)) ? `<img class="proof-preview" src="${escapeHtml(value)}" alt="${escapeHtml(label)}" loading="lazy">` : `<small>${escapeHtml(value || 'Sin comprobante')}</small>`;

async function request(path, options = {}) {
  const headers = options.body instanceof FormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.mensaje || 'No se pudo completar la operación');
  return data;
}

$('#register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    const result = await request('/api/registro', { method: 'POST', body: JSON.stringify(data) });
    $('#register-status').textContent = result.mensaje;
    event.target.reset();
  } catch (error) {
    $('#register-status').textContent = error.message;
  }
});

// ensure registration form includes plan selector (for backward compatibility)
(function ensurePlanSelector() {
  const form = document.getElementById('register-form');
  if (!form) return;
  if (form.querySelector('[name="months"]')) return;
  const wrapper = document.createElement('div');
  const label = document.createElement('label'); label.htmlFor = 'months'; label.textContent = 'Plan:';
  const select = document.createElement('select'); select.name = 'months'; select.id = 'months';
  const o1 = document.createElement('option'); o1.value = '1'; o1.textContent = '1 mes - Bs.200';
  const o3 = document.createElement('option'); o3.value = '3'; o3.textContent = '3 meses - Bs.500';
  select.appendChild(o1); select.appendChild(o3);
  wrapper.appendChild(label); wrapper.appendChild(select);
  const submit = form.querySelector('button[type=submit]') || form.querySelector('button.primary');
  if (submit) submit.parentNode.insertBefore(wrapper, submit);
})();

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
      <section class="panel"><div class="panel-head"><div><p class="kicker">Comprobante</p><h2>Registrar un pago</h2></div></div><form id="payment-form" class="stack-form"><select name="metodo"><option value="QR">Pago QR</option><option value="EFECTIVO">Efectivo en recepcion</option></select><input name="comprobante" type="file" accept="image/*"><input name="comprobante_url" placeholder="O pega una URL de comprobante"><button class="primary" type="submit">Enviar a revision</button></form></section>
      <section class="panel wide"><div class="panel-head"><div><p class="kicker">Tienda Mar-Yen</p><h2>Suplementos</h2></div></div><div class="product-grid">${content.productos.map((product) => `<article class="product"><img src="${escapeHtml(product.imagen_url)}" alt=""><div><h3>${escapeHtml(product.nombre)}</h3><p>${escapeHtml(product.descripcion)}</p><strong>${money(product.precio)}</strong><small>${product.stock} disponibles</small></div></article>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><div><p class="kicker">Buzon privado</p><h2>Dejanos una sugerencia</h2></div></div><form id="complaint-form" class="stack-form"><textarea name="mensaje" rows="4" placeholder="Escribe tu mensaje" required></textarea><button class="primary" type="submit">Enviar sugerencia</button></form><div class="history">${account.quejas.map((item) => `<p><b>${escapeHtml(item.estado)}</b> / ${escapeHtml(item.mensaje)}</p>`).join('') || '<p>Sin sugerencias anteriores.</p>'}</div></section>`;
    $('#payment-form').addEventListener('submit', async (formEvent) => { formEvent.preventDefault(); const formData = new FormData(formEvent.target); try { const image = await fileAsDataUrl(formData.get('comprobante')); await request('/api/pagos', { method: 'POST', body: JSON.stringify({ ci, metodo: formData.get('metodo'), comprobante_url: image || formData.get('comprobante_url') }) }); $('#client-status').textContent = 'Comprobante enviado para aprobación.'; } catch (error) { $('#client-status').textContent = error.message; } });
    $('#complaint-form').addEventListener('submit', async (formEvent) => { formEvent.preventDefault(); const formData = new FormData(formEvent.target); try { await request('/api/quejas', { method: 'POST', body: JSON.stringify({ ci, mensaje: formData.get('mensaje') }) }); $('#client-status').textContent = 'Sugerencia enviada correctamente.'; formEvent.target.reset(); } catch (error) { $('#client-status').textContent = error.message; } });
  } catch (error) { $('#client-status').textContent = error.message; $('#client-dashboard').innerHTML = ''; }
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ usuario: $('#login-user').value, password: $('#login-password').value }) }); $('#admin-login').classList.add('hidden'); await loadAdmin(); } catch (error) { $('#admin-login').querySelector('small').textContent = `Error: ${error.message}`; $('#admin-dashboard').classList.remove('hidden'); $('#admin-dashboard').innerHTML = `<div class="notice">No se pudo cargar el panel: ${escapeHtml(error.message)}</div>`; }
});

async function loadAdmin() {
  const data = await request('/api/admin/resumen');
  $('#admin-dashboard').classList.remove('hidden');
  $('#admin-dashboard').innerHTML = `<div class="stats"><div><b>${data.usuarios.length}</b><span>Usuarios</span></div><div><b>${data.pagos.length}</b><span>Pagos pendientes</span></div><div><b>${data.quejas.length}</b><span>Mensajes</span></div><div><b>${data.asistencias}</b><span>Asistencias</span></div></div><div class="admin-columns"><section class="panel"><div class="panel-head"><div><p class="kicker">Revisión</p><h2>Pagos pendientes</h2></div></div><div class="admin-list">${data.pagos.map((payment) => `<div class="admin-row"><div><strong>${escapeHtml(payment.usuario.nombre)} ${escapeHtml(payment.usuario.apellido)}</strong><small>${payment.metodo}</small>${imagePreview(payment.comprobante_url, 'Comprobante de pago')}</div><button class="small-button" data-approve="${payment.id}">Aprobar</button></div>`).join('') || '<p>No hay pagos pendientes.</p>'}</div></section><section class="panel"><div class="panel-head"><div><p class="kicker">Comunidad</p><h2>Quejas recibidas</h2></div></div><div class="admin-list">${data.quejas.map((item) => `<div class="admin-row"><div><strong>${escapeHtml(item.usuario.nombre)} / ${escapeHtml(item.estado)}</strong><small>${escapeHtml(item.mensaje)}</small></div><button class="small-button" data-close="${item.id}">Atendida</button></div>`).join('') || '<p>Sin mensajes.</p>'}</div></section></div><div class="admin-columns"><section class="panel"><div class="panel-head"><div><p class="kicker">Inventario</p><h2>Nuevo producto</h2></div></div><form id="product-form" class="stack-form"><input name="nombre" placeholder="Nombre" required><input name="precio" type="number" placeholder="Precio" required><input name="stock" type="number" placeholder="Stock" required><input name="imagen" type="file" accept="image/*"><textarea name="descripcion" placeholder="Descripcion"></textarea><button class="primary">Crear producto</button></form><div class="stock-list">${data.productos.map((product) => `<div class="admin-row"><div><strong>${escapeHtml(product.nombre)}</strong><small>Stock: ${product.stock} / ${product.activo ? 'Activo' : 'Retirado'}</small></div><button class="small-button" data-delete-product="${product.id}">Retirar</button></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><p class="kicker">Cobros</p><h2>QR del gimnasio</h2></div></div><form id="qr-form" class="stack-form"><input name="qr" type="file" accept="image/*"><input name="qr_url" placeholder="O pega la URL del QR" value="${escapeHtml(data.configuracion?.qr_url || '')}"><button class="primary">Guardar QR</button></form>${data.configuracion?.qr_url ? imagePreview(data.configuracion.qr_url, 'QR de pago') : '<p class="notice">Aun no hay QR configurado.</p>'}<div class="panel-head"><div><p class="kicker">Comunicacion</p><h2>Nuevo aviso</h2></div></div><form id="post-form" class="stack-form"><input name="titulo" placeholder="Titulo" required><textarea name="contenido" placeholder="Contenido" required></textarea><button class="primary">Publicar aviso</button></form></section></div>`;
  document.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/admin/pagos/${button.dataset.approve}`, { method: 'PATCH', body: JSON.stringify({ estado: 'APROBADO' }) }); loadAdmin(); }));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/admin/quejas/${button.dataset.close}`, { method: 'PATCH', body: JSON.stringify({ estado: 'ATENDIDA' }) }); loadAdmin(); }));
  $('#product-form').addEventListener('submit', async (event) => { event.preventDefault(); const formData = new FormData(event.target); const image = await fileAsDataUrl(formData.get('imagen')); await request('/api/admin/productos', { method: 'POST', body: JSON.stringify({ nombre: formData.get('nombre'), descripcion: formData.get('descripcion'), precio: formData.get('precio'), stock: formData.get('stock'), imagen_url: image }) }); event.target.reset(); loadAdmin(); });
  document.querySelectorAll('[data-delete-product]').forEach((button) => button.addEventListener('click', async () => { await request(`/api/admin/productos/${button.dataset.deleteProduct}`, { method: 'DELETE' }); loadAdmin(); }));
  $('#qr-form').addEventListener('submit', async (event) => { event.preventDefault(); const formData = new FormData(event.target); const image = await fileAsDataUrl(formData.get('qr')); await request('/api/admin/configuracion', { method: 'PATCH', body: JSON.stringify({ qr_url: image || formData.get('qr_url') }) }); loadAdmin(); });
  $('#post-form').addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); await request('/api/admin/publicaciones', { method: 'POST', body: JSON.stringify(data) }); event.target.reset(); });

  // enable quick edit buttons for users
  document.querySelectorAll('[data-edit-id]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const id = btn.dataset.editId;
      const user = data.usuarios.find((u) => String(u.id) === String(id));
      if (!user) return alert('Usuario no encontrado');
      const nombre = prompt('Nombre', user.nombre) || user.nombre;
      const apellido = prompt('Apellido', user.apellido) || user.apellido;
      const email = prompt('Email', user.email) || user.email;
      const ci = prompt('C.I.', user.ci) || user.ci;
      await request(`/api/admin/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify({ nombre, apellido, email, ci }) });
      loadAdmin();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }));
}

$('#clock').textContent = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
