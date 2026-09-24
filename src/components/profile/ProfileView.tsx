import React, { useState, useEffect } from 'react';
import { User as UserIcon, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export const ProfileView: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [activeTab, setActiveTab] = useState<'dados' | 'senha'>('dados');

  // Personal data
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [matricula, setMatricula] = useState(user?.matricula || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [materias, setMaterias] = useState(user?.materias_responsavel || '');
  const [fotoPerfil, setFotoPerfil] = useState(user?.foto_perfil || '');

  // Password data
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
      setMatricula(user.matricula || '');
      setTelefone(user.telefone || '');
      setMaterias(user.materias_responsavel || '');
      setFotoPerfil(user.foto_perfil || '');
    }
  }, [user]);

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      setFeedback({ type: 'error', message: 'O nome completo é obrigatório.' });
      return;
    }

    setFeedback(null);
    setIsLoading(true);

    try {
      const res = await api.updateProfile({
        nome,
        telefone,
        matricula,
        materias_responsavel: materias,
        foto_perfil: fotoPerfil
      });

      if (res.success && res.user) {
        updateUserContext(res.user);
        setFeedback({ type: 'success', message: 'Dados pessoais atualizados com sucesso!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar dados pessoais.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha) {
      setFeedback({ type: 'error', message: 'Preencha a senha atual e a nova senha.' });
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setFeedback({ type: 'error', message: 'A confirmação de senha não coincide.' });
      return;
    }

    setFeedback(null);
    setIsLoading(true);

    try {
      const res = await api.changePassword({
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
        confirmar_nova_senha: confirmarNovaSenha
      });

      setFeedback({ type: 'success', message: res.message || 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar senha.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Title matching Figma: "Meu perfil" */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Meu perfil
        </h1>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Container Card from Figma: Perfil - Participante.png */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Tabs: "Dados pessoais" | "Alterar senha" */}
        <div className="flex items-center gap-8 px-6 pt-6 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dados');
              setFeedback(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'dados'
                ? 'border-[#168038] text-[#168038]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Dados pessoais
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('senha');
              setFeedback(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'senha'
                ? 'border-[#168038] text-[#168038]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Alterar senha
          </button>
        </div>

        {/* Tab 1: Dados Pessoais */}
        {activeTab === 'dados' && (
          <form onSubmit={handleSavePersonalData} className="p-6 sm:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left: Avatar with "Alterar foto" link */}
              <div className="md:col-span-4 flex flex-col items-center justify-center pt-2">
                <div className="w-32 h-32 rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center overflow-hidden relative group">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt={nome} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-neutral-300 stroke-[1.25]" />
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-semibold">Upload</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <label className="mt-3 text-xs font-bold text-[#168038] hover:underline cursor-pointer">
                  Alterar foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              {/* Right: Form Inputs */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
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
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 cursor-not-allowed outline-none"
                  />
                </div>

                {user?.perfil === 'PARTICIPANTE' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Matrícula (Caso for estudante da instituição)
                    </label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="123456789101112"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(88) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
                  />
                </div>

                {user?.perfil === 'PROFESSOR' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Responsável por Matérias
                    </label>
                    <input
                      type="text"
                      value={materias}
                      onChange={(e) => setMaterias(e.target.value)}
                      placeholder="LDS ARQM"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button matching Figma: "Salvar alterações" */}
            <div className="pt-4 flex justify-end border-t border-neutral-100">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Alterar Senha (Figma: Alterar Senha - Participante.png) */}
        {activeTab === 'senha' && (
          <form onSubmit={handleSavePassword} className="p-6 sm:p-10 max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Senha atual
              </label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nova senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:border-[#168038] focus:ring-2 focus:ring-[#168038]/20 text-sm text-neutral-900 outline-none transition-all"
                required
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
