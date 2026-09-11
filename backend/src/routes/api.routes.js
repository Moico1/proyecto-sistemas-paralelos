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

router.get('/cliente/:ci', async (req, res) => {
  const user = await prisma.usuario.findUnique({ where: { ci: req.params.ci }, include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 }, pagos: { orderBy: { creado_en: 'desc' }, take: 5 }, quejas: { orderBy: { creado_en: 'desc' }, take: 5 } } });
  if (!user) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
  return res.json({ usuario: publicUser(user), membresia: user.membresias[0] || null, pagos: user.pagos, quejas: user.quejas });
});

router.get('/publico', async (_req, res) => {
  const [productos, publicaciones] = await Promise.all([
    prisma.producto.findMany({ where: { activo: true }, orderBy: { creado_en: 'desc' } }),
    prisma.publicacion.findMany({ where: { publicado: true }, orderBy: { creado_en: 'desc' } }),
  ]);
  return res.json({ productos, publicaciones });
});

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
  const [usuarios, pagos, quejas, productos, asistencias] = await Promise.all([
    prisma.usuario.findMany({ include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 } }, orderBy: { id: 'desc' } }),
    prisma.pago.findMany({ where: { estado: 'PENDIENTE' }, include: { usuario: true, membresia: true }, orderBy: { creado_en: 'desc' } }),
    prisma.queja.findMany({ include: { usuario: true }, orderBy: { creado_en: 'desc' }, take: 20 }),
    prisma.producto.findMany({ orderBy: { id: 'desc' } }),
    prisma.asistencia.count(),
  ]);
  return res.json({ usuarios: usuarios.map((user) => ({ ...publicUser(user), membresia: user.membresias[0] || null })), pagos, quejas, productos, asistencias });
});

router.patch('/admin/pagos/:id', async (req, res) => {
  const pago = await prisma.pago.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado, aprobado_en: req.body.estado === 'APROBADO' ? new Date() : null } });
  if (req.body.estado === 'APROBADO') await prisma.usuario.update({ where: { id: pago.usuario_id }, data: { estado: 'ACTIVO' } });
  return res.json({ mensaje: 'Pago actualizado', pago });
});

router.patch('/admin/quejas/:id', async (req, res) => res.json({ queja: await prisma.queja.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado } }) }));

router.post('/admin/productos', async (req, res) => res.status(201).json({ producto: await prisma.producto.create({ data: { nombre: req.body.nombre, descripcion: req.body.descripcion || '', precio: Number(req.body.precio), stock: Number(req.body.stock || 0), imagen_url: req.body.imagen_url || null } }) }));

router.post('/admin/publicaciones', async (req, res) => res.status(201).json({ publicacion: await prisma.publicacion.create({ data: { titulo: req.body.titulo, contenido: req.body.contenido } }) }));

router.patch('/admin/usuarios/:id/estado', async (req, res) => res.json({ usuario: await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: { estado: req.body.estado } }) }));

module.exports = router;