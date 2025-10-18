import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { username, password, role } = req.body;
      const user = await this.authService.register(username, password, role);
      res.status(201).json({ message: "User created", user: { id: user._id, username: user.username, role: user.role } });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  };
}
