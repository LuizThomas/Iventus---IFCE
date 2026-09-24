import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';

// Auth views
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';

// Participant views
import { EventCatalog } from './components/participant/EventCatalog';
import { MyRegistrations } from './components/participant/MyRegistrations';
import { MyCertificates } from './components/participant/MyCertificates';

// Professor views
import { MyEvents } from './components/professor/MyEvents';
import { AttendanceView } from './components/professor/AttendanceView';

// Admin views
import { AdminEvents } from './components/admin/AdminEvents';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminCoursesSemesters } from './components/admin/AdminCoursesSemesters';
import { AdminReports } from './components/admin/AdminReports';
import { AdminSettings } from './components/admin/AdminSettings';

// Shared views
import { ProfileView } from './components/profile/ProfileView';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('events');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [selectedAttendanceEventId, setSelectedAttendanceEventId] = useState<number | undefined>(undefined);

  const handleNavigate = (view: string, token?: string) => {
    if (token) setResetToken(token);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAttendance = (eventId: number) => {
    setSelectedAttendanceEventId(eventId);
    setCurrentView('professor_attendance');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#168038]/20 border-t-[#168038] rounded-full animate-spin" />
          <span className="text-xs font-bold text-neutral-500 tracking-wider uppercase">
            Carregando IFCE Iventus...
          </span>
        </div>
      </div>
    );
  }

  // Standalone Auth Screens
  if (currentView === 'login') {
    return <LoginView onNavigate={handleNavigate} />;
  }

  if (currentView === 'register') {
    return <RegisterView onNavigate={handleNavigate} />;
  }

  if (currentView === 'forgot_password') {
    return <ForgotPasswordView onNavigate={handleNavigate} />;
  }

  if (currentView === 'reset_password') {
    return <ResetPasswordView token={resetToken} onNavigate={handleNavigate} />;
  }

  // Render appropriate content view with security role checks
  const renderContentView = () => {
    switch (currentView) {
      // Participant views
      case 'events':
      case 'home':
        return <EventCatalog searchQuery={searchQuery} />;
      case 'my_registrations':
        return <MyRegistrations />;
      case 'my_certificates':
        return <MyCertificates />;

      // Professor views
      case 'professor_events':
      case 'professor_dashboard':
        return <MyEvents onNavigateToAttendance={handleNavigateToAttendance} />;
      case 'professor_attendance':
        return <AttendanceView initialEventId={selectedAttendanceEventId} />;

      // Administrator views
      case 'admin_events':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminEvents />
        ) : (
          <EventCatalog searchQuery={searchQuery} />
        );
      case 'admin_users':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminUsers />
        ) : (
          <EventCatalog searchQuery={searchQuery} />
        );
      case 'admin_certificates':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminReports />
        ) : (
          <MyCertificates />
        );
      case 'admin_courses':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminCoursesSemesters />
        ) : (
          <EventCatalog searchQuery={searchQuery} />
        );
      case 'admin_reports':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminReports />
        ) : (
          <EventCatalog searchQuery={searchQuery} />
        );
      case 'admin_settings':
        return user?.perfil === 'ADMINISTRADOR' ? (
          <AdminSettings />
        ) : (
          <ProfileView />
        );

      // Shared
      case 'profile':
        return <ProfileView />;

      default:
        return <EventCatalog searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-neutral-900">
      {/* Top Bar Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={handleNavigate}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex pb-16 md:pb-0">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        
        <main className="flex-1 min-w-0 overflow-y-auto">
          {renderContentView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
