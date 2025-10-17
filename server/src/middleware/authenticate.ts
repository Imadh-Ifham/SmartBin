import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization || req.headers.Authorization as string | undefined;
  if (!auth || !auth.startsWith("Bearer ")) {
    console.warn("authenticate: Missing or malformed Authorization header");
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = auth.split(" ")[1];
  try {
    const secret: string = process.env.JWT_SECRET ?? "defaultsecret";
    const payload = (jwt.verify as any)(token, secret) as TokenPayload;
    // attach user info into request for downstream handlers
    (req as any).user = { id: payload.id, role: payload.role };
    return next();
  } catch (err: any) {
    // Log the error type for diagnostics without printing tokens
    console.warn("authenticate: token verification failed:", err?.name || err?.message || err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
