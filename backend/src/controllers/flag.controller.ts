import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendMessage, sendSuccess } from "../utils/response.js";

const getOrganizationId = (req: Request) => {
  if (!req.user?.organizationId) {
    throw new AppError(403, "FORBIDDEN", "Organization-scoped account required");
  }

  return req.user.organizationId;
};

const findFlagForAdmin = async (flagId: string, organizationId: string) => {
  const flag = await prisma.featureFlag.findUnique({
    where: { id: flagId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  if (!flag) {
    throw new AppError(404, "FLAG_NOT_FOUND", "Feature flag does not exist");
  }

  if (flag.organizationId !== organizationId) {
    throw new AppError(403, "FORBIDDEN", "Flag does not belong to admin's org");
  }

  return flag;
};

export const createFlag = async (req: Request, res: Response) => {
  const organizationId = getOrganizationId(req);
  const { key, description, isEnabled } = req.body;

  try {
    const flag = await prisma.featureFlag.create({
      data: {
        key,
        description,
        isEnabled: isEnabled ?? false,
        organizationId,
        createdById: req.user?.id,
      },
    });

    sendMessage(res, 201, "Feature flag created successfully", {
      id: flag.id,
      key: flag.key,
      description: flag.description,
      isEnabled: flag.isEnabled,
      organizationId: flag.organizationId,
      createdBy: flag.createdById,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "FLAG_KEY_ALREADY_EXISTS", "A flag with this key already exists in the org");
    }

    throw error;
  }
};

export const listFlags = async (req: Request, res: Response) => {
  const organizationId = getOrganizationId(req);
  const { page, limit, search, isEnabled } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    isEnabled?: boolean;
  };
  const where: Prisma.FeatureFlagWhereInput = {
    organizationId,
    ...(isEnabled === undefined ? {} : { isEnabled }),
    ...(search
      ? {
          OR: [
            { key: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [flags, total] = await Promise.all([
    prisma.featureFlag.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.featureFlag.count({ where }),
  ]);

  sendSuccess(res, 200, {
    flags: flags.map((flag) => ({
      id: flag.id,
      key: flag.key,
      description: flag.description,
      isEnabled: flag.isEnabled,
      createdBy: flag.createdBy,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getFlag = async (req: Request, res: Response) => {
  const flagId = req.params.flagId as string;
  const flag = await findFlagForAdmin(flagId, getOrganizationId(req));

  sendSuccess(res, 200, {
    id: flag.id,
    key: flag.key,
    description: flag.description,
    isEnabled: flag.isEnabled,
    organizationId: flag.organizationId,
    createdBy: flag.createdBy,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  });
};

export const updateFlag = async (req: Request, res: Response) => {
  const flagId = req.params.flagId as string;
  const organizationId = getOrganizationId(req);
  await findFlagForAdmin(flagId, organizationId);

  try {
    const flag = await prisma.featureFlag.update({
      where: { id: flagId },
      data: {
        ...(req.body.key === undefined ? {} : { key: req.body.key }),
        ...(req.body.description === undefined ? {} : { description: req.body.description }),
        ...(req.body.isEnabled === undefined ? {} : { isEnabled: req.body.isEnabled }),
      },
    });

    sendMessage(res, 200, "Feature flag updated successfully", {
      id: flag.id,
      key: flag.key,
      description: flag.description,
      isEnabled: flag.isEnabled,
      organizationId: flag.organizationId,
      createdBy: flag.createdById,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "FLAG_KEY_ALREADY_EXISTS", "Another flag with this key exists in the org");
    }

    throw error;
  }
};

export const toggleFlag = async (req: Request, res: Response) => {
  const flagId = req.params.flagId as string;
  const flag = await findFlagForAdmin(flagId, getOrganizationId(req));
  const updated = await prisma.featureFlag.update({
    where: { id: flag.id },
    data: { isEnabled: !flag.isEnabled },
  });

  sendMessage(res, 200, "Feature flag toggled successfully", {
    id: updated.id,
    key: updated.key,
    isEnabled: updated.isEnabled,
    previousState: flag.isEnabled,
  });
};

export const deleteFlag = async (req: Request, res: Response) => {
  const flagId = req.params.flagId as string;
  const flag = await findFlagForAdmin(flagId, getOrganizationId(req));

  await prisma.featureFlag.delete({ where: { id: flag.id } });

  sendMessage(res, 200, "Feature flag deleted successfully", {
    deletedFlag: flag.id,
  });
};

export const checkFlag = async (req: Request, res: Response) => {
  const organizationId = getOrganizationId(req);
  const flag = await prisma.featureFlag.findFirst({
    where: {
      organizationId,
      key: req.body.featureKey,
    },
    include: {
      organization: {
        select: { name: true },
      },
    },
  });

  if (!flag) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    sendSuccess(res, 200, {
      featureKey: req.body.featureKey,
      isEnabled: false,
      organizationId,
      organizationName: organization?.name ?? null,
    });
    return;
  }

  sendSuccess(res, 200, {
    featureKey: flag.key,
    isEnabled: flag.isEnabled,
    organizationId: flag.organizationId,
    organizationName: flag.organization.name,
  });
};
