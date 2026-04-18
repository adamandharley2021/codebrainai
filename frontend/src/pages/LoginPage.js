import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Terminal, Eye, EyeOff, AlertCircle } from 'lucide-react';
import MatrixRain from '../components/MatrixRain';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(' '));
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative">
      <MatrixRain />
      
      <div className="w-full max-w-md relative z-10 boot-animation">
        <div className="border border-[#00FF41]/30 bg-[#0A0A0A] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 border border-[#00FF41] flex items-center justify-center">
              <Terminal className="w-6 h-6 text-[#00FF41]" />
            </div>
            <div>
              <h1 className="font-['Outfit'] text-xl font-bold text-white">CODEBRAIN</h1>
              <p className="text-[#00FF41] text-xs tracking-[0.2em] uppercase">System Access</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-zinc-400 font-mono text-sm">
              <span className="text-[#00FF41]">$</span> initialize_login_sequence
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-400 text-sm font-mono">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@matrix.io"
                required
                data-testid="login-email-input"
                className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
                  className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41] font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#00FF41]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none h-12 matrix-btn transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">AUTHENTICATING</span>
                  <span className="cursor-blink">█</span>
                </span>
              ) : (
                'ACCESS SYSTEM'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm font-mono">
              No account?{' '}
              <Link to="/register" className="text-[#00FF41] hover:underline" data-testid="register-link">
                Initialize New User
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800">
            <Link to="/" className="text-zinc-500 text-xs hover:text-[#00FF41] font-mono flex items-center gap-2">
              <span>←</span> Return to Landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
