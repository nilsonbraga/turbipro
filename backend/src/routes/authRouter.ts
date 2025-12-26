import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { badRequest, HttpError } from '../utils/httpError';
import { env } from '../config/env';

const router = Router();

type LoginPayload = {
  email?: string;
  password?: string;
};

const isBcryptHash = (value: string | null | undefined) => {
  if (!value) return false;
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
};

const mapProfile = (profile: any | null) =>
  profile
    ? {
        id: profile.id,
        agencyId: profile.agencyId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      }
    : null;

const mapAgency = (agency: any | null) =>
  agency
    ? {
        id: agency.id,
        name: agency.name,
        cnpj: agency.cnpj,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        logoUrl: agency.logoUrl,
        isActive: agency.isActive,
      }
    : null;

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginPayload;

    if (!email || !password) {
      throw badRequest('Email e senha são obrigatórios');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        roles: true,
      },
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, 'Credenciais inválidas');
    }

    const storedHash = user.passwordHash;
    let passwordMatches = false;

    if (storedHash) {
      if (isBcryptHash(storedHash)) {
        passwordMatches = await bcrypt.compare(password, storedHash);
      } else {
        passwordMatches = storedHash === password;
      }
    }

    if (!passwordMatches) {
      throw new HttpError(401, 'Credenciais inválidas');
    }

    const role = user.roles?.[0]?.role ?? 'agent';
    const token = jwt.sign(
      {
        sub: user.id,
        role,
      },
      env.jwtSecret,
      { expiresIn: '7d' },
    );

    const profile = mapProfile(user.profile);
    const agency = profile?.agencyId
      ? await prisma.agency.findUnique({ where: { id: profile.agencyId } })
      : null;

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        isActive: user.isActive,
        role,
      },
      profile,
      agency: mapAgency(agency),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new HttpError(401, 'Token não informado');
    }

    let payload: any;
    try {
      payload = jwt.verify(token, env.jwtSecret) as { sub: string; role?: string };
    } catch {
      throw new HttpError(401, 'Token inválido');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, roles: true },
    });

    if (!user) {
      throw new HttpError(401, 'Usuário não encontrado');
    }

    const role = payload.role ?? user.roles?.[0]?.role ?? 'agent';
    const profile = mapProfile(user.profile);
    const agency = profile?.agencyId
      ? await prisma.agency.findUnique({ where: { id: profile.agencyId } })
      : null;

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        isActive: user.isActive,
        role,
      },
      profile,
      agency: mapAgency(agency),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { email, password, name, phone, role = 'agent', agencyId, collaboratorId } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      role?: 'admin' | 'agent';
      agencyId?: string;
      collaboratorId?: string;
    };

    if (!email || !password || !agencyId) {
      throw badRequest('Informe email, senha e agencyId');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        phone: phone ?? null,
        isActive: true,
        profile: {
          create: {
            agencyId,
            name: name ?? null,
            email,
            phone: phone ?? null,
          },
        },
        roles: {
          create: { role },
        },
      },
      include: {
        roles: true,
        profile: true,
      },
    });

    if (collaboratorId) {
      await prisma.collaborator.update({
        where: { id: collaboratorId },
        data: { userId: user.id },
      });
    }

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.roles?.[0]?.role ?? 'agent',
      profile: mapProfile(user.profile),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: 'admin' | 'agent' | 'super_admin' };

    if (!role) {
      throw badRequest('Informe o papel');
    }

    // Remove outros papéis (exceto super_admin se já existir)
    await prisma.userRole.deleteMany({
      where: {
        userId: id,
        NOT: { role },
      },
    });

    await prisma.userRole.upsert({
      where: { userId_role: { userId: id, role } },
      update: {},
      create: { userId: id, role },
    });

    return res.json({ userId: id, role });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body as { password?: string };

    if (!password || password.length < 6) {
      throw badRequest('Informe uma senha com pelo menos 6 caracteres');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, updatedAt: new Date() },
    });

    return res.json({ userId: id, updated: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Remove vínculo em colaboradores
    await prisma.collaborator.updateMany({
      where: { userId: id },
      data: { userId: null },
    });
    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
