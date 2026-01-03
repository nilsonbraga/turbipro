/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomValue = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const seedYear = Number(process.env.SEED_YEAR) || new Date().getFullYear() - 1;
const seedPerMonth = Number(process.env.SEED_PER_MONTH) || 1;

const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

async function ensureUser(prisma, email) {
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { isActive: true, name: 'Comercial Voyu' },
    create: {
      email,
      passwordHash,
      isActive: true,
      name: 'Comercial Voyu',
    },
  });

  await prisma.profile.upsert({
    where: { id: user.id },
    update: { email, name: user.name },
    create: { id: user.id, email, name: user.name },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'agent' } },
    update: {},
    create: { userId: user.id, role: 'agent' },
  });

  return user;
}

async function ensureAgency(prisma, name) {
  let agency = await prisma.agency.findFirst({ where: { name } });
  if (!agency) {
    agency = await prisma.agency.create({ data: { name, isActive: true } });
  }
  return agency;
}

async function ensureClosedStage(prisma, agencyId) {
  let stage = await prisma.pipelineStage.findFirst({
    where: { agencyId, isClosed: true },
    orderBy: { order: 'asc' },
  });
  if (!stage) {
    const maxOrder = await prisma.pipelineStage.aggregate({
      where: { agencyId },
      _max: { order: true },
    });
    stage = await prisma.pipelineStage.create({
      data: {
        agencyId,
        name: 'Fechado',
        color: '#10B981',
        order: (maxOrder._max.order ?? 0) + 1,
        isClosed: true,
        isLost: false,
      },
    });
  }
  return stage;
}

async function findOrCreateClient(prisma, agencyId, name, idx) {
  const existing = await prisma.client.findFirst({ where: { agencyId, name } });
  if (existing) return existing;
  return prisma.client.create({
    data: {
      agencyId,
      name,
      email: `cliente${idx + 1}@voyu.com.br`,
    },
  });
}

async function closeProposalsWithFinancials(prisma, { agencyId, closedStageId }) {
  const proposals = await prisma.proposal.findMany({
    where: { agencyId },
    include: { client: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!proposals.length) {
    console.log('Seed: nenhuma proposta encontrada para fechar.');
    return;
  }

  const proposalIds = proposals.map((proposal) => proposal.id);
  const services = await prisma.proposalService.findMany({
    where: { proposalId: { in: proposalIds } },
    select: { proposalId: true, value: true, commissionType: true, commissionValue: true },
  });

  const totalsByProposal = {};
  services.forEach((service) => {
    if (!totalsByProposal[service.proposalId]) {
      totalsByProposal[service.proposalId] = { value: 0, commission: 0 };
    }
    const serviceValue = Number(service.value || 0);
    const commissionValue = Number(service.commissionValue || 0);
    const serviceCommission =
      service.commissionType === 'percentage'
        ? (serviceValue * commissionValue) / 100
        : commissionValue;
    totalsByProposal[service.proposalId].value += serviceValue;
    totalsByProposal[service.proposalId].commission += serviceCommission;
  });

  const collaborators = await prisma.collaborator.findMany({ where: { agencyId } });
  const collaboratorById = new Map(collaborators.map((c) => [c.id, c]));
  const collaboratorByUserId = new Map(
    collaborators.filter((c) => c.userId).map((c) => [c.userId, c]),
  );

  let updatedCount = 0;
  let financialCreated = 0;
  let commissionCreated = 0;

  for (const proposal of proposals) {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        stageId: closedStageId,
        updatedAt: proposal.createdAt,
      },
    });
    updatedCount += 1;

    const totals = totalsByProposal[proposal.id] || { value: 0, commission: 0 };
    const hasValue = totals.value > 0;

    if (hasValue) {
      const existingTransaction = await prisma.financialTransaction.findFirst({
        where: { proposalId: proposal.id, type: 'income' },
      });

      if (!existingTransaction) {
        await prisma.financialTransaction.create({
          data: {
            agencyId,
            proposalId: proposal.id,
            clientId: proposal.clientId,
            type: 'income',
            category: 'Venda',
            description: `Proposta #${proposal.number} - ${proposal.title}`,
            totalValue: totals.value,
            profitValue: totals.commission,
            status: 'pending',
            launchDate: toDateOnly(proposal.createdAt),
            documentNumber: proposal.client?.name ?? null,
            documentName: proposal.client?.cpf ?? null,
          },
        });
        financialCreated += 1;
      }
    }

    const collaborator =
      (proposal.assignedCollaboratorId &&
        collaboratorById.get(proposal.assignedCollaboratorId)) ||
      (proposal.userId && collaboratorByUserId.get(proposal.userId)) ||
      null;

    if (collaborator && hasValue) {
      const existingCommission = await prisma.collaboratorCommission.findFirst({
        where: { proposalId: proposal.id, collaboratorId: collaborator.id },
      });

      if (!existingCommission) {
        const commissionBase =
          collaborator.commissionBase === 'profit' ? totals.commission : totals.value;
        const commissionAmount =
          (commissionBase * Number(collaborator.commissionPercentage || 0)) / 100;
        const createdAt = new Date(proposal.createdAt);
        await prisma.collaboratorCommission.create({
          data: {
            agencyId,
            collaboratorId: collaborator.id,
            proposalId: proposal.id,
            periodMonth: createdAt.getMonth() + 1,
            periodYear: createdAt.getFullYear(),
            saleValue: totals.value,
            profitValue: totals.commission,
            commissionPercentage: collaborator.commissionPercentage,
            commissionBase: collaborator.commissionBase,
            commissionAmount,
          },
        });
        commissionCreated += 1;
      }
    }
  }

  console.log(
    `Seed: ${updatedCount} propostas marcadas como fechadas. ${financialCreated} lançamentos financeiros criados. ${commissionCreated} comissões criadas.`,
  );
}

async function seedDashboardLeads({
  prisma,
  year = seedYear,
  perMonth = seedPerMonth,
  agencyName = 'Voyu',
  userEmail = 'comercial@voyu.com.br',
} = {}) {
  const seedPrefix = `Seed Lead ${year}`;

  if (!prisma) {
    throw new Error('Seed: prisma client não informado');
  }

  const user = await ensureUser(prisma, userEmail);
  const agency = await ensureAgency(prisma, agencyName);

  await prisma.profile.update({
    where: { id: user.id },
    data: { agencyId: agency.id },
  });

  const closedStage = await ensureClosedStage(prisma, agency.id);

  const totalPerMonth = perMonth;
  let createdTotal = 0;
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const monthName = monthNames[monthIndex];
    const client = await findOrCreateClient(prisma, agency.id, `Cliente ${monthName} ${year}`, monthIndex);
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    const monthSeedPrefix = `${seedPrefix} - ${monthName}`;
    const existingCount = await prisma.proposal.count({
      where: { agencyId: agency.id, title: { startsWith: monthSeedPrefix } },
    });

    if (existingCount >= totalPerMonth) {
      continue;
    }

    for (let i = existingCount + 1; i <= totalPerMonth; i += 1) {
      const createdDay = randomInt(1, Math.min(25, lastDay));
      const createdAt = new Date(year, monthIndex, createdDay, 10, randomInt(0, 59), 0);
      const closedDay = Math.min(createdDay + randomInt(2, 7), lastDay);
      const updatedAt = new Date(year, monthIndex, closedDay, 18, randomInt(0, 59), 0);

      const proposal = await prisma.proposal.create({
        data: {
          agencyId: agency.id,
          clientId: client.id,
          userId: user.id,
          stageId: closedStage.id,
          status: 'pending',
          title: `${monthSeedPrefix} #${i}`,
          createdAt,
          updatedAt,
        },
      });
      createdTotal += 1;

      const servicesCount = randomInt(1, 3);
      for (let s = 0; s < servicesCount; s += 1) {
        const value = randomValue(1500, 12000) + monthIndex * 120;
        await prisma.proposalService.create({
          data: {
            proposalId: proposal.id,
            type: 'Pacote',
            description: `Servico ${s + 1} - ${monthName}`,
            value,
            commissionType: 'percentage',
            commissionValue: randomInt(8, 15),
            startDate: createdAt,
            endDate: updatedAt,
            createdAt,
          },
        });
      }
    }
  }

  if (createdTotal === 0) {
    console.log('Seed: nenhuma lead nova para criar neste ano.');
  } else {
    console.log(`Seed: ${createdTotal} leads e servicos criados com sucesso.`);
  }

  await closeProposalsWithFinancials(prisma, {
    agencyId: agency.id,
    closedStageId: closedStage.id,
  });
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedDashboardLeads({ prisma })
    .catch((error) => {
      console.error('Seed failed', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDashboardLeads };
