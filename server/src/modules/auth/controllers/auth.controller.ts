import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { username, email, fullName, phoneNumber, password, role } =
        req.body;
      const result = await this.authService.register(
        username,
        email,
        fullName,
        phoneNumber,
        password,
        role
      );
      res
        .cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(201)
        .json({
          accessToken: result.accessToken,
          user: result.user,
        });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      // Issue refresh token cookie and return accessToken + user
      res
        .cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({ accessToken: result.accessToken, user: result.user });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  };

  me = async (req: Request, res: Response) => {
    try {
      // By this point, authenticate middleware has set req.user
      const userInfo = await this.authService.me((req as any).user?.id);
      if (!userInfo) return res.status(404).json({ message: "User not found" });
      res.json(userInfo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const refreshToken =
        (req.cookies?.refreshToken as string | undefined) ||
        (req.body?.refreshToken as string | undefined);
      if (!refreshToken)
        return res.status(404).json({ message: "No refresh token" });
      const accessToken = await this.authService.refresh(refreshToken);
      return res.json({ accessToken });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  };

  logout = async (_req: Request, res: Response) => {
    try {
      // Clear refresh token cookie client expects
      res.clearCookie("refreshToken", { path: "/" });
      res.status(200).json({ message: "Logged out" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };
}
