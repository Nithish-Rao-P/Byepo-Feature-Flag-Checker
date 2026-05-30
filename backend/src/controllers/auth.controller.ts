import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../middleware/auth.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/response.js";
import { toAuthRole, toDbRole } from "../utils/roles.js";

export const loginSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email !== env.superAdminEmail || password !== env.superAdminPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Wrong email or password");
  }

  const user = {
    id: "super_admin",
    email,
    role: "super_admin" as const,
    organizationId: null,
  };

  sendSuccess(
    res,
    200,
    {
      token: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    "Login successful",
  );
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role, organizationId } = req.body;
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });

  if (!organization) {
    throw new AppError(404, "ORGANIZATION_NOT_FOUND", "Referenced organization doesn't exist");
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: toDbRole(role),
        organizationId,
      },
      include: { organization: true },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      role: toAuthRole(user.role),
      organizationId: user.organizationId,
    };

    sendSuccess(
      res,
      201,
      {
        token: signToken(authUser),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: authUser.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
      },
      "Account created successfully",
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already registered");
    }

    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Wrong email or password");
  }

  const authUser = {
    id: user.id,
    email: user.email,
    role: toAuthRole(user.role),
    organizationId: user.organizationId,
  };

  sendSuccess(
    res,
    200,
    {
      token: signToken(authUser),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: authUser.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    },
    "Login successful",
  );
};
