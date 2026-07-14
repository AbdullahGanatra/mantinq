import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

export const generateRefreshToken = async (userId: string) => {
  const token = jwt.sign({ userId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; type: string };
};
