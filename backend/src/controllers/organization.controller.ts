import { Prisma, UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendMessage, sendSuccess } from "../utils/response.js";
import { toSlug } from "../utils/slug.js";

const orgCounts = async (organizationIds: string[]) => {
  const [userGroups, flagGroups] = await Promise.all([
    prisma.user.groupBy({
      by: ["organizationId", "role"],
      where: { organizationId: { in: organizationIds } },
      _count: true,
    }),
    prisma.featureFlag.groupBy({
      by: ["organizationId"],
      where: { organizationId: { in: organizationIds } },
      _count: true,
    }),
  ]);

  return organizationIds.map((organizationId) => ({
    organizationId,
    adminCount: userGroups.find((item) => item.organizationId === organizationId && item.role === UserRole.ORG_ADMIN)?._count ?? 0,
    userCount: userGroups.find((item) => item.organizationId === organizationId && item.role === UserRole.END_USER)?._count ?? 0,
    flagCount: flagGroups.find((item) => item.organizationId === organizationId)?._count ?? 0,
  }));
};

export const createOrganization = async (req: Request, res: Response) => {
  const { name } = req.body;
  const slug = req.body.slug ?? toSlug(name);

  try {
    const organization = await prisma.organization.create({
      data: { name, slug },
    });

    sendMessage(res, 201, "Organization created successfully", organization);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "SLUG_ALREADY_EXISTS", "Organization slug already in use");
    }

    throw error;
  }
};

export const listOrganizations = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
  const where = search
    ? {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.count({ where }),
  ]);
  const counts = await orgCounts(organizations.map((organization) => organization.id));

  sendSuccess(res, 200, {
    organizations: organizations.map((organization) => {
      const count = counts.find((item) => item.organizationId === organization.id);
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        adminCount: count?.adminCount ?? 0,
        userCount: count?.userCount ?? 0,
        flagCount: count?.flagCount ?? 0,
        createdAt: organization.createdAt,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getOrganization = async (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        where: { role: UserRole.ORG_ADMIN },
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!organization) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Organization does not exist");
  }

  const [flagCount, userCount] = await Promise.all([
    prisma.featureFlag.count({ where: { organizationId: orgId } }),
    prisma.user.count({ where: { organizationId: orgId, role: UserRole.END_USER } }),
  ]);

  sendSuccess(res, 200, {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    admins: organization.users,
    flagCount,
    userCount,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  });
};

export const deleteOrganization = async (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  const organization = await prisma.organization.findUnique({ where: { id: orgId } });

  if (!organization) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Organization does not exist");
  }

  const [deletedUsers, deletedFlags] = await Promise.all([
    prisma.user.count({ where: { organizationId: orgId } }),
    prisma.featureFlag.count({ where: { organizationId: orgId } }),
  ]);

  await prisma.organization.delete({ where: { id: orgId } });

  sendMessage(res, 200, "Organization and all associated data deleted successfully", {
    deletedOrganization: orgId,
    deletedUsers,
    deletedFlags,
  });
};
