/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertSuperAdmin() {
  const email = 'nilsonbragax@gmail.com';
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      isActive: true,
      name: 'Nilson Braga',
    },
  });

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      email,
      name: user.name,
    },
    create: {
      id: user.id,
      email,
      name: user.name,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId: user.id,
        role: 'super_admin',
      },
    },
    update: {},
    create: {
      userId: user.id,
      role: 'super_admin',
    },
  });

  console.log(`Seed: usuário ${email} configurado como super_admin`);

  return user;
}

async function ensureVoyuAgency(userId) {
  let agency = await prisma.agency.findFirst({
    where: { name: 'Voyu' },
  });

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'Voyu',
        isActive: true,
      },
    });
    console.log('Seed: agência Voyu criada');
  } else {
    console.log('Seed: agência Voyu já existe, reutilizando');
  }

  // vincular profile ao agency
  await prisma.profile.update({
    where: { id: userId },
    data: { agencyId: agency.id },
  });

  return agency;
}

async function main() {
  const user = await upsertSuperAdmin();
  await ensureVoyuAgency(user.id);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
