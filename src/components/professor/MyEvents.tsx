import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit3, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EventItem, EventStatus } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { EventDetailsModal } from '../participant/EventDetailsModal';

interface MyEventsProps {
  onNavigateToAttendance?: (eventId: number) => void;
}

export const MyEvents: React.FC<MyEventsProps> = ({ onNavigateToAttendance }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'publicados' | 'ativos' | 'encerrados' | 'cancelados' | 'rascunhos'>('publicados');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);

  const fetchMyEvents = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getEvents({
        organizadorId: user.perfil === 'PROFESSOR' ? user.id_usuario : undefined,
        tab: activeTab
      });
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar eventos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user, activeTab]);

  const tabs: Array<{ id: 'publicados' | 'ativos' | 'encerrados' | 'cancelados' | 'rascunhos'; label: string }> = [
    { id: 'publicados', label: 'Publicados' },
    { id: 'ativos', label: 'Ativos' },
    { id: 'encerrados', label: 'Encerrados' },
    { id: 'cancelados', label: 'Cancelados' },
    { id: 'rascunhos', label: 'Rascunhos' }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header Bar from Figma: Title + Green "+ Criar Evento" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Meus Eventos
        </h1>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#168038] hover:bg-[#136e30] active:scale-95 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Criar Evento</span>
        </button>
      </div>

      {/* Tabs matching Figma: Organizador (3).png */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-neutral-200 mb-6 overflow-x-auto text-sm font-medium">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#168038] text-[#168038] font-bold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchMyEvents} className="underline font-bold">Tentar novamente</button>
        </div>
      )}

      {/* Table matching Figma: Organizador (3).png */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-xs font-semibold text-neutral-700">
                <th className="py-4 px-6 w-2/5">Evento</th>
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Inscritos</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400 text-xs">
                    Carregando eventos...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 text-xs">
                    Nenhum evento encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const isEnded = ev.status === 'ENCERRADO';
                  const isOwn = ev.id_organizador === user?.id_usuario;

                  return (
                    <tr key={ev.id_evento} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Event Column with Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {ev.banner ? (
                              <img src={ev.banner} alt={ev.titulo} className="w-full h-full object-cover" />
                            ) : (
                              <Calendar className="w-6 h-6 text-neutral-300" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block leading-tight">
                              {ev.titulo}
                            </span>
                            <span className="text-xs text-neutral-400 block mt-0.5">
                              {ev.local}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="py-4 px-6 text-neutral-600 text-xs whitespace-nowrap">
                        {ev.data_inicio} {ev.data_fim !== ev.data_inicio ? `a ${ev.data_fim}` : ''}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={ev.status} />
                      </td>

                      {/* Total Inscritos */}
                      <td className="py-4 px-6 text-center font-mono font-bold text-neutral-800 text-xs">
                        {String(ev.total_inscritos).padStart(2, '0')}
                      </td>

                      {/* Ações (Eye icon, Pencil icon) */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3 text-neutral-700">
                          {/* Eye: view details or go to attendance */}
                          <button
                            onClick={() => {
                              if (onNavigateToAttendance) {
                                onNavigateToAttendance(ev.id_evento);
                              } else {
                                setViewingEvent(ev);
                              }
                            }}
                            className="p-1.5 hover:text-[#168038] hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Visualizar inscritos e detalhes"
                            aria-label="Visualizar inscritos e detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Pencil: edit (RN06: cannot edit if ended; RN09: must be own event) */}
                          {!isEnded && isOwn && (
                            <button
                              onClick={() => setEditingEvent(ev)}
                              className="p-1.5 hover:text-[#168038] hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Editar evento"
                              aria-label="Editar evento"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-200 text-center">
          <span className="text-xs font-bold text-[#168038] cursor-pointer hover:underline">
            Ver mais
          </span>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMyEvents}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={fetchMyEvents}
        />
      )}

      {viewingEvent && (
        <EventDetailsModal
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          onRefresh={fetchMyEvents}
        />
      )}
    </div>
  );
};
