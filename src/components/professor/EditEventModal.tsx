import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { EventItem, EventStatus } from '../../types';

interface EditEventModalProps {
  event: EventItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({ event, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState(event.titulo);
  const [local, setLocal] = useState(event.local);
  const [dataInicio, setDataInicio] = useState(event.data_inicio);
  const [dataFim, setDataFim] = useState(event.data_fim);
  const [horario, setHorario] = useState(event.horario || '');
  const [descricao, setDescricao] = useState(event.descricao || '');
  const [limiteVagas, setLimiteVagas] = useState(String(event.limite_vagas));
  const [banner, setBanner] = useState(event.banner || '');
  const [status, setStatus] = useState<EventStatus>(event.status);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetStatus = async (newStatus: 'ENCERRADO' | 'CANCELADO') => {
    const confirmMsg = newStatus === 'ENCERRADO' 
      ? 'Deseja realmente encerrar este evento? Não será mais possível editá-lo e os certificados poderão ser liberados.'
      : 'Deseja realmente cancelar este evento? Todos os inscritos serão notificados.';

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    setError(null);
    try {
      await api.updateEventStatus(event.id_evento, newStatus);
      setStatus(newStatus);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!titulo || !local || !dataInicio) {
      setError('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.updateEvent(event.id_evento, {
        titulo,
        local,
        data_inicio: dataInicio,
        data_fim: dataFim || dataInicio,
        horario,
        descricao,
        limite_vagas: Number(limiteVagas) || event.limite_vagas,
        banner: banner || null,
        status
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Faithful Soft Yellow Container from Figma (Organizador (1).png) */}
      <div className="relative bg-[#f5e977] text-neutral-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-6 border border-[#e6d859]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-neutral-700 flex items-center justify-center transition-colors shadow-xs"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300 text-xs font-semibold text-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Image upload & Status Action buttons */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-3">
                Imagem do Evento
              </h3>

              <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-neutral-500/40 bg-white/40 hover:bg-white/60 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative group">
                {banner ? (
                  <img src={banner} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-neutral-600 p-4 text-center">
                    <span className="text-4xl font-light mb-1">+</span>
                    <span className="text-xs font-semibold">Upload da imagem</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </label>

              {/* Status do Evento buttons from Figma: Encerrar / Cancelar */}
              <div className="mt-6">
                <p className="text-xs font-bold text-neutral-800 text-center mb-2">
                  Status do Evento
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetStatus('ENCERRADO')}
                    disabled={status === 'ENCERRADO'}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all ${
                      status === 'ENCERRADO'
                        ? 'bg-amber-600/60 text-white cursor-not-allowed'
                        : 'bg-[#f39c12] hover:bg-[#d68910] text-white active:scale-95'
                    }`}
                  >
                    {status === 'ENCERRADO' ? 'Já Encerrado' : 'Encerrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus('CANCELADO')}
                    disabled={status === 'CANCELADO'}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all ${
                      status === 'CANCELADO'
                        ? 'bg-red-600/60 text-white cursor-not-allowed'
                        : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white active:scale-95'
                    }`}
                  >
                    {status === 'CANCELADO' ? 'Já Cancelado' : 'Cancelar'}
                  </button>
                </div>
              </div>
            </div>

            {/* "OK" Button from Figma (Organizador (1).png) */}
            <div className="mt-6 pt-4 text-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-24 py-2 bg-white hover:bg-neutral-100 text-neutral-900 font-bold rounded-lg shadow-sm transition-all text-sm disabled:opacity-50"
              >
                {isLoading ? '...' : 'OK'}
              </button>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="md:col-span-8 space-y-3.5">
            <h2 className="text-xl font-bold text-neutral-900 mb-1">
              Editando Evento
            </h2>

            {/* Nome do Evento */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Nome do Evento
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Local */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Local
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Data & Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Horário
                </label>
                <input
                  type="text"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: 13:00h - 15:00h"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Descrição do Evento */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Descrição do Evento
              </label>
              <div className="rounded-xl border border-neutral-300 bg-white overflow-hidden shadow-2xs">
                <div className="flex items-center gap-3 px-3 py-1.5 border-b border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-600 select-none">
                  <span className="font-bold">B</span>
                  <span className="italic">I</span>
                  <span className="underline">U</span>
                  <span className="line-through">S</span>
                  <span className="text-[11px]">&lt;&gt;</span>
                </div>
                <textarea
                  rows={6}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full p-3 text-sm text-neutral-900 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
