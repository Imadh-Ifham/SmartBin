import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(username: string, password: string, role: IUser["role"]) {
    // disallow creating admin via public register - admin is managed separately
    if (role === "admin") throw new Error("Cannot register admin user");

    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new Error("Username already exists");
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });
  }

  async login(username: string, password: string) {
    // First, check for reserved admin credentials (fixed admin login via ENV)
    const envAdminUser = process.env.ADMIN_USERNAME ?? "admin";
    const envAdminPass = process.env.ADMIN_PASSWORD ?? "admin123";

    if (username === envAdminUser) {
      // validate against ENV password (no DB lookup required)
      if (password !== envAdminPass) throw new Error("Invalid password");
      const token = jwt.sign(
        { id: "admin", role: "admin" },
        process.env.JWT_SECRET || "defaultsecret",
        { expiresIn: "1h" }
      );
      return { token, role: "admin", username: envAdminUser };
    }

    // fallback to normal DB-backed users
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new Error("Invalid username");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );

    return { token, role: user.role, username: user.username };
  }
}
