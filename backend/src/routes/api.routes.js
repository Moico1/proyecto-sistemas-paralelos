const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const publicUser = (user) => ({ id: user.id, ci: user.ci, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol, estado: user.estado });

router.post('/auth/login', async (req, res) => {
  const { usuario, password } = req.body;
  const account = await prisma.usuario.findFirst({ where: { OR: [{ usuario: usuario || '' }, { ci: usuario || '' }] } });
  if (!account || account.password !== password) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
  return res.json({ usuario: publicUser(account), token: `${account.id}:${account.rol}` });
});

router.post('/registro', async (req, res) => {
  const { ci, nombre, apellido, email, password, months } = req.body;
  if (!ci || !nombre || !apellido || !email) return res.status(400).json({ mensaje: 'C.I., nombre, apellido y email son obligatorios' });
  // allow months = 1 or 3 (defaults to 1)
  const m = Number(months) === 3 ? 90 : 30;
  try {
    const user = await prisma.usuario.create({
      data: {
        ci: ci.trim(), nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim().toLowerCase(),
        password: password || null, rol: 'CLIENTE', estado: 'PENDIENTE',
        membresias: { create: { fecha_inicio: new Date(), fecha_fin: new Date(Date.now() + m * 24 * 60 * 60 * 1000), estado: 'PENDIENTE' } },
      },
    });
    return res.status(201).json({ mensaje: 'Registro creado. Presenta tu pago en recepción para activar la membresía.', usuario: publicUser(user) });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ mensaje: 'El C.I. o email ya está registrado' });
    return res.status(500).json({ mensaje: 'No se pudo crear el registro' });
  }
});

router.get('/cliente/:ci', async (req, res) => {
  const user = await prisma.usuario.findUnique({ where: { ci: req.params.ci }, include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 }, pagos: { orderBy: { creado_en: 'desc' }, take: 5 }, quejas: { orderBy: { creado_en: 'desc' }, take: 5 } } });
  if (!user) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
  return res.json({ usuario: publicUser(user), membresia: user.membresias[0] || null, pagos: user.pagos, quejas: user.quejas });
});

router.get('/publico', async (_req, res) => {
  const [productos, publicaciones, configuracion] = await Promise.all([
    prisma.producto.findMany({ where: { activo: true }, orderBy: { creado_en: 'desc' } }),
    prisma.publicacion.findMany({ where: { publicado: true }, orderBy: { creado_en: 'desc' } }),
    prisma.configuracionGym.findUnique({ where: { id: 1 } }),
  ]);
  return res.json({ productos, publicaciones, configuracion });
});

router.get('/configuracion', async (_req, res) => res.json({ configuracion: await prisma.configuracionGym.findUnique({ where: { id: 1 } }) }));

router.post('/pagos', async (req, res) => {
  const { ci, metodo, comprobante_url } = req.body;
  const user = await prisma.usuario.findUnique({ where: { ci }, include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 } } });
  if (!user || !user.membresias[0]) return res.status(404).json({ mensaje: 'Cliente o membresía no encontrada' });
  const pago = await prisma.pago.create({ data: { usuario_id: user.id, membresia_id: user.membresias[0].id, metodo, comprobante_url: comprobante_url || null } });
  return res.status(201).json({ mensaje: 'Comprobante enviado para revisión', pago });
});

router.post('/quejas', async (req, res) => {
  const user = await prisma.usuario.findUnique({ where: { ci: req.body.ci } });
  if (!user) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
  const queja = await prisma.queja.create({ data: { usuario_id: user.id, mensaje: req.body.mensaje } });
  return res.status(201).json({ mensaje: 'Sugerencia recibida', queja });
});

router.get('/admin/resumen', async (_req, res) => {
  const [usuarios, pagos, quejas, productos, asistencias, configuracion] = await Promise.all([
    prisma.usuario.findMany({ include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 } }, orderBy: { id: 'desc' } }),
    prisma.pago.findMany({ where: { estado: 'PENDIENTE' }, include: { usuario: true, membresia: true }, orderBy: { creado_en: 'desc' } }),
    prisma.queja.findMany({ include: { usuario: true }, orderBy: { creado_en: 'desc' }, take: 20 }),
    prisma.producto.findMany({ orderBy: { id: 'desc' } }),
    prisma.asistencia.count(),
    prisma.configuracionGym.findUnique({ where: { id: 1 } }),
  ]);
  return res.json({ usuarios: usuarios.map((user) => ({ ...publicUser(user), membresia: user.membresias[0] || null })), pagos, quejas, productos, asistencias, configuracion });
});

router.patch('/admin/pagos/:id', async (req, res) => {
  const pago = await prisma.pago.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado, aprobado_en: req.body.estado === 'APROBADO' ? new Date() : null } });
  if (req.body.estado === 'APROBADO') {
    // set user active
    await prisma.usuario.update({ where: { id: pago.usuario_id }, data: { estado: 'ACTIVO' } });
    // try to activate or extend the membership linked to this payment
    try {
      const membresia = await prisma.membresia.findUnique({ where: { id: pago.membresia_id } });
      if (membresia) {
        const now = new Date();
        // if membership expired, extend from now; otherwise keep existing end date
        const newEnd = new Date(Math.max(new Date(membresia.fecha_fin).getTime(), now.getTime()));
        // extend by 30 days as default when approving a payment
        newEnd.setTime(newEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.membresia.update({ where: { id: membresia.id }, data: { estado: 'ACTIVA', fecha_fin: newEnd } });
      }
    } catch (e) {
      console.error('Error activando membresia al aprobar pago:', e);
    }
  }
  return res.json({ mensaje: 'Pago actualizado', pago });
});

// Admin: editar datos de usuario (nombre, apellido, email, ci, usuario)
router.patch('/admin/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['nombre', 'apellido', 'email', 'ci', 'usuario'];
  const data = {};
  for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
  if (Object.keys(data).length === 0) return res.status(400).json({ mensaje: 'No hay campos para actualizar' });
  try {
    const usuario = await prisma.usuario.update({ where: { id }, data });
    return res.json({ mensaje: 'Usuario actualizado', usuario: publicUser(usuario) });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ mensaje: 'C.I. o email ya registrado' });
    return res.status(500).json({ mensaje: 'No se pudo actualizar el usuario' });
  }
});

router.patch('/admin/quejas/:id', async (req, res) => res.json({ queja: await prisma.queja.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado } }) }));

router.post('/admin/productos', async (req, res) => res.status(201).json({ producto: await prisma.producto.create({ data: { nombre: req.body.nombre, descripcion: req.body.descripcion || '', precio: Number(req.body.precio), stock: Number(req.body.stock || 0), imagen_url: req.body.imagen_url || null } }) }));

router.patch('/admin/productos/:id', async (req, res) => res.json({ producto: await prisma.producto.update({ where: { id: Number(req.params.id) }, data: { ...(req.body.stock !== undefined ? { stock: Number(req.body.stock) } : {}), ...(req.body.activo !== undefined ? { activo: Boolean(req.body.activo) } : {}) } }) }));

router.delete('/admin/productos/:id', async (req, res) => res.json({ producto: await prisma.producto.update({ where: { id: Number(req.params.id) }, data: { activo: false, stock: 0 } }) }));

router.post('/admin/publicaciones', async (req, res) => res.status(201).json({ publicacion: await prisma.publicacion.create({ data: { titulo: req.body.titulo, contenido: req.body.contenido } }) }));

router.patch('/admin/usuarios/:id/estado', async (req, res) => res.json({ usuario: await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado } }) }));

router.patch('/admin/configuracion', async (req, res) => {
  const qr_url = req.body.qr_url || null;
  return res.json({ configuracion: await prisma.configuracionGym.upsert({ where: { id: 1 }, update: { qr_url }, create: { id: 1, qr_url } }) });
});

module.exports = router;