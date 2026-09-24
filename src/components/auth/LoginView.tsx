import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { login, quickSwitchUser } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Por favor, informe e-mail e senha.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(email, senha);
      onNavigate('events');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'PARTICIPANTE' | 'PROFESSOR' | 'ADMINISTRADOR') => {
    setError(null);
    setIsLoading(true);
    try {
      await quickSwitchUser(role);
      if (role === 'PROFESSOR') onNavigate('professor_events');
      else if (role === 'ADMINISTRADOR') onNavigate('admin_events');
      else onNavigate('events');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login de teste.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-4 sm:p-8 bg-[#f8f9fa]">
      {/* Left side (Desktop): IFCE Iventus Branding from Figma */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 text-center mb-8 md:mb-0">
        <Logo variant="vertical" size="lg" showSubtitle={true} className="scale-110 sm:scale-125" />
      </div>

      {/* Right side: Login Card (Figma: Login - Todos.png) */}
      <div className="w-full md:w-1/2 max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 sm:p-10">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 text-left">
            Entrar na sua conta
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="luiz.thomas@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Senha
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('forgot_password')}
                  className="text-xs font-medium text-neutral-500 hover:text-[#168038] transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm mt-2"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-[#168038] hover:underline"
              >
                Cadastre-se
              </button>
            </p>
            <p>
              Esqueceu sua senha?{' '}
              <button
                type="button"
                onClick={() => onNavigate('forgot_password')}
                className="font-bold text-[#168038] hover:underline"
              >
                Recuperar senha
              </button>
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-center mb-2">
              Acesso Rápido para Avaliação:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('PARTICIPANTE')}
                className="py-1.5 px-2 bg-neutral-50 hover:bg-[#e8f5e9] text-neutral-700 hover:text-[#168038] border border-neutral-200 rounded text-xs font-medium transition-colors"
              >
                Aluno
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('PROFESSOR')}
                className="py-1.5 px-2 bg-neutral-50 hover:bg-[#e8f5e9] text-neutral-700 hover:text-[#168038] border border-neutral-200 rounded text-xs font-medium transition-colors"
              >
                Professor
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMINISTRADOR')}
                className="py-1.5 px-2 bg-neutral-50 hover:bg-[#e8f5e9] text-neutral-700 hover:text-[#168038] border border-neutral-200 rounded text-xs font-medium transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
