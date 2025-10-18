import { useState } from "react";
import {
  User,
  Lock,
  Recycle,
  Home,
  Truck,
  Building2,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type { RegisterData, UserRole } from "./types/auth";

interface RegisterPageProps {
  onRegister: (data: RegisterData) => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({
  onRegister,
  onSwitchToLogin,
}: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("resident");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onRegister({ username, password, confirmPassword, role });
    }
  };

  const roles = [
    {
      id: "resident" as UserRole,
      label: "Resident",
      icon: Home,
      description: "Manage your waste collection and billing",
    },
    {
      id: "collector" as UserRole,
      label: "Collector",
      icon: Truck,
      description: "Access collection routes and schedules",
    },
    {
      id: "authority" as UserRole,
      label: "Authority",
      icon: Building2,
      description: "Oversee operations and compliance",
    },
    {
      id: "admin" as UserRole,
      label: "Admin",
      icon: Shield,
      description: "Full system access (Internal only)",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Eco illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-50 to-emerald-100 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 text-green-600 text-9xl">
            ♻️
          </div>
          <div className="absolute bottom-32 right-32 text-green-600 text-8xl">
            🗑️
          </div>
          <div className="absolute top-1/2 right-1/4 text-green-600 text-7xl">
            🌱
          </div>
          <div className="absolute bottom-20 left-1/3 text-green-600 text-6xl">
            🏙️
          </div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Recycle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-gray-900 mb-4">EcoWaste Management Portal</h2>
          <p className="text-gray-700" style={{ fontSize: "18px" }}>
            Join our community-driven platform for efficient waste management
            and a greener future.
          </p>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Recycle className="w-8 h-8 text-green-600" />
            <h3 className="text-gray-900">EcoWaste Portal</h3>
          </div>

          <div className="mb-8">
            <h1 className="text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">
              Join the EcoWaste system and manage your services.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.username && (
                <p className="text-red-600 mt-1" style={{ fontSize: "13px" }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-red-600 mt-1" style={{ fontSize: "13px" }}>
                  {errors.password}
                </p>
              )}
              <p className="text-gray-500 mt-1" style={{ fontSize: "12px" }}>
                💡 Password must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password field */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 mt-1" style={{ fontSize: "13px" }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role selection */}
            <div>
              <Label>Select Your Role</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                className="mt-3"
              >
                <div className="space-y-2">
                  {roles.map((roleOption) => {
                    const Icon = roleOption.icon;
                    const isDisabled = (roleOption as any).disabled as
                      | boolean
                      | undefined;

                    return (
                      <TooltipProvider key={roleOption.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label
                              className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                role === roleOption.id && !isDisabled
                                  ? "border-green-600 bg-green-50"
                                  : isDisabled
                                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <RadioGroupItem
                                value={roleOption.id}
                                id={roleOption.id}
                                disabled={isDisabled}
                                className={
                                  isDisabled ? "cursor-not-allowed" : ""
                                }
                              />
                              <Icon
                                className={`w-5 h-5 ${
                                  isDisabled ? "text-gray-400" : "text-gray-600"
                                }`}
                              />
                              <div className="flex-1">
                                <p
                                  className={`${
                                    isDisabled
                                      ? "text-gray-500"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {roleOption.label}
                                  {isDisabled && (
                                    <Info className="inline w-4 h-4 ml-1" />
                                  )}
                                </p>
                                <p
                                  className="text-gray-500"
                                  style={{ fontSize: "13px" }}
                                >
                                  {roleOption.description}
                                </p>
                              </div>
                            </label>
                          </TooltipTrigger>
                          {isDisabled && (
                            <TooltipContent>
                              <p>Admin access is managed internally</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Register button */}
            <Button
              type="submit"
              className="w-full text-white"
              size="lg"
              style={{ backgroundColor: "#2E8B57" }}
            >
              Register
            </Button>

            {/* Login link */}
            <div className="text-center">
              <p className="text-gray-600" style={{ fontSize: "14px" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-green-600 hover:underline"
                  style={{ fontWeight: "500" }}
                >
                  Back to Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
