const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.post('/validar', async (req, res) => {
  const ci = typeof req.body.ci === 'string' ? req.body.ci.trim() : '';

  if (!ci) {
    return res.status(400).json({ permitido: false, mensaje: 'El C.I. es obligatorio' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { ci },
      include: { membresias: { orderBy: { fecha_fin: 'desc' }, take: 1 } },
    });

    if (!usuario) {
      return res.status(404).json({ permitido: false, mensaje: 'C.I. no registrado' });
    }

    const membresia = usuario.membresias[0];
    const dias_restantes = membresia
      ? Math.max(0, Math.ceil((membresia.fecha_fin.getTime() - Date.now()) / 86400000))
      : 0;
    const permitido = Boolean(
      usuario.estado === 'ACTIVO' && membresia && membresia.estado === 'ACTIVA' && dias_restantes > 0,
    );

    await prisma.asistencia.create({
      data: {
        usuario_id: usuario.id,
        resultado: permitido ? 'PERMITIDO' : 'DENEGADO',
      },
    });

    if (!permitido) {
      return res.status(403).json({ permitido: false, mensaje: usuario.estado === 'PENDIENTE' ? 'Pago pendiente de aprobación' : 'Membresía vencida', usuario: { nombre: usuario.nombre, apellido: usuario.apellido }, dias_restantes });
    }

    return res.status(200).json({ permitido: true, mensaje: `Bienvenido ${usuario.nombre}`, usuario: { nombre: usuario.nombre, apellido: usuario.apellido }, membresia: { fecha_fin: membresia.fecha_fin, dias_restantes } });
  } catch (error) {
    console.error('Error validando asistencia:', error);
    return res.status(500).json({ permitido: false, mensaje: 'Error interno del servidor' });
  }
});

module.exports = router;