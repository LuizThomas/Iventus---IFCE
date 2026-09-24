import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../../types';
import { api } from '../../api/client';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reject modal state
  const [rejectingEvent, setRejectingEvent] = useState<EventItem | null>(null);
  const [justification, setJustification] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminEvents();
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos para moderação.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async (eventId: number) => {
    try {
      const res = await api.approveEvent(eventId);
      setFeedback({ type: 'success', message: res.message });
      fetchEvents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao aprovar evento.' });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingEvent) return;
    if (!justification.trim()) {
      alert('A justificativa da recusa é obrigatória.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.rejectEvent(rejectingEvent.id_evento, justification);
      setFeedback({ type: 'success', message: res.message });
      setRejectingEvent(null);
      setJustification('');
      fetchEvents();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao recusar evento.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        {/* Title from Figma: "Evento" */}
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Evento
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Painel de aprovação e governança de eventos científicos submetidos pelos docentes
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
          <button onClick={fetchEvents} className="underline font-bold">Tentar novamente</button>
        </div>
      )}

      {/* Table matching Figma: eventos - administrador.png */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-xs font-bold text-neutral-600">
                <th className="py-4 px-6">Evento</th>
                <th className="py-4 px-6">Organizador</th>
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Carregando eventos para moderação...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-500 text-xs">
                    Nenhum evento registrado no momento.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id_evento} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <span>{ev.titulo}</span>
                        {ev.status === 'PENDENTE' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                            Pendente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-neutral-700 text-xs">
                      {ev.organizador_nome}
                    </td>
                    <td className="py-4 px-6 text-neutral-500 text-xs font-mono">
                      {ev.data_inicio}
                    </td>
                    {/* Action buttons from Figma: Red "Recusar" + Green "Aprovar" */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingEvent(ev);
                            setJustification('');
                          }}
                          className="px-4 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition-colors shadow-2xs active:scale-95"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(ev.id_evento)}
                          className="px-4 py-1.5 rounded-lg bg-[#168038] hover:bg-[#136e30] text-white text-xs font-bold transition-colors shadow-2xs active:scale-95"
                        >
                          Aprovar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Justification Modal for Rejection */}
      {rejectingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              Justificativa da Recusa
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Informe o motivo da recusa para o evento <strong className="text-neutral-800">"{rejectingEvent.titulo}"</strong>. O organizador será notificado.
            </p>

            <textarea
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Informações incompletas sobre a programação ou incompatibilidade de data no campus..."
              className="w-full p-3 text-xs border border-neutral-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 mb-4"
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing || !justification.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Enviando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
