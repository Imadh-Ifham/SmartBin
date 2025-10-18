import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private generateRoleId(role: IUser["role"]) {
    const prefixMap: Record<IUser["role"], string> = {
      admin: "ADM",
      authority: "AUTH",
      collector: "COL",
      resident: "RES",
    };
    const prefix = prefixMap[role];
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomPart}`;
  }

  async register(username: string, password: string, role: IUser["role"]) {
    if (role === "admin") throw new Error("Cannot register admin user");

    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new Error("Username already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = this.generateRoleId(role);

    const userData: Partial<IUser> = {
      username,
      password: hashedPassword,
      role,
    };

    if (role === "resident") userData.residentId = roleId;
    if (role === "collector") userData.collectorId = roleId;
    if (role === "authority") userData.authorityId = roleId;

    const user = await this.userRepository.create(userData);
    return user;
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

    const idField =
      user.role === "resident"
        ? user.residentId
        : user.role === "collector"
        ? user.collectorId
        : user.role === "authority"
        ? user.authorityId
        : user.adminId;

    return { token, role: user.role, username: user.username, idField };
  }
}
