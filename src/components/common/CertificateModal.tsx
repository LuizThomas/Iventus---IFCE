import React, { useRef } from 'react';
import { X, Download, Printer, ShieldCheck, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CertificateItem } from '../../types';
import { Logo } from './Logo';

interface CertificateModalProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!certificate) return null;

  const handlePrintOrDownload = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    window.print();
  };

  const formattedDate = new Date(certificate.data_emissao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        {/* Top actions bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50 print:hidden">
          <div className="flex items-center gap-2 text-neutral-800 font-semibold text-base">
            <Award className="w-5 h-5 text-[#168038]" />
            <span>Certificado de Participação</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#168038] hover:bg-[#136e30] text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Baixar / Imprimir PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Surface (Printable) */}
        <div ref={printRef} className="p-8 sm:p-12 bg-[#fffdfa] text-neutral-900 border-8 border-double border-[#168038]/20 m-4 rounded-xl relative select-none">
          {/* Top Decorative Border */}
          <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-[#168038] via-[#e11d48] to-[#168038] opacity-70" />

          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-neutral-200 pb-6 mb-8 gap-4">
            <Logo variant="vertical" size="md" />
            <div className="text-center sm:text-right">
              <h2 className="text-sm font-bold tracking-widest text-[#168038] uppercase">
                Instituto Federal do Ceará
              </h2>
              <p className="text-xs text-neutral-600 font-medium">Diretoria de Extensão, Pesquisa e Pós-Graduação</p>
              <p className="text-xs text-neutral-500">Campus Cedro - IFCE</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-neutral-900 uppercase mb-2">
              CERTIFICADO
            </h1>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
              Comprovação de Atividade Científica e Tecnológica
            </p>
          </div>

          {/* Body Text */}
          <div className="max-w-2xl mx-auto text-center text-base sm:text-lg leading-relaxed text-neutral-800 mb-10">
            Certificamos que{' '}
            <span className="font-bold text-neutral-950 underline decoration-[#168038] decoration-2 underline-offset-4">
              {certificate.participante_nome || 'Participante Cadastrado'}
            </span>
            {certificate.participante_matricula && (
              <span>, matrícula nº <strong className="font-semibold">{certificate.participante_matricula}</strong>,</span>
            )}{' '}
            participou com presença e aproveitamento satisfatórios das atividades do evento científico{' '}
            <strong className="text-neutral-950 font-bold">"{certificate.evento_titulo}"</strong>,{' '}
            realizado em <span className="font-semibold">{certificate.local}</span>, perfazendo uma carga horária total de{' '}
            <strong className="text-[#168038] font-bold">{certificate.carga_horaria} horas</strong>.
          </div>

          {/* Date & Location */}
          <div className="text-center text-sm text-neutral-600 mb-12">
            Cedro - Ceará, {formattedDate}.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-xl mx-auto pt-6 border-t border-neutral-300/80 mb-8">
            <div className="text-center">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-lg text-neutral-700">Prof. {certificate.organizador_nome}</span>
              </div>
              <div className="border-t border-neutral-400 mt-2 pt-1 text-xs text-neutral-600 font-semibold">
                Coordenação do Evento
              </div>
            </div>
            <div className="text-center">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-lg text-neutral-700">Diretoria de Ensino IFCE</span>
              </div>
              <div className="border-t border-neutral-400 mt-2 pt-1 text-xs text-neutral-600 font-semibold">
                Diretoria de Extensão e Pesquisa
              </div>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-200 gap-2">
            <div className="flex items-center gap-1.5 text-[#168038] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Autenticidade Verificada</span>
            </div>
            <div className="font-mono text-[11px] bg-neutral-100 px-3 py-1 rounded-md border border-neutral-200">
              Código de Validação: <strong>{certificate.codigo_validacao}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
