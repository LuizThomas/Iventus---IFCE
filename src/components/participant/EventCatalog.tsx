import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Heart, Search, Filter, AlertCircle } from 'lucide-react';
import { EventItem } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EventDetailsModal } from './EventDetailsModal';
import { CertificateModal } from '../common/CertificateModal';

interface EventCatalogProps {
  searchQuery: string;
}

export const EventCatalog: React.FC<EventCatalogProps> = ({ searchQuery }) => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getEvents({
        search: searchQuery,
        formato: selectedFormat !== 'ALL' ? selectedFormat : undefined
      });
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar catálogo de eventos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedFormat]);

  const handleOpenDetails = async (event: EventItem) => {
    try {
      const res = await api.getEventDetails(event.id_evento);
      if (res.success && res.event) {
        setSelectedEvent(res.event);
      } else {
        setSelectedEvent(event);
      }
    } catch {
      setSelectedEvent(event);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, eventId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const res = await api.toggleFavorite(eventId);
      setEvents(prev => prev.map(ev => ev.id_evento === eventId ? { ...ev, is_favorito: res.favorited } : ev));
    } catch {
      // quiet fail
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Eventos
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Explore os eventos científicos, palestras e minicursos abertos no IFCE
          </p>
        </div>

        {/* Format Filter Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSelectedFormat('ALL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedFormat === 'ALL'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedFormat('Presencial')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedFormat === 'Presencial'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Presenciais
          </button>
          <button
            onClick={() => setSelectedFormat('Online')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedFormat === 'Online'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchEvents} className="underline font-bold">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs animate-pulse">
              <div className="w-full aspect-16/10 bg-neutral-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
                <div className="h-4 bg-neutral-200 rounded w-2/3" />
                <div className="h-4 bg-neutral-200 rounded w-1/3 pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-neutral-300">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            Nenhum evento encontrado
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Não encontramos eventos disponíveis para os critérios selecionados. Tente ajustar a busca.
          </p>
        </div>
      ) : (
        /* Event Cards Grid - Exact Figma Style (Eventos - Participante.png) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isFav = Boolean(event.is_favorito);

            return (
              <div
                key={event.id_evento}
                onClick={() => handleOpenDetails(event)}
                className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
              >
                {/* Banner Area */}
                <div className="relative w-full aspect-16/10 bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {event.banner ? (
                    <img
                      src={event.banner}
                      alt={event.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-400">
                      <Calendar className="w-10 h-10 stroke-[1.25]" />
                    </div>
                  )}

                  {/* Format Pill (Top Left) */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                      event.formato === 'Online'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-900'
                    }`}>
                      {event.formato}
                    </span>
                  </div>

                  {/* Heart Favorite Button (Top Right) */}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => handleToggleFavorite(e, event.id_evento)}
                      className={`absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-xs transition-colors ${
                        isFav ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-700'
                      }`}
                      aria-label="Favoritar"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-neutral-900 leading-snug group-hover:text-[#168038] transition-colors mb-2 line-clamp-1">
                    {event.titulo}
                  </h3>

                  <div className="space-y-1.5 text-xs text-neutral-600 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{event.data_inicio} {event.data_fim !== event.data_inicio ? `a ${event.data_fim}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{event.local}</span>
                    </div>
                  </div>

                  {/* Bottom Link (Figma: "Ver detalhes >") */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#168038] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Ver detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    {event.vagas_restantes !== undefined && (
                      <span className="text-[11px] text-neutral-400">
                        {event.vagas_restantes} vagas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRefresh={() => {
            fetchEvents();
            if (selectedEvent) handleOpenDetails(selectedEvent);
          }}
          onOpenCertificate={(cert) => setSelectedCertificate(cert)}
        />
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};
