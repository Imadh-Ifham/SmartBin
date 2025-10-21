import { useNavigate } from "react-router-dom";
import { LoginPage } from "./login";
import { RegisterPage } from "./register";
import { useLogin, useRegister } from "../../api/auth/useAuth";
import { toast } from "react-hot-toast";

export const LoginScreen = () => {
  const navigate = useNavigate();
  const login = useLogin();
  return (
    <LoginPage
      onLogin={async (credentials) => {
        try {
          const res = await login.mutateAsync(credentials);
          const display = res.user.fullName || res.user.username || res.user.email;
          toast.success(`Login successful. Welcome back, ${display}!`);

          // Persist basic session info for route guards and UI
          try {
            localStorage.setItem("role", res.user.role);
            localStorage.setItem("username", res.user.username || res.user.email || "");
            localStorage.setItem("loginTime", new Date().toISOString());
          } catch (err) {
            // ignore storage errors
          }

          // Send admin/authority users to admin dashboard, others to home
          if (res.user.role === "admin" || res.user.role === "authority") {
            navigate("/admin/dashboard");
          } else {
            navigate("/home");
          }
        } catch (e: any) {
          const msg =
            e?.response?.data?.message || "Please check your credentials.";
          toast.error(`Login failed. ${msg}`);
        }
      }}
      onSwitchToRegister={() => navigate("/register")}
    />
  );
};

export const RegisterScreen = () => {
  const navigate = useNavigate();
  const register = useRegister();
  return (
    <RegisterPage
      onRegister={async (data) => {
        try {
          const res = await register.mutateAsync(data);
          const display = res.user.fullName || res.user.username;
          toast.success(`Registration successful. Welcome, ${display}!`);
          navigate("/home");
        } catch (e: any) {
          const msg = e?.response?.data?.message || "Please try again.";
          toast.error(`Registration failed. ${msg}`);
        }
      }}
      onSwitchToLogin={() => navigate("/login")}
    />
  );
};
