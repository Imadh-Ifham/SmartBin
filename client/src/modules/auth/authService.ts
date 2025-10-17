import axios from "../../config/axiosInstance";

export class AuthService {
  async login(username: string, password: string) {
    const res = await axios.post("/auth/login", { username, password });
    return res.data;
  }
}
