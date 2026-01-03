/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { seedDashboardLeads } = require('./seed-dashboard-leads');

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

async function ensureDefaultPipelineStages(agencyId) {
  const defaults = [
    { name: 'Captação', color: '#3B82F6', order: 0, isClosed: false, isLost: false },
    { name: 'Contato', color: '#8B5CF6', order: 1, isClosed: false, isLost: false },
    { name: 'Montagem da Proposta', color: '#6366F1', order: 2, isClosed: false, isLost: false },
    { name: 'Proposta Enviada', color: '#0EA5E9', order: 3, isClosed: false, isLost: false },
    { name: 'Negociação', color: '#F59E0B', order: 4, isClosed: false, isLost: false },
    { name: 'Fechado', color: '#10B981', order: 5, isClosed: true, isLost: false },
    { name: 'Perdido', color: '#EF4444', order: 6, isClosed: false, isLost: true },
  ];

  // Remove etapas antigas e recria na ordem correta para evitar conflitos de unique (agencyId, order)
  await prisma.pipelineStage.deleteMany({ where: { agencyId } });

  await prisma.pipelineStage.createMany({
    data: defaults.map((stage) => ({ ...stage, agencyId })),
  });

  console.log('Seed: estágios de pipeline padrão recriados');

  const firstStage = await prisma.pipelineStage.findFirst({
    where: { agencyId },
    orderBy: { order: 'asc' },
  });

  if (firstStage) {
    await prisma.proposal.updateMany({
      where: { agencyId, stageId: null },
      data: { stageId: firstStage.id },
    });
  }
}

async function main() {
  const user = await upsertSuperAdmin();
  const agency = await ensureVoyuAgency(user.id);
  await ensureDefaultPipelineStages(agency.id);
  await seedDashboardLeads({ prisma });
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
