const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function main() {
  console.log('Iniciando poblamiento de base de datos...');

  await prisma.queja.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.membresia.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.publicacion.deleteMany();
  await prisma.configuracionGym.deleteMany();
  await prisma.usuario.deleteMany();

  const admin = await prisma.usuario.create({
    data: { ci: '1111111', nombre: 'Ana', apellido: 'Administradora', email: 'admin@mar-yen.local', usuario: 'admin', password: 'admin123', rol: 'ADMIN', estado: 'ACTIVO' },
  });
  const recepcion = await prisma.usuario.create({
    data: { ci: '0000000', nombre: 'Tablet', apellido: 'Recepcion', email: 'recepcion@mar-yen.local', usuario: 'tablet_recep1', password: 'tablet123', rol: 'RECEPCION', estado: 'ACTIVO' },
  });
  const activo = await prisma.usuario.create({
    data: { ci: '8888888', nombre: 'Juan', apellido: 'Perez', email: 'juan.perez@mar-yen.local', usuario: 'juan', password: 'cliente123', rol: 'CLIENTE', estado: 'ACTIVO' },
  });
  const vencido = await prisma.usuario.create({
    data: { ci: '9999999', nombre: 'Maria', apellido: 'Gomez', email: 'maria.gomez@mar-yen.local', usuario: 'maria', password: 'cliente123', rol: 'CLIENTE', estado: 'VENCIDO' },
  });

  const membresiaActiva = await prisma.membresia.create({
    data: { usuario_id: activo.id, fecha_inicio: daysFromNow(-30), fecha_fin: daysFromNow(30), estado: 'ACTIVA' },
  });
  const membresiaVencida = await prisma.membresia.create({
    data: { usuario_id: vencido.id, fecha_inicio: daysFromNow(-60), fecha_fin: daysFromNow(-5), estado: 'VENCIDA' },
  });
  await prisma.pago.create({
    data: { membresia_id: membresiaActiva.id, usuario_id: activo.id, metodo: 'QR', comprobante_url: 'comprobante-juan.png', estado: 'APROBADO', aprobado_en: new Date() },
  });
  await prisma.pago.create({
    data: { membresia_id: membresiaVencida.id, usuario_id: vencido.id, metodo: 'EFECTIVO', comprobante_url: 'pago-en-recepcion', estado: 'PENDIENTE' },
  });
  await prisma.queja.create({ data: { usuario_id: activo.id, mensaje: 'Seria bueno ampliar el horario del domingo.' } });

  await prisma.producto.createMany({
    data: [
      { nombre: 'Proteina Whey', descripcion: 'Recuperacion para despues del entrenamiento.', precio: 350, stock: 10, imagen_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500' },
      { nombre: 'Creatina Monohidratada', descripcion: 'Fuerza y rendimiento para tus sesiones.', precio: 210, stock: 15, imagen_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500' },
      { nombre: 'Shaker Mar-Yen', descripcion: 'Mezcla tus suplementos en cualquier lugar.', precio: 75, stock: 24, imagen_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500' },
    ],
  });
  await prisma.publicacion.createMany({
    data: [
      { titulo: 'Nuevo horario de domingo', contenido: 'Ahora entrenamos juntos de 08:00 a 13:00.', publicado: true },
      { titulo: 'Semana de bienvenida', contenido: 'Trae a un amigo y ambos reciben una evaluacion gratuita.', publicado: true },
    ],
  });
  await prisma.configuracionGym.create({ data: { id: 1, qr_url: null } });

  console.log(`Seed completado. Admin: ${admin.usuario}, recepcion: ${recepcion.usuario}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
