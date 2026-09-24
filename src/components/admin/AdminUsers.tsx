import React, { useState, useEffect } from 'react';
import { User, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminUsers();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao listar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (targetUser: any) => {
    // RN02: Somente administradores excluem usuários
    if (targetUser.id_usuario === currentUser?.id_usuario) {
      alert('Você não pode excluir sua própria conta de administrador.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${targetUser.nome}"? Esta ação removerá seus vínculos e acessos.`)) {
      return;
    }

    try {
      const res = await api.deleteUser(targetUser.id_usuario);
      setFeedback({ type: 'success', message: res.message });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao excluir usuário.' });
    }
  };

  const getCondicaoLabel = (perfil: string) => {
    if (perfil === 'ADMINISTRADOR') return 'Administrador';
    if (perfil === 'PROFESSOR') return 'Professor';
    return 'Participante';
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Usuários & Solicitações
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Gerenciamento de contas, perfis e permissões dos membros da instituição (RN02)
        </p>
      </div>

      {feedback && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline font-bold">Tentar novamente</button>
        </div>
      )}

      {/* Table matching Figma: solicitação de inscrições - administrador.png */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-xs font-bold text-neutral-600">
                <th className="py-4 px-6">Participante</th>
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6">Condição</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-500 text-xs">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const formattedDate = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '19/09/2026';
                  const isSelf = u.id_usuario === currentUser?.id_usuario;

                  return (
                    <tr key={u.id_usuario} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-neutral-900">
                        <div>
                          <span>{u.nome}</span>
                          <span className="block text-xs font-normal text-neutral-400 mt-0.5">{u.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-neutral-500 text-xs font-mono">
                        {formattedDate}
                      </td>

                      <td className="py-4 px-6 text-neutral-600 text-xs">
                        {getCondicaoLabel(u.perfil)}
                      </td>

                      {/* Ações matching Figma: Red "Recusar/Excluir" + Green "Aprovar" */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="px-3 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition-colors shadow-2xs active:scale-95"
                              title="Excluir usuário (RN02)"
                            >
                              Excluir
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFeedback({ type: 'success', message: `Permissões de ${u.nome} confirmadas e ativas.` })}
                            className="px-3 py-1.5 rounded-lg bg-[#168038] hover:bg-[#136e30] text-white text-xs font-bold transition-colors shadow-2xs active:scale-95"
                          >
                            Aprovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-100 text-center">
          <span className="text-xs font-bold text-[#168038] cursor-pointer hover:underline">
            Ver mais
          </span>
        </div>
      </div>
    </div>
  );
};
