import React, { useState } from 'react';
import { X, Heart, Calendar, MapPin, Clock, Users, BookOpen, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { EventItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import confetti from 'canvas-confetti';

interface EventDetailsModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenCertificate?: (cert: any) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onRefresh,
  onOpenCertificate
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isFavorited, setIsFavorited] = useState(Boolean(event?.is_favorito));

  if (!event) return null;

  const isOrganizer = user && event.id_organizador === user.id_usuario;
  const isRegistered = Boolean(event.inscrito || event.usuario_inscrito);
  const isFull = (event.vagas_restantes !== undefined ? event.vagas_restantes <= 0 : event.total_inscritos >= event.limite_vagas);
  
  const today = new Date().toISOString().split('T')[0];
  const registrationClosed = event.fim_inscricoes && today > event.fim_inscricoes;
  const isEnded = event.status === 'ENCERRADO';
  const isCancelled = event.status === 'CANCELADO';

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setFeedback({ type: 'error', message: 'Faça login como participante para se inscrever.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.registerInEvent(event.id_evento);
      setFeedback({ type: 'success', message: res.message || 'Inscrição confirmada com sucesso!' });
      confetti({ particleCount: 60, spread: 60 });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao realizar inscrição.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua inscrição? Sua vaga será liberada.')) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.cancelRegistration(event.id_evento);
      setFeedback({ type: 'success', message: res.message || 'Inscrição cancelada com sucesso.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cancelar inscrição.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.toggleFavorite(event.id_evento);
      setIsFavorited(res.favorited);
    } catch {
      // quiet fail
    }
  };

  // Button state logic as required by specs
  const renderActionButton = () => {
    if (isCancelled) {
      return (
        <button disabled className="w-full py-3 px-4 bg-red-100 text-red-700 font-bold rounded-xl cursor-not-allowed text-sm">
          Evento cancelado
        </button>
      );
    }

    if (isEnded) {
      if (isRegistered && (event as any).certificado) {
        return (
          <button
            onClick={() => onOpenCertificate && onOpenCertificate((event as any).certificado)}
            className="w-full py-3 px-4 bg-[#168038] hover:bg-[#136e30] text-white font-bold rounded-xl shadow-md transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>Baixar Certificado Disponível</span>
          </button>
        );
      }
      return (
        <button disabled className="w-full py-3 px-4 bg-neutral-200 text-neutral-600 font-bold rounded-xl cursor-not-allowed text-sm">
          Evento encerrado
        </button>
      );
    }

    if (isRegistered) {
      return (
        <div className="space-y-2 w-full">
          <button disabled className="w-full py-3 px-4 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-default">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Inscrito</span>
          </button>
          {!registrationClosed && (
            <button
              onClick={handleCancelRegistration}
              disabled={isSubmitting}
              className="w-full py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancelar inscrição
            </button>
          )}
        </div>
      );
    }

    if (registrationClosed) {
      return (
        <button disabled className="w-full py-3 px-4 bg-neutral-200 text-neutral-600 font-bold rounded-xl cursor-not-allowed text-sm">
          Inscrições encerradas
        </button>
      );
    }

    if (isFull) {
      return (
        <button disabled className="w-full py-3 px-4 bg-amber-100 text-amber-800 font-bold rounded-xl cursor-not-allowed text-sm">
          Evento lotado
        </button>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleRegister}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-[#168038] hover:bg-[#136e30] active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Inscrevendo...' : 'Inscrever-se'}
        </button>
        {isAuthenticated && (
          <button
            onClick={handleToggleFavorite}
            className={`p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors ${
              isFavorited ? 'text-red-500 bg-red-50 border-red-200' : 'text-neutral-400'
            }`}
            aria-label="Favoritar evento"
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Header bar matching Figma */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-xl font-bold text-neutral-900">
            Detalhes do Evento
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body - 2 Columns (Matching Figma: Visualizando Evento - Participante.png) */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Image Banner + Action Button */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-4/3 rounded-xl bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden mb-6 relative group">
              {event.banner ? (
                <img src={event.banner} alt={event.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 p-4">
                  <div className="w-12 h-12 rounded-full border-2 border-neutral-300 flex items-center justify-center mb-2">
                    <span className="text-2xl font-light">+</span>
                  </div>
                  <span className="text-xs font-medium">Imagem do Evento</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  event.formato === 'Online' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {event.formato}
                </span>
              </div>
            </div>

            {/* Action button */}
            <div className="w-full mt-auto">
              {renderActionButton()}
            </div>

            {/* Quick stats box */}
            <div className="w-full mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5 text-neutral-600">
              <div className="flex justify-between">
                <span>Vagas Totais:</span>
                <strong className="text-neutral-900">{event.limite_vagas}</strong>
              </div>
              <div className="flex justify-between">
                <span>Inscritos Confirmados:</span>
                <strong className="text-neutral-900">{event.total_inscritos}</strong>
              </div>
              <div className="flex justify-between">
                <span>Vagas Restantes:</span>
                <strong className={event.vagas_restantes && event.vagas_restantes > 0 ? 'text-[#168038]' : 'text-red-600'}>
                  {event.vagas_restantes ?? Math.max(0, event.limite_vagas - event.total_inscritos)}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: Event Details Form View (Figma style) */}
          <div className="md:col-span-7 space-y-4">
            {/* Nome do Evento */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome do Evento
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-sm font-semibold text-neutral-900">
                {event.titulo}
              </div>
            </div>

            {/* Local */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Local
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-sm text-neutral-800">
                {event.local}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Data
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-sm text-neutral-800">
                  {event.data_inicio} {event.data_fim !== event.data_inicio ? `a ${event.data_fim}` : ''}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Horário
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-sm text-neutral-800">
                  {event.horario || '08:00h - 18:00h'}
                </div>
              </div>
            </div>

            {/* Período de Inscrição */}
            <div className="text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
              <span className="font-semibold text-neutral-700">Período de Inscrições:</span> {event.inicio_inscricoes} até {event.fim_inscricoes}
            </div>

            {/* Descrição do Evento (with rich text toolbar mockup from Figma: B, I, U, S, <>) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Descrição do Evento
              </label>
              <div className="rounded-lg border border-neutral-300 overflow-hidden bg-white">
                {/* Fake rich text toolbar from Figma */}
                <div className="flex items-center gap-3 px-3 py-1.5 border-b border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-600 select-none">
                  <span className="font-bold cursor-default hover:text-neutral-900">B</span>
                  <span className="italic cursor-default hover:text-neutral-900">I</span>
                  <span className="underline cursor-default hover:text-neutral-900">U</span>
                  <span className="line-through cursor-default hover:text-neutral-900">S</span>
                  <span className="text-[11px] cursor-default hover:text-neutral-900">&lt;&gt;</span>
                </div>
                <div className="p-3 text-sm text-neutral-800 leading-relaxed min-h-[100px] whitespace-pre-line">
                  {event.descricao || 'Nenhuma descrição detalhada informada.'}
                </div>
              </div>
            </div>

            {/* Programação do Evento */}
            {event.programacao && event.programacao.length > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Programação das Atividades
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {event.programacao.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 text-xs space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-neutral-900">
                        <span>{item.titulo}</span>
                        <span className="font-mono text-[11px] text-neutral-500">{item.horario_inicio} - {item.horario_fim}</span>
                      </div>
                      {item.descricao && <p className="text-neutral-600">{item.descricao}</p>}
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                        <span>{item.local}</span>
                        {item.responsavel && <span>{item.responsavel}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
