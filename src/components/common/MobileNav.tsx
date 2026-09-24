import React from 'react';
import { Calendar, Ticket, Award, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const role = user?.perfil || 'PARTICIPANTE';

  const getPrimaryView = () => {
    if (role === 'PROFESSOR') return 'professor_events';
    if (role === 'ADMINISTRADOR') return 'admin_events';
    return 'events';
  };

  const getSecondaryView = () => {
    if (role === 'PROFESSOR') return 'professor_attendance';
    if (role === 'ADMINISTRADOR') return 'admin_users';
    return 'my_registrations';
  };

  const getTertiaryView = () => {
    if (role === 'ADMINISTRADOR') return 'admin_reports';
    return 'my_certificates';
  };

  const isPrimaryActive = currentView === getPrimaryView() || currentView === 'home';
  const isSecondaryActive = currentView === getSecondaryView();
  const isTertiaryActive = currentView === getTertiaryView();
  const isSettingsActive = currentView === 'profile' || currentView === 'admin_settings';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-6 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onNavigate(getPrimaryView())}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
          isPrimaryActive ? 'text-[#168038]' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-label="Eventos"
      >
        <Calendar className="w-6 h-6 stroke-[1.75]" />
      </button>

      <button
        onClick={() => onNavigate(getSecondaryView())}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
          isSecondaryActive ? 'text-[#168038]' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-label="Inscrições"
      >
        <Ticket className="w-6 h-6 stroke-[1.75]" />
      </button>

      <button
        onClick={() => onNavigate(getTertiaryView())}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
          isTertiaryActive ? 'text-[#168038]' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-label="Certificados"
      >
        <Award className="w-6 h-6 stroke-[1.75]" />
      </button>

      <button
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
          isSettingsActive ? 'text-[#168038]' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-label="Configurações"
      >
        <Settings className="w-6 h-6 stroke-[1.75]" />
      </button>
    </nav>
  );
};
