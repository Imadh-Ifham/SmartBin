import { useState } from "react";
import { Mail, Lock, Recycle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import type { LoginCredentials } from "./types/auth";

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => void;
  onSwitchToRegister: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password, rememberMe });
  };

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
            Streamlining waste collection, billing, and sustainability for
            cleaner communities.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Recycle className="w-8 h-8 text-green-600" />
            <h3 className="text-gray-900">EcoWaste Portal</h3>
          </div>

          <div className="mb-8">
            <h1 className="text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Login to manage your waste collection and billing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-gray-700 cursor-pointer"
                style={{ fontSize: "14px", fontWeight: "400" }}
              >
                Remember me
              </label>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              className="w-full text-white"
              size="lg"
              style={{ backgroundColor: "#2E8B57" }}
            >
              Login
            </Button>

            {/* Info note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p
                className="text-blue-900 text-center"
                style={{ fontSize: "13px" }}
              >
                ℹ️ Only registered residents, collectors, and authorities can
                log in.
              </p>
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-gray-600" style={{ fontSize: "14px" }}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-green-600 hover:underline"
                  style={{ fontWeight: "500" }}
                >
                  Register Now
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
