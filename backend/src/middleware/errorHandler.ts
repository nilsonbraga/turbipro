import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaPayload = {
      code: err.code,
      message: err.message,
      meta: err.meta,
    };

    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Registro duplicado para um campo único',
        target: err.meta?.target,
        prisma: prismaPayload,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'Registro não encontrado',
        cause: err.meta?.cause,
        prisma: prismaPayload,
      });
    }

    if (err.code === 'P2003') {
      return res.status(400).json({
        message: 'Violação de integridade referencial',
        target: err.meta?.field_name,
        prisma: prismaPayload,
      });
    }

    return res.status(400).json({
      message: 'Erro de requisição Prisma',
      prisma: prismaPayload,
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: 'Dados inválidos para o modelo Prisma', details: err.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({
    message: 'Erro interno do servidor',
    error:
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : String(err),
  });
};
