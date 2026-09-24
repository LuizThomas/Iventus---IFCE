import React from 'react';
import { Calendar, Ticket, Award, Settings, Users, BookOpen, BarChart3, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const role = user?.perfil || 'PARTICIPANTE';

  let navItems: Array<{ id: string; label: string; icon: React.FC<{ className?: string }> }> = [];

  if (role === 'PARTICIPANTE') {
    navItems = [
      { id: 'events', label: 'Eventos', icon: Calendar },
      { id: 'my_registrations', label: 'Minhas Inscrições', icon: Ticket },
      { id: 'my_certificates', label: 'Certificados', icon: Award },
      { id: 'profile', label: 'Configurações', icon: Settings }
    ];
  } else if (role === 'PROFESSOR') {
    navItems = [
      { id: 'professor_events', label: 'Meus Eventos', icon: Calendar },
      { id: 'professor_attendance', label: 'Inscrições', icon: Ticket },
      { id: 'profile', label: 'Configurações', icon: Settings }
    ];
  } else if (role === 'ADMINISTRADOR') {
    navItems = [
      { id: 'admin_events', label: 'Eventos', icon: Calendar },
      { id: 'admin_users', label: 'Usuários', icon: Users },
      { id: 'admin_certificates', label: 'Certificados', icon: Award },
      { id: 'admin_courses', label: 'Cursos e Semestres', icon: BookOpen },
      { id: 'admin_reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'admin_settings', label: 'Configurações', icon: Settings }
    ];
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'events' && currentView === 'home') ||
            (item.id === 'professor_events' && currentView === 'professor_dashboard');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                isActive
                  ? 'bg-[#e8f5e9] text-[#168038]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#168038]' : 'text-neutral-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role info indicator */}
      <div className="pt-4 border-t border-neutral-100 px-2 text-xs text-neutral-400">
        <p className="font-semibold text-neutral-600">IFCE Iventus</p>
        <p>Campus Cedro</p>
      </div>
    </aside>
  );
};
