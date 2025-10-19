import { Request, Response, NextFunction } from "express";

export const verifyAuthority = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = (req as any).user?.role;
  if (role === "authority" || role === "admin" || role === "collector") {
    return next();
  }
  return res.status(403).json({ error: "Unauthorized access" });
};
