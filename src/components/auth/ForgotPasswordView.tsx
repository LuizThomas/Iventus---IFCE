import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

interface ForgotPasswordViewProps {
  onNavigate: (view: string, token?: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; devToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, digite seu e-mail.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setSuccessInfo({
        message: res.message,
        devToken: res.devToken
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 sm:p-10 text-center">
        {/* Mail Icon in Circle */}
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6 text-neutral-600">
          <Mail className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h2 className="text-2xl font-black text-neutral-900 mb-2">
          Recuperar senha
        </h2>

        <p className="text-xs text-neutral-500 mb-6 max-w-xs mx-auto">
          Digite seu e-mail para receber um link de recuperação de senha.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successInfo ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Link Gerado com Sucesso!</span>
              </div>
              <p>{successInfo.message}</p>
            </div>

            {successInfo.devToken && (
              <button
                type="button"
                onClick={() => onNavigate('reset_password', successInfo.devToken)}
                className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] text-white font-semibold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>Avançar para Criação da Nova Senha</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-xs font-semibold text-[#168038] hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm mt-2 text-center"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
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
