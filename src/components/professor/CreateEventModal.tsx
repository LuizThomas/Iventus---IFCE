import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { EventStatus, ScheduleItem } from '../../types';

interface CreateEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horario, setHorario] = useState('');
  const [descricao, setDescricao] = useState('');
  const [limiteVagas, setLimiteVagas] = useState('100');
  const [inicioInscricoes, setInicioInscricoes] = useState(new Date().toISOString().split('T')[0]);
  const [fimInscricoes, setFimInscricoes] = useState('');
  const [banner, setBanner] = useState('');
  const [status, setStatus] = useState<EventStatus>('PUBLICADO');
  const [formato, setFormato] = useState<'Presencial' | 'Online'>('Presencial');
  
  // Programação items
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [newProgTitle, setNewProgTitle] = useState('');
  const [newProgTimeStart, setNewProgTimeStart] = useState('08:00');
  const [newProgTimeEnd, setNewProgTimeEnd] = useState('10:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddScheduleItem = () => {
    if (!newProgTitle) return;
    setScheduleItems([
      ...scheduleItems,
      {
        titulo: newProgTitle,
        data: dataInicio || new Date().toISOString().split('T')[0],
        horario_inicio: newProgTimeStart,
        horario_fim: newProgTimeEnd,
        local: local || 'Auditório'
      }
    ]);
    setNewProgTitle('');
  };

  const handleRemoveScheduleItem = (idx: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== idx));
  };

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

  const handleSubmit = async () => {
    if (!titulo || !local || !dataInicio) {
      setError('Por favor, preencha o Nome do Evento, Local e Data.');
      return;
    }

    // RN07: As inscrições devem terminar antes ou no início do evento
    const effectiveFimInscricoes = fimInscricoes || dataInicio;
    if (effectiveFimInscricoes > dataInicio) {
      setError('O prazo de inscrições não pode encerrar após o início do evento (RN07).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.createEvent({
        titulo,
        local,
        data_inicio: dataInicio,
        data_fim: dataFim || dataInicio,
        horario,
        descricao,
        limite_vagas: Number(limiteVagas) || 50,
        inicio_inscricoes: inicioInscricoes,
        fim_inscricoes: effectiveFimInscricoes,
        banner: banner || null,
        status,
        formato,
        programacao: scheduleItems
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Container - Faithful Soft Green Container from Figma (Organizador.png) */}
      <div className="relative bg-[#93d8a2] text-neutral-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-6 border border-[#7ecb8f]">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/60 hover:bg-white text-neutral-700 flex items-center justify-center transition-colors shadow-xs"
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
          {/* Left Column: Image dropzone & status buttons */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-3">
                Imagem do Evento
              </h3>

              {/* Upload Dropzone */}
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

              {/* Status do Evento buttons from Figma */}
              <div className="mt-6">
                <p className="text-xs font-bold text-neutral-800 text-center mb-2">
                  Status do Evento
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('PUBLICADO')}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all ${
                      status === 'PUBLICADO' || status === 'APROVADO'
                        ? 'bg-[#168038] text-white ring-2 ring-white/50'
                        : 'bg-white/70 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('RASCUNHO')}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all ${
                      status === 'RASCUNHO'
                        ? 'bg-[#555e6c] text-white ring-2 ring-white/50'
                        : 'bg-white/70 text-neutral-700 hover:bg-white'
                    }`}
                  >
                    Rascunho
                  </button>
                </div>
              </div>

              {/* Formato */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormato('Presencial')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    formato === 'Presencial' ? 'bg-white text-[#168038] shadow-xs' : 'text-neutral-700 hover:bg-white/40'
                  }`}
                >
                  Presencial
                </button>
                <button
                  type="button"
                  onClick={() => setFormato('Online')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    formato === 'Online' ? 'bg-white text-[#168038] shadow-xs' : 'text-neutral-700 hover:bg-white/40'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>

            {/* "OK" Button from Figma (Organizador.png) */}
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
              Criando Evento
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
                placeholder="Como se chamará..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#168038]"
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
                placeholder="Onde acontecerá..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#168038]"
                required
              />
            </div>

            {/* Data & Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-[#168038]"
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
                  placeholder="Ex: 08:00h - 18:00h"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#168038]"
                />
              </div>
            </div>

            {/* Vagas & Fim das Inscrições */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Limite de Vagas
                </label>
                <input
                  type="number"
                  min="1"
                  value={limiteVagas}
                  onChange={(e) => setLimiteVagas(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-[#168038]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Fim das Inscrições
                </label>
                <input
                  type="date"
                  value={fimInscricoes}
                  onChange={(e) => setFimInscricoes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-[#168038]"
                />
              </div>
            </div>

            {/* Descrição do Evento (with rich formatting toolbar from Figma) */}
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
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes, objetivos e tópicos abordados no evento..."
                  className="w-full p-3 text-sm text-neutral-900 outline-none resize-none"
                />
              </div>
            </div>

            {/* Programação */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Programação do Evento (Opcional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nome da atividade..."
                  value={newProgTitle}
                  onChange={(e) => setNewProgTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900"
                />
                <input
                  type="time"
                  value={newProgTimeStart}
                  onChange={(e) => setNewProgTimeStart(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleAddScheduleItem}
                  className="px-3 py-1.5 bg-[#168038] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {scheduleItems.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto bg-white/70 rounded-lg p-2">
                  {scheduleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1 bg-white rounded border border-neutral-200">
                      <span>{item.titulo} ({item.horario_inicio} - {item.horario_fim})</span>
                      <button type="button" onClick={() => handleRemoveScheduleItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
