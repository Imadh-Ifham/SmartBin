import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate form
  useEffect(() => {
    setIsValid(username.trim().length > 0 && password.length >= 3);
  }, [username, password]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "login-error" });
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    login(username, password);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !loading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0052cc 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background shapes */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '24rem',
        height: '24rem',
        backgroundColor: 'white',
        opacity: 0.1,
        borderRadius: '9999px',
        filter: 'blur(3rem)',
        animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '24rem',
        height: '24rem',
        backgroundColor: 'var(--color-accent)',
        opacity: 0.1,
        borderRadius: '9999px',
        filter: 'blur(3rem)',
        animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        animationDelay: '2s'
      }}></div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '28rem', padding: '0 1rem' }}>
        {/* Header Card */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            backgroundColor: 'white',
            borderRadius: 'var(--border-radius-2xl)',
            marginBottom: '1rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            <Lock style={{ width: '2rem', height: '2rem', color: 'var(--color-secondary)', strokeWidth: 1.5 }} />
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'white',
            marginBottom: '0.5rem'
          }}>SmartBin</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 'var(--font-size-lg)'
          }}>Admin Dashboard</p>
        </div>

        {/* Main Form Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 'var(--border-radius-2xl)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '2rem' }}>
            {/* Error Message - Enhanced */}
            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <AlertCircle style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: '#dc2626',
                  flexShrink: 0,
                  marginTop: '0.125rem'
                }} />
                <div>
                  <p style={{ color: '#7f1d1d', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Login Failed</p>
                  <p style={{ color: '#b91c1c', fontSize: 'var(--font-size-sm)', marginTop: '0.125rem' }}>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Username Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-900)',
                  marginBottom: '0.5rem'
                }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: 'var(--color-gray-400)'
                  }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="admin"
                    autoComplete="username"
                    disabled={loading}
                    style={{
                      width: '100%',
                      paddingLeft: '2.5rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: `1px solid var(--color-gray-300)`,
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'white',
                      color: 'var(--color-gray-900)',
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-base)',
                      transition: 'all var(--transition-fast)',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-secondary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-gray-300)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-900)',
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: 'var(--color-gray-400)'
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      paddingLeft: '2.5rem',
                      paddingRight: '3rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      border: `1px solid var(--color-gray-300)`,
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'white',
                      color: 'var(--color-gray-900)',
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-base)',
                      transition: 'all var(--transition-fast)',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-secondary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-gray-300)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color var(--transition-fast)',
                      opacity: loading ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gray-600)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-gray-400)'}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} />
                    ) : (
                      <Eye style={{ width: '1.25rem', height: '1.25rem' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isValid}
                className="btn btn-primary"
                style={{
                  marginTop: '2rem',
                  height: '3rem',
                  width: '100%',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }}></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
