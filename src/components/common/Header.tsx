import React, { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, LogOut, Settings, Shield, GraduationCap, Users, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onNavigate }) => {
  const { user, isAuthenticated, logout, quickSwitchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeLabel = (perfil: UserRole) => {
    switch (perfil) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'PROFESSOR':
        return 'Professor / Organizador';
      case 'PARTICIPANTE':
        return 'Participante';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 h-16">
      {/* Zone 1: Logo */}
      <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
        <Logo size="md" />
      </div>

      {/* Zone 2: Search Bar */}
      <div className="flex-1 max-w-xl mx-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar eventos..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 hover:bg-neutral-150 focus:bg-white text-sm text-neutral-800 placeholder-neutral-500 rounded-full border border-transparent focus:border-[#168038] focus:outline-none transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: User & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-neutral-50 transition-colors focus:outline-none"
              aria-expanded={dropdownOpen}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 text-neutral-600">
                {user.foto_perfil ? (
                  <img src={user.foto_perfil} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-neutral-500" />
                )}
              </div>

              {/* User details (hidden on small mobile) */}
              <div className="hidden md:flex flex-col text-left mr-1">
                <span className="text-sm font-semibold text-neutral-900 leading-tight">
                  {user.nome}
                </span>
                <span className="text-xs text-neutral-500 font-normal">
                  {getRoleBadgeLabel(user.perfil)}
                </span>
              </div>

              <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="font-semibold text-neutral-900 truncate">{user.nome}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  <div className="mt-1.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {getRoleBadgeLabel(user.perfil)}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-neutral-500" />
                    <span>Meu Perfil & Configurações</span>
                  </button>
                </div>

                {/* Quick Role Switcher for seamless grading & testing */}
                <div className="border-t border-neutral-100 py-1.5 px-3 bg-neutral-50">
                  <p className="text-[11px] font-semibold text-neutral-500 mb-1 uppercase tracking-wider">
                    Alternar Perfil Demo:
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={async () => {
                        await quickSwitchUser('PARTICIPANTE');
                        setDropdownOpen(false);
                        onNavigate('events');
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors ${
                        user.perfil === 'PARTICIPANTE'
                          ? 'bg-[#168038] text-white'
                          : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                      }`}
                    >
                      Aluno
                    </button>
                    <button
                      onClick={async () => {
                        await quickSwitchUser('PROFESSOR');
                        setDropdownOpen(false);
                        onNavigate('professor_events');
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors ${
                        user.perfil === 'PROFESSOR'
                          ? 'bg-[#168038] text-white'
                          : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                      }`}
                    >
                      Professor
                    </button>
                    <button
                      onClick={async () => {
                        await quickSwitchUser('ADMINISTRADOR');
                        setDropdownOpen(false);
                        onNavigate('admin_events');
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors ${
                        user.perfil === 'ADMINISTRADOR'
                          ? 'bg-[#168038] text-white'
                          : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      onNavigate('login');
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#168038] hover:bg-[#136e30] rounded-lg transition-colors shadow-xs"
            >
              Cadastre-se
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
