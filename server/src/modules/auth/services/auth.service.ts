import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private toUserDTO(user: IUser) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
  }

  private signAccessToken(payload: { id: string; role: IUser["role"] }) {
    return (jwt.sign as any)(
      payload,
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "15m" }
    );
  }

  private signRefreshToken(payload: { id: string; role: IUser["role"] }) {
    const secret =
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      "defaultsecret";
    return (jwt.sign as any)(payload, secret, { expiresIn: "7d" });
  }

  async register(
    username: string,
    email: string,
    fullName: string,
    phoneNumber: string,
    password: string,
    role: IUser["role"]
  ) {
    if (role === "admin") throw new Error("Cannot register admin user");

    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new Error("Username already exists");
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await this.userRepository.findByEmail(
      normalizedEmail
    );
    if (existingEmail) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: Partial<IUser> = {
      username,
      email: normalizedEmail,
      fullName,
      phoneNumber: phoneNumber.trim(),
      password: hashedPassword,
      role,
    };

    const user = await this.userRepository.create(userData);

    const accessToken = this.signAccessToken({
      id: user._id.toString(),
      role: user.role,
    });
    const refreshToken = this.signRefreshToken({
      id: user._id.toString(),
      role: user.role,
    });
    return { accessToken, refreshToken, user: this.toUserDTO(user) };
  }

  async login(email: string, password: string) {
    // First, check for reserved admin credentials (fixed admin login via ENV)
    const envAdminUser = process.env.ADMIN_USERNAME ?? "admin";
    const envAdminPass = process.env.ADMIN_PASSWORD ?? "admin123";

    if (email === envAdminUser) {
      // validate against ENV password (no DB lookup required)
      if (password !== envAdminPass) throw new Error("Invalid password");
      const accessToken = this.signAccessToken({ id: "admin", role: "admin" });
      const refreshToken = this.signRefreshToken({
        id: "admin",
        role: "admin",
      });
      const userDto = {
        id: "admin",
        username: envAdminUser,
        email: envAdminUser,
        fullName: "Administrator",
        phoneNumber: "",
        role: "admin" as const,
      };
      return { accessToken, refreshToken, user: userDto };
    }

    // fallback to normal DB-backed users
    const normalized = email.trim().toLowerCase();
    let user = await this.userRepository.findByEmail(normalized);
    if (!user) {
      // Backward-compatibility: allow using username in the email field
      user = await this.userRepository.findByUsername(email);
    }
    if (!user) throw new Error("Invalid email");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password");

    const accessToken = this.signAccessToken({
      id: user._id.toString(),
      role: user.role,
    });
    const refreshToken = this.signRefreshToken({
      id: user._id.toString(),
      role: user.role,
    });
    return { accessToken, refreshToken, user: this.toUserDTO(user) };
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    return user ? this.toUserDTO(user) : null;
  }

  async refresh(refreshToken: string) {
    try {
      const secret =
        process.env.JWT_REFRESH_SECRET ||
        process.env.JWT_SECRET ||
        "defaultsecret";
      const payload = (jwt.verify as any)(refreshToken, secret) as {
        id: string;
        role: IUser["role"];
      };
      // Optionally verify user still exists
      return this.signAccessToken({ id: payload.id, role: payload.role });
    } catch (e) {
      throw new Error("Invalid refresh token");
    }
  }
}
