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
          toast.success(
            `Login successful. Welcome back, ${res.user.username}!`
          );
          navigate("/home");
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
          const idMsg =
            res.user.residentId || res.user.collectorId || res.user.authorityId;
          toast.success(
            idMsg
              ? `Registration successful. Your ID: ${idMsg}`
              : "Registration successful. Account created!"
          );
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
