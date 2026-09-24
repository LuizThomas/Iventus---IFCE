import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RegisterViewProps {
  onNavigate: (view: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [perfil, setPerfil] = useState<UserRole>('PARTICIPANTE');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha || !confirmarSenha) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('A confirmação de senha não coincide com a senha informada.');
      return;
    }

    if (senha.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (!termosAceitos) {
      setError('Você deve aceitar os Termos de Uso e a Política de Privacidade para se cadastrar.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register({
        nome,
        email,
        matricula,
        perfil,
        senha,
        confirmar_senha: confirmarSenha
      });
      onNavigate(perfil === 'PROFESSOR' ? 'professor_events' : 'events');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-6 text-left">
          Criar sua conta
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
              Nome completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Luiz Thomas Marte Moreira"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
              required
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Matrícula (opcional)
              </label>
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="123456789101112"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Perfil
              </label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 bg-white outline-none transition-all"
              >
                <option value="PARTICIPANTE">Participante / Aluno</option>
                <option value="PROFESSOR">Professor / Organizador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Senha
              </label>
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="termos"
              checked={termosAceitos}
              onChange={(e) => setTermosAceitos(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#168038] rounded cursor-pointer"
            />
            <label htmlFor="termos" className="text-xs text-neutral-600 leading-relaxed cursor-pointer">
              Li e aceito os{' '}
              <a href="#termos" className="text-[#168038] underline font-medium" onClick={(e) => e.preventDefault()}>
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#privacidade" className="text-[#168038] underline font-medium" onClick={(e) => e.preventDefault()}>
                Política de Privacidade
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm mt-3"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600 border-t border-neutral-100 pt-4">
          <p>
            Já possui uma conta?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-bold text-[#168038] hover:underline"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
