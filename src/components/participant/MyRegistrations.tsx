import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import { Registration, EventItem } from '../../types';
import { api } from '../../api/client';
import { EventDetailsModal } from './EventDetailsModal';

export const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getMyRegistrations();
      if (res.success) {
        setRegistrations(res.registrations || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar inscrições.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async (reg: Registration) => {
    if (!reg.pode_cancelar) {
      alert('Não é possível cancelar a inscrição pois o prazo limite de inscrições já encerrou (RN12).');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja cancelar sua inscrição no evento "${reg.titulo}"? Sua vaga será liberada.`)) {
      return;
    }

    try {
      const res = await api.cancelRegistration(reg.id_evento);
      setFeedback({ type: 'success', message: res.message || 'Inscrição cancelada com sucesso.' });
      fetchRegistrations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cancelar inscrição.' });
    }
  };

  const handleOpenDetails = async (eventId: number) => {
    try {
      const res = await api.getEventDetails(eventId);
      if (res.success && res.event) {
        setSelectedEvent(res.event);
      }
    } catch {
      // quiet fail
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Minhas Inscrições
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Acompanhe os eventos em que você está inscrito e gerencie sua participação
        </p>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRegistrations} className="underline font-bold">Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs animate-pulse p-4 space-y-4">
              <div className="w-full aspect-16/10 bg-neutral-200 rounded-xl" />
              <div className="h-5 bg-neutral-200 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-neutral-300">
          <Ticket className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            Você ainda não possui inscrições ativas
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Acesse o catálogo de eventos para se inscrever nas palestras e minicursos.
          </p>
        </div>
      ) : (
        /* Cards Grid - Matching Figma: Inscrições - Participante.png */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((reg) => (
            <div
              key={reg.id_inscricao}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Image banner with Format Tag */}
              <div className="relative w-full aspect-16/10 bg-neutral-100 flex items-center justify-center overflow-hidden">
                {reg.banner ? (
                  <img src={reg.banner} alt={reg.titulo} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-10 h-10 text-neutral-300" />
                )}

                <div className="absolute top-3 left-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                    reg.formato === 'Online' ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'
                  }`}>
                    {reg.formato}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-neutral-900 leading-snug mb-2 line-clamp-1">
                  {reg.titulo}
                </h3>

                <div className="space-y-1.5 text-xs text-neutral-600 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{reg.data_inicio} {reg.data_fim !== reg.data_inicio ? `a ${reg.data_fim}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{reg.local}</span>
                  </div>
                </div>

                {/* Bottom Actions from Figma */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <button
                    onClick={() => handleOpenDetails(reg.id_evento)}
                    className="text-xs font-bold text-[#168038] flex items-center gap-1 hover:underline"
                  >
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {Boolean(reg.pode_cancelar) ? (
                    <button
                      onClick={() => handleCancelRegistration(reg)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline block w-full text-left"
                    >
                      Cancelar inscrição
                    </button>
                  ) : (
                    <span className="text-[11px] text-neutral-400 block">
                      Cancelamento indisponível (prazo encerrado)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRefresh={fetchRegistrations}
        />
      )}
    </div>
  );
};
