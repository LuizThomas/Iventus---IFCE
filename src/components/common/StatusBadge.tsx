import React from 'react';
import { EventStatus } from '../../types';

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'ENCERRADO':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-[#f59e0b] text-[#d97706] bg-amber-50/30 text-xs font-semibold tracking-wide ${className}`}>
          Encerrado
        </span>
      );
    case 'CANCELADO':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-[#ef4444] text-[#dc2626] bg-red-50/30 text-xs font-semibold tracking-wide ${className}`}>
          Cancelado
        </span>
      );
    case 'APROVADO':
    case 'PUBLICADO':
    case 'EM_ANDAMENTO':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-[#168038] text-[#168038] bg-emerald-50/30 text-xs font-semibold tracking-wide ${className}`}>
          Ativo
        </span>
      );
    case 'RASCUNHO':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-[#64748b] text-[#64748b] bg-slate-50 text-xs font-semibold tracking-wide ${className}`}>
          Rascunho
        </span>
      );
    case 'PENDENTE':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-[#f59e0b] text-[#b45309] bg-amber-50 text-xs font-semibold tracking-wide ${className}`}>
          Pendente
        </span>
      );
    case 'REJEITADO':
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-red-500 text-red-600 bg-red-50 text-xs font-semibold tracking-wide ${className}`}>
          Recusado
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border border-neutral-300 text-neutral-600 text-xs font-semibold ${className}`}>
          {status}
        </span>
      );
  }
};
