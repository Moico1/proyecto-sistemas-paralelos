const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando poblamiento de base de datos...');

  await prisma.asistencia.deleteMany();
  await prisma.membresia.deleteMany();
  await prisma.queja.deleteMany();
  await prisma.suplemento.deleteMany();
  await prisma.configuracionGym.deleteMany();
  await prisma.usuario.deleteMany();

  // Admin
  await prisma.usuario.create({
    data: {
      ci: '1234567',
      nombreCompleto: 'Admin Mar-Yen',
      password: 'adminpassword',
      rol: 'ADMIN',
      estado: 'ACTIVO',
      fechaVencimiento: new Date('2030-12-31'),
    },
  });

  // Tablet Recepción
  await prisma.usuario.create({
    data: {
      ci: '0000000',
      nombreCompleto: 'Terminal Tablet Recepción',
      password: 'tabletpassword',
      rol: 'COACH',
      estado: 'ACTIVO',
      fechaVencimiento: new Date('2030-12-31'),
    },
  });

  // Cliente Activo
  await prisma.usuario.create({
    data: {
      ci: '8888888',
      nombreCompleto: 'Juan Pérez',
      password: 'clientepassword',
      rol: 'CLIENTE',
      estado: 'ACTIVO',
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Cliente Vencido
  await prisma.usuario.create({
    data: {
      ci: '9999999',
      nombreCompleto: 'María Gómez',
      password: 'clientepassword',
      rol: 'CLIENTE',
      estado: 'VENCIDO',
      fechaVencimiento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Configuración QR
  await prisma.configuracionGym.create({
    data: {
      id: 1,
      qrPagoUrl: 'https://via.placeholder.com/300x300.png?text=QR+Oficial+Mar-Yen',
      anuncioOficial: '¡Bienvenidos al Gimnasio Mar-Yen! Horarios de atención: 06:00 a 22:00.',
    },
  });

  // Catálogo
  await prisma.suplemento.createMany({
    data: [
      {
        nombre: 'Proteína Whey Gold Standard 2lb',
        descripcion: 'Proteína aislada de suero de leche para recuperación muscular.',
        precio: 350.0,
        stock: 10,
        imagenUrl: 'https://via.placeholder.com/150',
      },
      {
        nombre: 'Creatina Monohidratada 300g',
        descripcion: 'Aumenta la fuerza y potencia muscular en entrenamientos intensos.',
        precio: 210.0,
        stock: 15,
        imagenUrl: 'https://via.placeholder.com/150',
      },
      {
        nombre: 'Pre-Entreno C4 30 Serv',
        descripcion: 'Fórmula de energía explosiva y enfoque mental.',
        precio: 280.0,
        stock: 8,
        imagenUrl: 'https://via.placeholder.com/150',
      },
    ],
  });

  console.log('Poblamiento de base de datos completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
