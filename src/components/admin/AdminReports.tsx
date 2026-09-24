import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Users, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { AdminStats } from '../../types';

export const AdminReports: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [sRes, eRes] = await Promise.all([api.getAdminStats(), api.getAdminEvents()]);
        if (sRes.success) setStats(sRes.stats);
        if (eRes.success) setEvents(eRes.events || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = 'ID,Titulo,Organizador,Local,Data Inicio,Data Fim,Status,Inscritos,Vagas\n';
    const rows = events.map(e => 
      `"${e.id_evento}","${e.titulo}","${e.organizador_nome}","${e.local}","${e.data_inicio}","${e.data_fim}","${e.status}","${e.total_inscritos}","${e.limite_vagas}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_eventos_ifce_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Relatórios e Estatísticas
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Consolidado executivo e indicadores de desempenho dos eventos científicos do IFCE (RF09)
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-lg border border-neutral-300 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#168038] hover:bg-[#136e30] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Grid (Section 18 requirement: Real database numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Total de Usuários</span>
            <Users className="w-4 h-4 text-[#168038]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {stats?.totalUsers ?? '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {stats?.totalProfessors ?? 0} docentes · {stats?.totalParticipants ?? 0} discentes
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Eventos Realizados</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {stats?.endedEvents ?? '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {stats?.approvedEvents ?? 0} ativos · {stats?.pendingEvents ?? 0} pendentes
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Inscrições Confirmadas</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {stats?.totalRegistrations ?? '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            participações registradas
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Certificados Emitidos</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
            {stats?.totalCertificates ?? '—'}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            com presença comprovada
          </p>
        </div>
      </div>

      {/* Events Summary Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <h2 className="text-base font-bold text-neutral-900">
            Detalhamento Geral de Eventos e Participação
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-bold">
                <th className="py-3 px-6">Título do Evento</th>
                <th className="py-3 px-6">Docente Responsável</th>
                <th className="py-3 px-6">Período</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Inscritos / Vagas</th>
                <th className="py-3 px-6 text-right">Ocupação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((ev) => {
                const perc = Math.min(100, Math.round((ev.total_inscritos / ev.limite_vagas) * 100));
                return (
                  <tr key={ev.id_evento} className="hover:bg-neutral-50">
                    <td className="py-3 px-6 font-bold text-neutral-900">{ev.titulo}</td>
                    <td className="py-3 px-6 text-neutral-700">{ev.organizador_nome}</td>
                    <td className="py-3 px-6 font-mono text-neutral-500">{ev.data_inicio}</td>
                    <td className="py-3 px-6">
                      <span className="font-semibold text-[11px]">{ev.status}</span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-bold">
                      {ev.total_inscritos} / {ev.limite_vagas}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`font-mono font-bold ${perc >= 90 ? 'text-amber-600' : 'text-[#168038]'}`}>
                        {perc}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
