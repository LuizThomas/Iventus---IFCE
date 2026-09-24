import React, { useState, useEffect } from 'react';
import { Search, Download, Check, AlertCircle, CheckCircle2, Award, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';
import { AttendanceParticipant, EventItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CertificateModal } from '../common/CertificateModal';
import confetti from 'canvas-confetti';

interface AttendanceViewProps {
  initialEventId?: number;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialEventId }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(initialEventId || null);
  const [currentEvent, setCurrentEvent] = useState<any | null>(null);
  const [participants, setParticipants] = useState<AttendanceParticipant[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewCert, setPreviewCert] = useState<any | null>(null);

  // Fetch professor's events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.getEvents({
          organizadorId: user?.perfil === 'PROFESSOR' ? user.id_usuario : undefined
        });
        if (res.success && res.events.length > 0) {
          setEvents(res.events);
          if (!selectedEventId) {
            setSelectedEventId(res.events[0].id_evento);
          }
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [user]);

  // Fetch attendance list for selected event
  const fetchAttendanceList = async () => {
    if (!selectedEventId) return;
    setIsLoading(true);
    try {
      const res = await api.getAttendance(selectedEventId);
      if (res.success) {
        setCurrentEvent(res.event);
        setParticipants(res.participants || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao carregar lista de presença.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendanceList();
    }
  }, [selectedEventId]);

  // Toggle presence handler (saves to DB immediately)
  const handleTogglePresence = async (participant: AttendanceParticipant) => {
    if (!selectedEventId) return;
    const newPresenceState = participant.presenca === 1 ? false : true;

    // Optimistic UI update
    setParticipants(prev =>
      prev.map(p => p.id_inscricao === participant.id_inscricao ? { ...p, presenca: newPresenceState ? 1 : 0 } : p)
    );

    try {
      await api.updateAttendance(selectedEventId, participant.id_inscricao, newPresenceState);
    } catch (err: any) {
      // Revert on error
      setParticipants(prev =>
        prev.map(p => p.id_inscricao === participant.id_inscricao ? { ...p, presenca: participant.presenca } : p)
      );
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar presença.' });
    }
  };

  // Release certificates (RN10: Only after event ends; RN03: Only for attended participants)
  const handleReleaseCertificates = async () => {
    if (!selectedEventId) return;

    try {
      const res = await api.releaseCertificates(selectedEventId);
      setFeedback({ type: 'success', message: res.message });
      confetti({ particleCount: 70, spread: 80 });
      fetchAttendanceList();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao liberar certificados.' });
    }
  };

  // Filter participants by search
  const filteredParticipants = participants.filter(p =>
    p.nome.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (p.matricula && p.matricula.toLowerCase().includes(searchStudent.toLowerCase())) ||
    (p.turma && p.turma.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Event selection banner */}
      {events.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-neutral-600">Selecionar Evento:</label>
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(Number(e.target.value))}
            className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 outline-none focus:border-[#168038]"
          >
            {events.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {ev.titulo} ({ev.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Container - Gray background card from Figma: Organizador (2).png */}
      <div className="bg-[#eaedf1] rounded-2xl p-6 sm:p-8 shadow-xs border border-neutral-300/80">
        {/* Title from Figma: "Inscritos - [Nome do Evento]" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Inscritos - {currentEvent?.titulo || 'Carregando evento...'}
          </h2>

          {/* Action button: "Inserir certificado em PDF ↓" / "Liberar Certificados" */}
          <button
            onClick={handleReleaseCertificates}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
          >
            <span>Inserir certificado em PDF</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input from Figma: "Pesquisar alunos..." */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Pesquisar alunos..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-neutral-300 text-xs text-neutral-800 placeholder-neutral-400 outline-none focus:ring-1 focus:ring-[#168038]"
            />
          </div>
        </div>

        {feedback && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-red-700" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Table matching Figma: Organizador (2).png */}
        <div className="bg-white rounded-xl border border-neutral-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100/90 text-xs font-bold text-neutral-900">
                  <th className="py-4 px-6">Nome</th>
                  <th className="py-4 px-6">Turma</th>
                  <th className="py-4 px-6 text-center">Presença</th>
                  <th className="py-4 px-6 text-center">Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                      Carregando lista de alunos...
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-neutral-500 text-xs">
                      Nenhum participante inscrito encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const isPresent = p.presenca === 1;

                    return (
                      <tr key={p.id_inscricao} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Student Name */}
                        <td className="py-4 px-6 font-bold text-neutral-900">
                          {p.nome}
                        </td>

                        {/* Turma */}
                        <td className="py-4 px-6 text-neutral-600 text-xs">
                          {p.turma || 'Informática S1'}
                        </td>

                        {/* Custom Green Presença Checkbox from Figma: Organizador (2).png */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePresence(p)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all mx-auto ${
                              isPresent
                                ? 'bg-[#168038] text-white border-2 border-[#168038]'
                                : 'border-2 border-neutral-400 bg-white hover:border-[#168038]'
                            }`}
                            aria-label={`Alternar presença para ${p.nome}`}
                          >
                            {isPresent && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                        </td>

                        {/* Certificate Icon from Figma */}
                        <td className="py-4 px-6 text-center">
                          {p.certificado_codigo ? (
                            <button
                              onClick={() => setPreviewCert({
                                evento_titulo: currentEvent?.titulo,
                                participante_nome: p.nome,
                                participante_matricula: p.matricula,
                                carga_horaria: 20,
                                data_emissao: new Date().toISOString(),
                                local: 'Campus Cedro - IFCE',
                                organizador_nome: user?.nome || 'Coordenador',
                                codigo_validacao: p.certificado_codigo
                              })}
                              className="p-1 text-[#168038] hover:text-[#136e30] transition-colors"
                              title={`Certificado emitido: ${p.certificado_codigo}`}
                            >
                              <Award className="w-5 h-5 stroke-[1.75] mx-auto" />
                            </button>
                          ) : isPresent ? (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Apto
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">
                              —
                            </span>
                          )}
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
      </div>

      {previewCert && (
        <CertificateModal
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
};
