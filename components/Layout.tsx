
import React from 'react';
import { UserRole } from '../types';
import { LogOut, Bell, User as UserIcon, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, userName, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabecera Corporativa Original */}
      <header className="bg-brand-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-white" />
              <span className="text-xl font-black tracking-tight">CAMPUS MASPORMENOS</span>
            </div>
            
            <div className="flex items-center gap-4">
              {userRole !== UserRole.NONE && (
                <div className="flex items-center gap-3 border-l border-brand-500 pl-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-brand-100 uppercase">Conectado como</p>
                    <p className="text-sm font-bold">{userName}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-brand-700 flex items-center justify-center border border-brand-400">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 hover:bg-brand-700 rounded-full transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer sencillo */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Maspormenos - Formación Interna Inteligente
        </div>
      </footer>
    </div>
  );
};

export default Layout;
