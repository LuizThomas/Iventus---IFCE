import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface ResetPasswordViewProps {
  token?: string;
  onNavigate: (view: string) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token = '', onNavigate }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha || !confirmarNovaSenha) {
      setError('Preencha a nova senha e a confirmação.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setError('A confirmação não coincide com a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.resetPassword({
        token,
        nova_senha: novaSenha,
        confirmar_nova_senha: confirmarNovaSenha
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 sm:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-6">
          Criação da nova senha
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Senha Alterada com Sucesso!</span>
              </div>
              <p>Sua senha foi redefinida com segurança. Você já pode fazer login na plataforma.</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] text-white font-semibold rounded-lg shadow-sm transition-all text-sm"
            >
              Fazer Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nova senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm mt-3 text-center"
            >
              {isLoading ? 'Salvando...' : 'Pronto'}
            </button>

            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-[#168038] hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
