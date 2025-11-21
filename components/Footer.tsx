import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
               <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-lg text-brand">Renthubber</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              La piattaforma di sharing economy per noleggiare oggetti e spazi in sicurezza. Risparmia, guadagna e riduci gli sprechi.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Renthubber</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-brand">Chi siamo</a></li>
              <li><a href="#" className="hover:text-brand">Come funziona</a></li>
              <li><a href="#" className="hover:text-brand">Sicurezza</a></li>
              <li><a href="#" className="hover:text-brand">Investitori</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Supporto</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-brand">Centro assistenza</a></li>
              <li><a href="#" className="hover:text-brand">Regole di cancellazione</a></li>
              <li><a href="#" className="hover:text-brand">Contattaci</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2024 Renthubber Italia S.r.l.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Termini</a>
            <a href="#" className="hover:text-gray-600">Mappa del sito</a>
          </div>
        </div>
      </div>
    </footer>
  );
};