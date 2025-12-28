import { Router, Request } from 'express';
import { prisma } from '../prisma/client';
import { badRequest, notFound } from '../utils/httpError';
import { normalizeModelName, parseJSONParam, parseNumberParam } from '../utils/parsers';

const router = Router();

const modelDelegates = {
  user: prisma.user,
  agency: prisma.agency,
  profile: prisma.profile,
  userRole: prisma.userRole,
  client: prisma.client,
  pipelineStage: prisma.pipelineStage,
  proposal: prisma.proposal,
  proposalService: prisma.proposalService,
  partner: prisma.partner,
  tag: prisma.tag,
  proposalTag: prisma.proposalTag,
  team: prisma.team,
  collaborator: prisma.collaborator,
  collaboratorGoal: prisma.collaboratorGoal,
  collaboratorCommission: prisma.collaboratorCommission,
  shiftType: prisma.shiftType,
  collaboratorSchedule: prisma.collaboratorSchedule,
  collaboratorTimeOff: prisma.collaboratorTimeOff,
  taskColumn: prisma.taskColumn,
  task: prisma.task,
  taskAssignee: prisma.taskAssignee,
  taskChecklist: prisma.taskChecklist,
  taskChecklistItem: prisma.taskChecklistItem,
  taskComment: prisma.taskComment,
  taskFile: prisma.taskFile,
  expeditionGroup: prisma.expeditionGroup,
  expeditionRegistration: prisma.expeditionRegistration,
  customItinerary: prisma.customItinerary,
  itineraryDay: prisma.itineraryDay,
  itineraryItem: prisma.itineraryItem,
  itineraryDayFeedback: prisma.itineraryDayFeedback,
  itineraryItemFeedback: prisma.itineraryItemFeedback,
  financialTransaction: prisma.financialTransaction,
  supplier: prisma.supplier,
  subscriptionPlan: prisma.subscriptionPlan,
  agencySubscription: prisma.agencySubscription,
  discountCoupon: prisma.discountCoupon,
  platformSetting: prisma.platformSetting,
  studioTemplate: prisma.studioTemplate,
  publicProposalLink: prisma.publicProposalLink,
  proposalHistory: prisma.proposalHistory,
  proposalImage: prisma.proposalImage,
  agencyResendConfig: prisma.agencyResendConfig,
  agencySmtpConfig: prisma.agencySmtpConfig,
  agencyWhatsappConfig: prisma.agencyWhatsappConfig,
  agencyEmailOauth: prisma.agencyEmailOauth,
  agencyEmail: prisma.agencyEmail,
  whatsappConversation: prisma.whatsappConversation,
  whatsappMessage: prisma.whatsappMessage,
  notificationPreference: prisma.notificationPreference,
} as const;

type ModelName = keyof typeof modelDelegates;
type ModelDelegate = (typeof modelDelegates)[ModelName];

const primaryKeys: Record<ModelName, string[]> = {
  user: ['id'],
  agency: ['id'],
  profile: ['id'],
  userRole: ['id'],
  client: ['id'],
  pipelineStage: ['id'],
  proposal: ['id'],
  proposalService: ['id'],
  partner: ['id'],
  tag: ['id'],
  proposalTag: ['proposalId', 'tagId'],
  team: ['id'],
  collaborator: ['id'],
  collaboratorGoal: ['id'],
  collaboratorCommission: ['id'],
  shiftType: ['id'],
  collaboratorSchedule: ['id'],
  collaboratorTimeOff: ['id'],
  taskColumn: ['id'],
  task: ['id'],
  taskAssignee: ['id'],
  taskChecklist: ['id'],
  taskChecklistItem: ['id'],
  taskComment: ['id'],
  taskFile: ['id'],
  expeditionGroup: ['id'],
  expeditionRegistration: ['id'],
  customItinerary: ['id'],
  itineraryDay: ['id'],
  itineraryItem: ['id'],
  itineraryDayFeedback: ['id'],
  itineraryItemFeedback: ['id'],
  financialTransaction: ['id'],
  supplier: ['id'],
  subscriptionPlan: ['id'],
  agencySubscription: ['id'],
  discountCoupon: ['id'],
  platformSetting: ['id'],
  studioTemplate: ['id'],
  publicProposalLink: ['id'],
  proposalHistory: ['id'],
  proposalImage: ['id'],
  agencyResendConfig: ['id'],
  agencySmtpConfig: ['id'],
  agencyWhatsappConfig: ['id'],
  agencyEmailOauth: ['id'],
  agencyEmail: ['id'],
  whatsappConversation: ['id'],
  whatsappMessage: ['id'],
  notificationPreference: ['id'],
};

const asyncHandler =
  (fn: any) =>
  (req: Request, res: any, next: any): Promise<void> =>
    Promise.resolve(fn(req, res, next)).catch(next);

const resolveModel = (req: Request): { name: ModelName; delegate: ModelDelegate } => {
  const normalized = normalizeModelName(req.params.model);
  if (!Object.prototype.hasOwnProperty.call(modelDelegates, normalized)) {
    throw notFound(`Modelo ${req.params.model} não existe`);
  }

  const name = normalized as ModelName;
  return { name, delegate: modelDelegates[name] };
};

const buildPrimaryWhere = (req: Request, modelName: ModelName) => {
  const keys = primaryKeys[modelName];

  if (keys.length === 1) {
    const [key] = keys;
    const idParam =
      req.params.id ??
      (req.query as Record<string, unknown>)[key] ??
      (req.query as Record<string, unknown>).id ??
      (req.body?.where ? req.body.where[key] : undefined) ??
      req.body?.[key] ??
      req.body?.id;

    if (!idParam) {
      throw badRequest(`Informe ${key} pelo parâmetro :id ou pelo campo where.${key}`);
    }

    return { [key]: idParam };
  }

  const where: Record<string, unknown> = {};
  const missing: string[] = [];

  keys.forEach((key) => {
    const value =
      (req.query as Record<string, unknown>)[key] ??
      (req.body?.where ? req.body.where[key] : undefined) ??
      req.body?.[key];

    if (value === undefined) {
      missing.push(key);
    } else {
      where[key] = value;
    }
  });

  if (missing.length) {
    throw badRequest(`Informe todas as chaves primárias: ${missing.join(', ')}`);
  }

  return where;
};

const normalizeDateFilters = (where: Record<string, unknown> | null | undefined, fields: string[]) => {
  if (!where) return where;

  const convertValue = (value: any): any => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000Z`);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, convertValue(v)]),
      );
    }
    return value;
  };

  fields.forEach((field) => {
    if (where[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (where as any)[field] = convertValue((where as any)[field]);
    }
  });

  return where;
};

const toDateTime = (date: any, time?: any): Date | null => {
  if (!date) return null;
  if (typeof date === 'string' && date.trim() === '') return null;
  const dateStr = typeof date === 'string' ? date : new Date(date).toISOString();
  const onlyDate = dateStr.slice(0, 10);
  const timeStr = typeof time === 'string' && time.trim().length > 0 ? time.trim() : '00:00';
  // Use local parsing then convert to UTC ISO
  const iso = new Date(`${onlyDate}T${timeStr}`).toISOString();
  return new Date(iso);
};

const normalizeProposalServiceDates = (data: Record<string, unknown>) => {
  if (data.startDate !== undefined || data.startTime !== undefined) {
    data.startDate = toDateTime(data.startDate, data.startTime) ?? null;
  }
  if (data.endDate !== undefined || data.endTime !== undefined) {
    data.endDate = toDateTime(data.endDate, data.endTime) ?? null;
  }
  if (data.startTime === '') data.startTime = null;
  if (data.endTime === '') data.endTime = null;
  return data;
};

const normalizeDateOnlyFields = (data: Record<string, unknown>, fields: string[], defaultTime = '00:00') => {
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      const value = data[field];
      if (value === null || value === '') {
        data[field] = null;
      } else {
        data[field] = toDateTime(value, defaultTime);
      }
    }
  });
  return data;
};

const normalizeTimeOnlyFields = (data: Record<string, unknown>, fields: string[]) => {
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      const value = data[field];
      if (value === null || value === '') {
        data[field] = null;
      } else {
        data[field] = new Date(`1970-01-01T${value}`).toISOString();
      }
    }
  });
  return data;
};

const normalizeStudioTemplatePayload = (data: Record<string, unknown>, options?: { partial?: boolean }) => {
  const fallbackAgencyId = process.env.DEFAULT_AGENCY_ID ?? 'bfd6d952-a5c7-4129-827a-63b6dc4ad577';
  // If payload came as flattened art data (without template fields), wrap it
  const allowedKeys = new Set([
    'agencyId',
    'createdById',
    'templateId',
    'formatId',
    'artTypeId',
    'name',
    'data',
    'colors',
    'icons',
    'images',
    'logoUrl',
    'blurLevel',
    'isFavorite',
  ]);

  const hasTemplateFields = data.templateId !== undefined || data.formatId !== undefined || data.artTypeId !== undefined;

  // Partial updates: do not wrap or overwrite defaults if template fields are absent
  if (options?.partial && !hasTemplateFields) {
    // still promote nested fields when provided
    if (data.data && typeof data.data === 'object') {
      const nested = data.data as Record<string, unknown>;
      if (!data.images && Array.isArray(nested.images)) data.images = nested.images;
      if (!data.colors && nested.colors) data.colors = nested.colors;
      if (!data.logoUrl && nested.logoUrl) data.logoUrl = nested.logoUrl as string;
      if (!data.icons && nested.icons) data.icons = nested.icons;
      if (!data.blurLevel && nested.blurLevel) data.blurLevel = nested.blurLevel as number;
      if (!data.name && nested.name) data.name = nested.name as string;
    }
    return data;
  }

  if (!hasTemplateFields) {
    const artData = { ...data };
    data.templateId = 0;
    data.formatId = 'custom';
    data.artTypeId = 'custom';
    data.name = typeof artData.name === 'string' && artData.name.trim() ? artData.name : 'Arte';
    data.data = artData;
    data.colors = data.colors ?? {};
    data.images = data.images ?? [];
    data.blurLevel = data.blurLevel ?? 24;
    data.isFavorite = data.isFavorite ?? false;
  }

  // Move any stray keys into data blob
  const extraEntries = Object.entries(data).filter(([key]) => !allowedKeys.has(key));
  if (extraEntries.length) {
    const merged = { ...(data.data as Record<string, unknown> | undefined) };
    extraEntries.forEach(([key, value]) => {
      merged[key] = value;
      delete (data as any)[key];
    });
    data.data = merged;
  }

  // Default name if empty
  if (!data.name) data.name = 'Arte';
  if (!data.formatId) data.formatId = 'custom';
  if (!data.artTypeId) data.artTypeId = 'custom';
  if (data.templateId === undefined || data.templateId === null) data.templateId = 0;
  if (!data.agencyId) data.agencyId = fallbackAgencyId;
  const nested = (data.data as Record<string, unknown> | undefined) ?? {};

  // Normalize colors/images/icons even if they came nested
  const normalizedColors =
    data.colors && typeof data.colors === 'object'
      ? (data.colors as Record<string, unknown>)
      : {};
  const mergedColors =
    Object.keys(normalizedColors).length === 0 && nested && typeof nested === 'object' && (nested as any).colors
      ? (nested as any).colors
      : normalizedColors;
  data.colors = mergedColors || {};

  if (!Array.isArray(data.images)) {
    data.images = Array.isArray(data.images) ? data.images : [];
  }
  if ((data as any).images.length === 0 && Array.isArray((nested as any).images)) {
    data.images = (nested as any).images as string[];
  }

  if (!data.icons && nested && typeof nested === 'object' && (nested as any).icons) {
    data.icons = (nested as any).icons as Record<string, unknown>;
  }
  if (!data.logoUrl && nested && typeof nested === 'object' && (nested as any).logoUrl) {
    data.logoUrl = nested.logoUrl as string;
  }
  if (!data.blurLevel && nested && typeof nested === 'object' && (nested as any).blurLevel) {
    data.blurLevel = nested.blurLevel as number;
  }

  if (
    (!data.name || data.name === 'Arte') &&
    nested &&
    typeof nested === 'object'
  ) {
    const maybeName =
      (nested as any).destinos ||
      (nested as any).hotel ||
      (nested as any).origem ||
      (nested as any).title;
    if (maybeName) data.name = maybeName as string;
  }

  if (data.isFavorite === undefined) data.isFavorite = false;
  // Promote nested fields if they arrived inside data
  if (data.data && typeof data.data === 'object') {
    const nestedData = data.data as Record<string, unknown>;
    if (data.images.length === 0 && Array.isArray(nestedData.images)) {
      data.images = nestedData.images;
    }
    if (Object.keys(data.colors as Record<string, unknown>).length === 0 && nestedData.colors) {
      data.colors = nestedData.colors;
    }
    if (!data.logoUrl && nestedData.logoUrl) {
      data.logoUrl = nestedData.logoUrl as string;
    }
    if (!data.icons && nestedData.icons) {
      data.icons = nestedData.icons;
    }
    if (!data.blurLevel && nestedData.blurLevel) {
      data.blurLevel = nestedData.blurLevel as number;
    }
  }
  // Persist auxiliary fields inside data blob as well for backward compat
  const mergedData = (data.data && typeof data.data === 'object' ? { ...(data.data as Record<string, unknown>) } : {}) as Record<string, unknown>;
  mergedData.colors = data.colors;
  mergedData.icons = data.icons;
  mergedData.images = data.images;
  mergedData.logoUrl = data.logoUrl;
  mergedData.blurLevel = data.blurLevel;
  mergedData.name = data.name;
  mergedData.formatId = data.formatId;
  mergedData.artTypeId = data.artTypeId;
  mergedData.templateId = data.templateId;
  data.data = mergedData;
  return data;
};

const normalizeProposalServiceRelations = (data: Record<string, unknown>, options?: { allowRelation?: boolean }) => {
  if ('partnerId' in data) {
    const partnerId = data.partnerId as string | null | undefined;
    delete data.partnerId;

    if (options?.allowRelation === false) {
      data.partnerId = partnerId ?? null;
      return data;
    }

    if (partnerId) {
      data.partner = { connect: { id: partnerId } };
    } else {
      data.partner = { disconnect: true };
    }
  }
  return data;
};

type HistoryPayload = {
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
};

const addTaskHistory = async (
  prisma: PrismaClient,
  taskId: string,
  userId: string | null,
  action: string,
  extra?: HistoryPayload,
) => {
  try {
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action,
        field: extra?.field ?? null,
        oldValue: extra?.oldValue ?? null,
        newValue: extra?.newValue ?? null,
        details: extra?.details ?? null,
      },
    });
  } catch (err) {
    // avoid blocking main flow
    // eslint-disable-next-line no-console
    console.error('TaskHistory log error', err);
  }
};

router.get(
  '/:model',
  asyncHandler(async (req, res) => {
    const { name, delegate } = resolveModel(req);

    let where = parseJSONParam<Record<string, unknown>>(req.query.where);
    const include = parseJSONParam<Record<string, unknown>>(req.query.include);
    const orderBy = parseJSONParam<Record<string, unknown>>(req.query.orderBy);
    const select = parseJSONParam<Record<string, unknown>>(req.query.select);
    const take = parseNumberParam(req.query.take);
    const skip = parseNumberParam(req.query.skip);
    const withCount = String(req.query.withCount ?? '').toLowerCase() === 'true';

    if (name === 'financialTransaction') {
      where = normalizeDateFilters(where, ['launchDate', 'dueDate', 'paymentDate', 'createdAt', 'updatedAt']) ?? undefined;
    }

    try {
      const data = await delegate.findMany({
        where: where ?? undefined,
        include: include ?? undefined,
        orderBy: orderBy ?? undefined,
        select: select ?? undefined,
        take: take ?? undefined,
        skip: skip ?? undefined,
      });

      if (withCount) {
        const total = await delegate.count({ where: where ?? undefined });
        return res.json({ data, total });
      }

      return res.json({ data });
    } catch (error) {
      if (name === 'proposalHistory') {
        // eslint-disable-next-line no-console
        console.error('Erro ao listar proposalHistory', error);
        const prismaErr = error as any;
        return res.status(400).json({
          message: 'Erro ao buscar histórico',
          prisma: {
            code: prismaErr?.code,
            message: prismaErr?.message,
            meta: prismaErr?.meta,
          },
        });
      }
      throw error;
    }
  }),
);

router.get(
  '/:model/:id',
  asyncHandler(async (req, res) => {
    const { name, delegate } = resolveModel(req);
    const include = parseJSONParam<Record<string, unknown>>(req.query.include);
    const select = parseJSONParam<Record<string, unknown>>(req.query.select);
    const where = buildPrimaryWhere(req, name);

    const item = await delegate.findUnique({
      where,
      include: include ?? undefined,
      select: select ?? undefined,
    });

    if (!item) {
      throw notFound(`Registro de ${name} não encontrado`);
    }

    return res.json(item);
  }),
);

router.post(
  '/:model',
  asyncHandler(async (req, res) => {
    const { name, delegate } = resolveModel(req);
    const include = parseJSONParam<Record<string, unknown>>(req.query.include);
    const select = parseJSONParam<Record<string, unknown>>(req.query.select);
    const data =
      name === 'studioTemplate'
        ? (req.body as Record<string, unknown>)
        : ((req.body?.data ?? req.body) as Record<string, unknown>);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw badRequest('Envie um JSON com os dados do registro');
    }

    if (name === 'proposalService') {
      normalizeProposalServiceDates(data);
      normalizeProposalServiceRelations(data, { allowRelation: false });
    }
    if (name === 'customItinerary') {
      normalizeDateOnlyFields(data, ['startDate', 'endDate']);
    }
    if (name === 'task') {
      normalizeDateOnlyFields(data, ['startDate', 'dueDate']);
      if (!('startDate' in data)) {
        data.startDate = new Date();
      }
    }
    if (name === 'itineraryDay') {
      normalizeDateOnlyFields(data, ['date']);
    }
    if (name === 'client') {
      normalizeDateOnlyFields(data, ['birthDate'], '12:00');
    }
    if (name === 'itineraryItem') {
      normalizeTimeOnlyFields(data, ['startTime', 'endTime']);
      // ensure we don't leak date-only fields into the payload
      delete (data as any).startDate;
      delete (data as any).endDate;
    }
    if (name === 'studioTemplate') {
      normalizeStudioTemplatePayload(data);
      // Fallbacks from headers/query for agency/user
      if (!data.agencyId) {
        const headerAgency = req.headers['x-agency-id'] as string | undefined;
        const queryAgency = req.query.agencyId as string | undefined;
        data.agencyId = headerAgency ?? queryAgency ?? data.agencyId ?? null;
      }
      if (!data.createdById) {
        const headerUser = req.headers['x-user-id'] as string | undefined;
        data.createdById = headerUser ?? data.createdById ?? null;
      }
    }

    try {
      const created = await delegate.create({
        data,
        include: include ?? undefined,
        select: select ?? undefined,
      });

      if (name === 'task') {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? created.createdById ?? null;
        void addTaskHistory(prisma, created.id, userId, 'Criação', { details: 'Tarefa criada' });
      }
      if (name === 'taskComment') {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? (created as any)?.userId ?? null;
        void addTaskHistory(prisma, (created as any).taskId, userId, 'Comentário', { details: `Comentário adicionado: ${(created as any).content ?? ''}` });
      }
      if (name === 'taskChecklist') {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? (created as any)?.createdBy ?? null;
        void addTaskHistory(prisma, (created as any).taskId, userId, 'Checklist', { details: `Checklist: ${(created as any).title}` });
      }
      if (name === 'taskChecklistItem') {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
        let taskId =
          (created as any).taskId ??
          (created as any).checklist?.taskId ??
          (data as any)?.taskId ??
          null;
        if (!taskId && (data as any)?.checklistId) {
          const parent = await prisma.taskChecklist.findUnique({
            where: { id: (data as any).checklistId },
            select: { taskId: true },
          });
          taskId = parent?.taskId ?? null;
        }
        void addTaskHistory(prisma, taskId ?? '', userId, 'Checklist', {
          details: `Item adicionado: ${(created as any).content}`,
        });
      }
      if (name === 'taskFile') {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
        void addTaskHistory(prisma, (created as any).taskId, userId, 'Arquivo', {
          details: `Arquivo anexado: ${(created as any).caption ?? ''}`,
        });
      }
      return res.status(201).json(created);
    } catch (error) {
      if (name === 'proposalHistory') {
        // Log and return richer context to debug timeline errors
        // eslint-disable-next-line no-console
        console.error('Erro ao criar proposalHistory', error);
        const prismaErr = error as any;
        return res.status(400).json({
          message: 'Erro ao salvar histórico',
          prisma: {
            code: prismaErr?.code,
            message: prismaErr?.message,
            meta: prismaErr?.meta,
          },
        });
      }
      throw error;
    }
  }),
);

router.put(
  '/:model/:id?',
  asyncHandler(async (req, res) => {
    const { name, delegate } = resolveModel(req);
    const include = parseJSONParam<Record<string, unknown>>(req.query.include);
    const select = parseJSONParam<Record<string, unknown>>(req.query.select);
    const where = buildPrimaryWhere(req, name);
    const data =
      name === 'studioTemplate'
        ? (req.body as Record<string, unknown>)
        : ((req.body?.data ?? req.body) as Record<string, unknown>);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw badRequest('Envie um JSON com os campos a serem atualizados');
    }

    if (name === 'proposalService') {
      normalizeProposalServiceDates(data);
      normalizeProposalServiceRelations(data);
    }
    if (name === 'customItinerary') {
      normalizeDateOnlyFields(data, ['startDate', 'endDate']);
    }
    if (name === 'task') {
      normalizeDateOnlyFields(data, ['startDate', 'dueDate']);
    }
    if (name === 'itineraryDay') {
      normalizeDateOnlyFields(data, ['date']);
    }
    if (name === 'client') {
      normalizeDateOnlyFields(data, ['birthDate'], '12:00');
    }
    if (name === 'itineraryItem') {
      normalizeTimeOnlyFields(data, ['startTime', 'endTime']);
      delete (data as any).startDate;
      delete (data as any).endDate;
    }
    if (name === 'studioTemplate') {
      normalizeStudioTemplatePayload(data, { partial: true });
      if (!data.agencyId) {
        const headerAgency = req.headers['x-agency-id'] as string | undefined;
        const queryAgency = req.query.agencyId as string | undefined;
        data.agencyId = headerAgency ?? queryAgency ?? data.agencyId ?? null;
      }
      if (!data.createdById) {
        const headerUser = req.headers['x-user-id'] as string | undefined;
        data.createdById = headerUser ?? data.createdById ?? null;
      }
    }
    // Remove updatedAt if model doesn't have it
    if (!('updatedAt' in delegate)) {
      delete (data as any).updatedAt;
    }

    const beforeTask =
      name === 'task'
        ? await prisma.task.findUnique({
            where,
            select: {
              title: true,
              description: true,
              startDate: true,
              dueDate: true,
              columnId: true,
              priority: true,
              tags: true,
              clientId: true,
              proposalId: true,
              assignees: { select: { userId: true } },
            },
          })
        : null;

    const updated = await delegate.update({
      where,
      data,
      include: include ?? undefined,
      select: select ?? undefined,
    });

    if (name === 'task') {
      const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
      // Registrar diffs
      if (beforeTask) {
        const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
        const after = updated as any;
        const asString = (val: any) => {
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return val.join(', ');
          return String(val);
        };

        const compare = (field: string, oldVal: any, newVal: any) => {
          if (asString(oldVal) !== asString(newVal)) {
            changes.push({ field, oldValue: asString(oldVal), newValue: asString(newVal) });
          }
        };

        compare('Título', beforeTask.title, after.title);
        compare('Descrição', beforeTask.description, after.description);
        compare('Início', beforeTask.startDate, after.startDate);
        compare('Prazo', beforeTask.dueDate, after.dueDate);
        compare('Prioridade', beforeTask.priority, after.priority);
        compare('Tags', beforeTask.tags ?? [], after.tags ?? []);
        compare('Cliente', beforeTask.clientId, after.clientId);
        compare('Cotação', beforeTask.proposalId, after.proposalId);
        // Responsáveis com nomes legíveis
        const incomingAssignees =
          (data as any).assigneeIds ??
          (data as any).assignee_ids ??
          ((data as any).assignees?.create?.map((c: any) => c.userId).filter(Boolean) as string[] | undefined) ??
          null;
        const beforeAssignees = (beforeTask.assignees || []).map((a) => a.userId).filter(Boolean).sort();
        const afterAssignees = incomingAssignees
          ? (incomingAssignees as string[]).filter(Boolean).sort()
          : (after.assignees || []).map((a: any) => a.userId || a.user?.id).filter(Boolean).sort();
        if (asString(beforeAssignees) !== asString(afterAssignees)) {
          const allIds = Array.from(new Set([...beforeAssignees, ...afterAssignees]));
          const users = await prisma.user.findMany({
            where: { id: { in: allIds } },
            select: { id: true, name: true, email: true },
          });
          const displayNames = (ids: string[]) =>
            ids.length === 0
              ? '—'
              : ids
                  .map((id) => users.find((u) => u.id === id)?.name || users.find((u) => u.id === id)?.email || id)
                  .join(', ');
          changes.push({
            field: 'Responsáveis',
            oldValue: displayNames(beforeAssignees),
            newValue: displayNames(afterAssignees),
          });
        }
        // Coluna com nomes
        if (beforeTask.columnId !== after.columnId) {
          const colIds = [beforeTask.columnId, after.columnId].filter(Boolean);
          const cols = await prisma.taskColumn.findMany({
            where: { id: { in: colIds as string[] } },
            select: { id: true, name: true },
          });
          const nameFor = (id: string | null | undefined) => cols.find((c) => c.id === id)?.name ?? id ?? '';
          changes.push({
            field: 'Coluna',
            oldValue: nameFor(beforeTask.columnId),
            newValue: nameFor(after.columnId),
          });
        }

        for (const change of changes) {
          void addTaskHistory(prisma, updated.id, userId, 'Alteração', {
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          });
        }
      }
    }
    if (name === 'taskChecklistItem' && 'isDone' in data) {
      const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
      let taskId =
        (updated as any).taskId ??
        (updated as any).checklist?.taskId ??
        null;
      if (!taskId && (updated as any).checklistId) {
        const parent = await prisma.taskChecklist.findUnique({
          where: { id: (updated as any).checklistId },
          select: { taskId: true },
        });
        taskId = parent?.taskId ?? null;
      }
      void addTaskHistory(prisma, taskId ?? '', userId, 'Checklist', {
        details: `Item ${(data as any).isDone ? 'concluído' : 'reaberto'}: ${(updated as any).content}`,
      });
    }

    return res.json(updated);
  }),
);

router.delete(
  '/:model/:id?',
  asyncHandler(async (req, res) => {
    const { name, delegate } = resolveModel(req);
    const where = buildPrimaryWhere(req, name);

    if (name === 'taskComment') {
      const existing = await prisma.taskComment.findUnique({ where });
      if (existing) {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? existing.userId ?? null;
        void addTaskHistory(prisma, existing.taskId, userId, 'Comentário', { details: `Comentário removido: ${existing.content ?? ''}` });
      }
    }
    if (name === 'taskChecklist') {
      const existing = await prisma.taskChecklist.findUnique({ where });
      if (existing) {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? existing.createdBy ?? null;
        void addTaskHistory(prisma, existing.taskId, userId, 'Checklist', { details: `Checklist removida: ${existing.title}` });
      }
    }
    if (name === 'taskChecklistItem') {
      const existing = await prisma.taskChecklistItem.findUnique({ where, include: { checklist: { select: { taskId: true, title: true } } } });
      if (existing) {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
        void addTaskHistory(
          prisma,
          existing.checklist?.taskId ?? (existing as any).taskId ?? '',
          userId,
          'Checklist',
          { details: `Item removido: ${existing.content}` },
        );
      }
    }
    if (name === 'taskFile') {
      const existing = await prisma.taskFile.findUnique({ where });
      if (existing) {
        const userId = (req.headers['x-user-id'] as string | undefined) ?? null;
        void addTaskHistory(prisma, existing.taskId, userId, 'Arquivo', {
          details: `Arquivo removido: ${existing.caption ?? ''}`,
        });
      }
    }
    await delegate.delete({ where });
    return res.status(204).send();
  }),
);

export const modelRouter = router;
