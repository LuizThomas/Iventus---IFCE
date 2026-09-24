import React, { useState, useEffect } from 'react';
import { Settings, Shield, Activity, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export const AdminSettings: React.FC = () => {
  const [campusName, setCampusName] = useState('IFCE - Campus Cedro');
  const [diretoriaEnsino, setDiretoriaEnsino] = useState('Diretoria de Extensão, Pesquisa e Pós-Graduação');
  const [emailNotificacoes, setEmailNotificacoes] = useState('eventos.cedro@ifce.edu.br');
  const [logs, setLogs] = useState<any[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.getAuditLogs();
        if (res.success) setLogs(res.logs || []);
      } catch {
        // quiet fail
      }
    };
    fetchAudit();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Parâmetros institucionais, chaves de validação e trilha de auditoria (RF08)
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Parâmetros Institucionais */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-[#168038]" />
            <h2 className="text-base font-bold text-neutral-900">
              Parâmetros Institucionais
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome do Campus
              </label>
              <input
                type="text"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Setor Emissor de Certificados
              </label>
              <input
                type="text"
                value={diretoriaEnsino}
                onChange={(e) => setDiretoriaEnsino(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                E-mail Institucional de Notificações
              </label>
              <input
                type="email"
                value={emailNotificacoes}
                onChange={(e) => setEmailNotificacoes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#168038] hover:bg-[#136e30] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </form>
        </div>

        {/* Trilha de Auditoria (Audit Log) */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-neutral-700" />
            <h2 className="text-base font-bold text-neutral-900">
              Trilha de Auditoria e Segurança (Últimas Ações)
            </h2>
          </div>

          <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">Nenhum registro de auditoria.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id_auditoria} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-neutral-400 mb-0.5">
                    <span className="font-bold text-neutral-700">{l.acao}</span>
                    <span>{l.created_at}</span>
                  </div>
                  <p className="text-neutral-800">{l.detalhes}</p>
                  {l.usuario_nome && (
                    <span className="text-[10px] text-neutral-400">Por: {l.usuario_nome} ({l.ip})</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
