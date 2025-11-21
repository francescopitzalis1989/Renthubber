
import React from 'react';
import { Menu, PlusCircle, MessageSquare, Wallet, LogOut, LayoutDashboard, RefreshCw } from 'lucide-react';
import { User, ActiveMode } from '../types';

interface HeaderProps {
  setView: (view: string) => void;
  currentView: string;
  currentUser: User | null;
  activeMode: ActiveMode;
  onSwitchMode: (mode: ActiveMode) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  setView, currentView, currentUser, activeMode, onSwitchMode, onLogout 
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-brand">Renthubber</span>
          </div>

          {/* Desktop Nav - VISIBLE ONLY IF LOGGED IN */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-6">
               {/* Mode Switcher */}
               <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-4">
                  <button 
                    onClick={() => onSwitchMode('renter')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeMode === 'renter' ? 'bg-white shadow text-brand' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Renter
                  </button>
                  <button 
                    onClick={() => onSwitchMode('hubber')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeMode === 'hubber' ? 'bg-white shadow text-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Hubber
                  </button>
               </div>

               <button 
                  onClick={() => setView('dashboard')}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-brand ${currentView === 'dashboard' ? 'text-brand' : 'text-gray-500'}`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </button>
                
                {/* Show Publish ONLY if active mode is Hubber */}
                {activeMode === 'hubber' && (
                  <button 
                    onClick={() => setView('publish')}
                    className={`flex items-center text-sm font-medium transition-colors hover:text-brand ${currentView === 'publish' ? 'text-brand' : 'text-gray-500'}`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Pubblica
                  </button>
                )}

                <button 
                  onClick={() => setView('messages')}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-brand ${currentView === 'messages' ? 'text-brand' : 'text-gray-500'}`}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Messaggi
                </button>
                <button 
                  onClick={() => setView('wallet')}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-brand ${currentView === 'wallet' ? 'text-brand' : 'text-gray-500'}`}
                >
                  <Wallet className="w-4 h-4 mr-1.5" />
                  Wallet
                </button>
            </nav>
          )}

          {/* User & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                 <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-sm font-semibold text-gray-900">{currentUser.name}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${activeMode === 'hubber' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {activeMode}
                    </span>
                 </div>
                 
                 <div className="relative group">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full pl-1 pr-1 py-1 cursor-pointer hover:shadow-md transition-shadow">
                      <Menu className="w-4 h-4 text-gray-600 mx-2" />
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" 
                      />
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 hidden group-hover:block">
                       <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                          <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                       </div>
                       
                       {/* Mobile Switcher */}
                       <div className="md:hidden px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-2">
                          <button onClick={() => onSwitchMode('renter')} className={`flex-1 text-xs font-bold py-1 rounded ${activeMode === 'renter' ? 'bg-white shadow' : 'text-gray-500'}`}>Renter</button>
                          <button onClick={() => onSwitchMode('hubber')} className={`flex-1 text-xs font-bold py-1 rounded ${activeMode === 'hubber' ? 'bg-white shadow' : 'text-gray-500'}`}>Hubber</button>
                       </div>

                       <button 
                         onClick={() => setView('dashboard')}
                         className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                       >
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                       </button>
                       
                       {activeMode === 'hubber' && (
                         <button 
                           onClick={() => setView('my-listings')}
                           className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                         >
                            <PlusCircle className="w-4 h-4 mr-2" /> I miei annunci
                         </button>
                       )}

                       <button 
                         onClick={() => setView('wallet')}
                         className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                       >
                          <Wallet className="w-4 h-4 mr-2" /> Wallet {activeMode === 'renter' ? '(Renter)' : '(Hubber)'}
                       </button>
                       <button 
                         onClick={onLogout}
                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                       >
                          <LogOut className="w-4 h-4 mr-2" /> Esci
                       </button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setView('signup')}
                  className="text-gray-600 hover:text-brand font-medium text-sm"
                >
                  Accedi
                </button>
                <button 
                  onClick={() => setView('signup')}
                  className="bg-brand hover:bg-brand-dark text-white text-sm font-bold py-2 px-4 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Registrati
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
