import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, Clock, AlertCircle } from 'lucide-react';
import { CertificateItem } from '../../types';
import { api } from '../../api/client';
import { CertificateModal } from '../common/CertificateModal';

export const MyCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getMyCertificates();
      if (res.success) {
        setCertificates(res.certificates || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar certificados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Meus certificados
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Documentos comprobatórios de participação com presença validada nos eventos do IFCE
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCertificates} className="underline font-bold">Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/4" />
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
          <div className="h-10 bg-neutral-100 rounded" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-neutral-300">
          <Award className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            Nenhum certificado disponível no momento
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Os certificados são liberados após o encerramento dos eventos para participantes com presença confirmada (RN03 e RN10).
          </p>
        </div>
      ) : (
        /* Table matching Figma: Certificados - Participante.png */
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-semibold text-neutral-600">
                  <th className="py-4 px-6">Evento</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Carga Horária</th>
                  <th className="py-4 px-6 text-right sm:text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {certificates.map((cert) => (
                  <tr key={cert.id_certificado} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-900">
                      {cert.evento_titulo}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-mono text-xs">
                      {cert.data_inicio}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-mono text-xs">
                      {cert.carga_horaria}h
                    </td>
                    <td className="py-4 px-6 text-right sm:text-center">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-[#168038] hover:bg-emerald-100 transition-colors shadow-xs"
                        title="Baixar Certificado"
                        aria-label="Baixar Certificado"
                      >
                        <Download className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-neutral-100 text-center">
            <span className="text-xs font-bold text-[#168038] cursor-pointer hover:underline">
              Ver mais
            </span>
          </div>
        </div>
      )}

      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};
