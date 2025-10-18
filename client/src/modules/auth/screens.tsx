import { useNavigate } from "react-router-dom";
import { LoginPage } from "./login";
import { RegisterPage } from "./register";

export const LoginScreen = () => {
  const navigate = useNavigate();
  return (
    <LoginPage
      onLogin={() => navigate("/home")}
      onSwitchToRegister={() => navigate("/register")}
    />
  );
};

export const RegisterScreen = () => {
  const navigate = useNavigate();
  return (
    <RegisterPage
      onRegister={() => navigate("/home")}
      onSwitchToLogin={() => navigate("/login")}
    />
  );
};
